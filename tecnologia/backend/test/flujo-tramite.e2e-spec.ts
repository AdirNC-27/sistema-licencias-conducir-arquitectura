import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configurarAplicacion } from '../src/configuracion/aplicacion';
import { VERIFICADOR_IDENTIDAD } from '../src/modulos/postulantes/dominio/contratos';

/**
 * Pruebas de la API con PostgreSQL real (base licencias_test).
 * Recorren el trámite completo y comprueban EQ-01, EQ-02, EQ-07 y EQ-09.
 */
describe('Flujo completo del trámite de emisión (e2e)', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  const tokens: Record<string, string> = {};
  let expedienteId = 0;
  let evaluacionId = 0;

  const pdf = Buffer.from('%PDF-1.4 prueba');
  const auth = (rol: string) => ({ Authorization: `Bearer ${tokens[rol]}` });

  beforeAll(async () => {
    process.env.DB_NOMBRE = process.env.DB_NOMBRE_PRUEBAS ?? 'licencias_test';
    process.env.JWT_SECRETO = process.env.JWT_SECRETO ?? 'secreto-de-pruebas';
    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      // API Perú se reemplaza solo en las pruebas para no gastar consultas del token real
      .overrideProvider(VERIFICADOR_IDENTIDAD)
      .useValue({ consultar: async (dni: string) => ({ dni, nombres: 'ANA LUCIA', apellidoPaterno: 'HUAMAN', apellidoMaterno: 'CCORAHUA' }) })
      .compile();
    app = configurarAplicacion(modulo.createNestApplication());
    await app.init();
    const ds = app.get(DataSource);
    await ds.query('TRUNCATE auditoria, notificaciones, evaluaciones, citas, pagos, documentos, expedientes RESTART IDENTITY');
    await ds.query(`DELETE FROM usuarios WHERE usuario = '70112233'`);
    await ds.query(`DELETE FROM postulantes WHERE dni = '70112233'`);
    await ds.query('UPDATE cupos SET ocupados = 0');
    http = request(app.getHttpServer());
    for (const u of ['gestor', 'evaluador', 'supervisor', 'admin', '45892014']) {
      const r = await http.post('/api/auth/login').send({ usuario: u, clave: 'demo123' }).expect(200);
      tokens[u] = r.body.token;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Seguridad (EQ-01)', () => {
    it('sin token responde 401', async () => {
      await http.get('/api/expedientes').expect(401);
      await http.post('/api/expedientes').send({}).expect(401);
    });

    it('credenciales incorrectas responden 401', async () => {
      await http.post('/api/auth/login').send({ usuario: 'gestor', clave: 'mala' }).expect(401);
    });

    it.each([
      ['45892014', 'get', '/api/expedientes'],
      ['45892014', 'get', '/api/usuarios'],
      ['45892014', 'get', '/api/auditoria'],
      ['evaluador', 'patch', '/api/expedientes/1/emision'],
      ['evaluador', 'post', '/api/evaluaciones/1/validacion'],
      ['gestor', 'post', '/api/expedientes/1/evaluaciones/CONOCIMIENTOS/resultado'],
      ['gestor', 'post', '/api/cupos'],
      ['supervisor', 'patch', '/api/pagos/1/verificacion'],
      ['supervisor', 'patch', '/api/usuarios/1/rol'],
      ['admin', 'post', '/api/expedientes'],
    ])('%s no puede %s %s (403)', async (rol, metodo, ruta) => {
      await (http as unknown as Record<string, (r: string) => request.Test>)[metodo](ruta).set(auth(rol)).send({}).expect(403);
    });
  });

  it('requisitos públicos con caché (RF22)', async () => {
    const r = await http.get('/api/requisitos?categoria=II-C').expect(200);
    expect(r.body.tasa).toBe(69.4);
    expect(r.body.requisitos.map((x: { documento: string }) => x.documento)).toContain('CONSTANCIA_COFIPRO');
  });

  it('registra un postulante nuevo con DNI (RF03, RF04)', async () => {
    const r = await http.post('/api/postulantes').send({ dni: '70112233', correo: 'ana@correo.pe', celular: '912345678', clave: 'clave123' }).expect(201);
    expect(r.body.nombre).toBe('ANA LUCIA HUAMAN CCORAHUA');
    await http.post('/api/postulantes').send({ dni: '70112233', correo: 'ana@correo.pe', celular: '912345678', clave: 'clave123' }).expect(409);
    const login = await http.post('/api/auth/login').send({ usuario: '70112233', clave: 'clave123' }).expect(200);
    tokens.ana = login.body.token;
  });

  it('el personal consulta nombres de postulantes; un postulante no ve a otro', async () => {
    const r = await http.get('/api/postulantes?ids=1').set(auth('gestor')).expect(200);
    expect(r.body[0].dni).toBe('45892014');
    await http.get('/api/postulantes/1').set(auth('ana')).expect(403);
    await http.get('/api/postulantes?ids=1').set(auth('ana')).expect(403);
  });

  it('el postulante crea su expediente II-C (RF02)', async () => {
    const r = await http.post('/api/expedientes').set(auth('45892014')).send({ tipoTramite: 'EMISION', categoria: 'II-C' }).expect(201);
    expedienteId = r.body.id;
    expect(r.body.etapa).toBe('DOCUMENTOS');
    await http.post('/api/expedientes').set(auth('45892014')).send({ tipoTramite: 'EMISION', categoria: 'II-C' }).expect(409);
  });

  it('privacidad: otro postulante no ve el expediente ni sus documentos (EQ-02)', async () => {
    for (let i = 0; i < 10; i++) {
      await http.get(`/api/expedientes/${expedienteId}`).set(auth('ana')).expect(403);
      await http.get(`/api/expedientes/${expedienteId}/documentos`).set(auth('ana')).expect(403);
    }
  });

  it('sube los 4 documentos y el gestor los aprueba: pasa a PAGO (RF03, RF04)', async () => {
    const hoy = new Date().toISOString().slice(0, 10);
    for (const tipo of ['DECLARACION_JURADA', 'CERTIFICADO_MEDICO', 'FOTOGRAFIA', 'CONSTANCIA_COFIPRO']) {
      await http
        .post(`/api/expedientes/${expedienteId}/documentos`)
        .set(auth('45892014'))
        .field('tipo', tipo)
        .field('fechaEmision', hoy)
        .attach('archivo', pdf, { filename: `${tipo}.pdf`, contentType: 'application/pdf' })
        .expect(201);
    }
    const docs = await http.get(`/api/expedientes/${expedienteId}/documentos`).set(auth('gestor')).expect(200);
    await http.get(`/api/documentos/${docs.body[0].id}/archivo`).set(auth('ana')).expect(403);
    await http.get(`/api/documentos/${docs.body[0].id}/archivo`).expect(401);
    await http.patch(`/api/documentos/${docs.body[2].id}/revision`).set(auth('gestor')).send({ estado: 'OBSERVADO' }).expect(422);
    for (const d of docs.body) {
      await http.patch(`/api/documentos/${d.id}/revision`).set(auth('gestor')).send({ estado: 'APROBADO' }).expect(200);
    }
    const exp = await http.get(`/api/expedientes/${expedienteId}`).set(auth('45892014')).expect(200);
    expect(exp.body.etapa).toBe('PAGO');
  });

  it('registra el pago con la tasa exacta y el gestor lo verifica: pasa a CITA (RF05, RF06)', async () => {
    await http.post(`/api/expedientes/${expedienteId}/pagos`).set(auth('45892014')).send({ numeroOperacion: 'E2E-001', monto: 69.9, fechaPago: '2026-11-18' }).expect(422);
    const p = await http.post(`/api/expedientes/${expedienteId}/pagos`).set(auth('45892014')).send({ numeroOperacion: 'E2E-001', monto: 69.4, fechaPago: '2026-11-18' }).expect(201);
    await http.patch(`/api/pagos/${p.body.id}/verificacion`).set(auth('gestor')).send({ estado: 'VERIFICADO' }).expect(200);
    const exp = await http.get(`/api/expedientes/${expedienteId}`).set(auth('gestor')).expect(200);
    expect(exp.body.etapa).toBe('CITA');
  });

  it('reserva la cita de conocimientos con cupo: pasa a EXAMEN_CONOCIMIENTOS (RF07, RF21)', async () => {
    const cupos = await http.get('/api/cupos?tipo=CONOCIMIENTOS').set(auth('45892014')).expect(200);
    expect(cupos.body.length).toBeGreaterThan(0);
    await http.post(`/api/expedientes/${expedienteId}/citas`).set(auth('45892014')).send({ cupoId: cupos.body[0].id }).expect(201);
    const exp = await http.get(`/api/expedientes/${expedienteId}`).set(auth('45892014')).expect(200);
    expect(exp.body.etapa).toBe('EXAMEN_CONOCIMIENTOS');
    const citas = await http.get(`/api/expedientes/${expedienteId}/citas`).set(auth('45892014')).expect(200);
    expect(citas.body).toHaveLength(1);
    const avisos = await http.get('/api/notificaciones/mias').set(auth('45892014')).expect(200);
    expect(avisos.body.some((a: { asunto: string }) => a.asunto.startsWith('Recordatorio'))).toBe(true);
  });

  it('registra, corrige y valida conocimientos; el resultado validado queda bloqueado (RF08, RF09, EQ-09)', async () => {
    const r = await http.post(`/api/expedientes/${expedienteId}/evaluaciones/CONOCIMIENTOS/resultado`).set(auth('evaluador')).send({ puntaje: 12 }).expect(201);
    evaluacionId = r.body.id;
    expect(r.body.intentos).toBe(1);
    const pendientes = await http.get('/api/evaluaciones/por-validar').set(auth('supervisor')).expect(200);
    expect(pendientes.body.map((e: { id: number }) => e.id)).toContain(evaluacionId);
    await http.patch(`/api/evaluaciones/${evaluacionId}/resultado`).set(auth('evaluador')).send({ puntaje: 17, motivo: 'Error de digitación' }).expect(200);
    await http.post(`/api/evaluaciones/${evaluacionId}/validacion`).set(auth('supervisor')).expect(200);
    await http.patch(`/api/evaluaciones/${evaluacionId}/resultado`).set(auth('evaluador')).send({ puntaje: 20, motivo: 'cambio' }).expect(409);
    await http.post(`/api/evaluaciones/${evaluacionId}/validacion`).set(auth('supervisor')).expect(409);
    const evs = await http.get(`/api/expedientes/${expedienteId}/evaluaciones`).set(auth('45892014')).expect(200);
    expect(evs.body[0].historial[0].puntaje).toBe(17);
  });

  it('manejo aprobado y validado lleva a EMISION; el supervisor autoriza (RF12)', async () => {
    const m = await http.post(`/api/expedientes/${expedienteId}/evaluaciones/MANEJO/resultado`).set(auth('evaluador')).send({ puntaje: 16, faltaEliminatoria: false }).expect(201);
    await http.post(`/api/evaluaciones/${m.body.id}/validacion`).set(auth('supervisor')).expect(200);
    const e = await http.patch(`/api/expedientes/${expedienteId}/emision`).set(auth('supervisor')).expect(200);
    expect(e.body.etapa).toBe('EMITIDA');
  });

  it('las operaciones importantes quedan en auditoría con usuario, fecha y valores (EQ-07)', async () => {
    const r = await http.get('/api/auditoria').set(auth('admin')).expect(200);
    const acciones = new Set(r.body.map((a: { accion: string }) => a.accion));
    for (const accion of ['APROBAR_DOCUMENTO', 'VERIFICAR_PAGO', 'REGISTRAR_RESULTADO', 'CORREGIR_RESULTADO', 'VALIDAR_RESULTADO', 'CAMBIAR_ETAPA', 'AUTORIZAR_EMISION', 'INTENTO_MODIFICAR_BLOQUEADO']) {
      expect(acciones).toContain(accion);
    }
    const fila = r.body.find((a: { accion: string }) => a.accion === 'CORREGIR_RESULTADO');
    expect(fila).toMatchObject({ motivo: 'Error de digitación', valorAnterior: { puntaje: 12 } });
    expect(fila.usuarioId).toBeGreaterThan(0);
    expect(fila.fecha).toBeDefined();
  });

  it('el administrador cambia un rol y queda auditado; el endpoint de salud responde', async () => {
    const usuarios = await http.get('/api/usuarios').set(auth('admin')).expect(200);
    const evaluador = usuarios.body.find((u: { usuario: string }) => u.usuario === 'evaluador');
    await http.patch(`/api/usuarios/${evaluador.id}/rol`).set(auth('admin')).send({ rol: 'SUPERVISOR' }).expect(200);
    await http.patch(`/api/usuarios/${evaluador.id}/rol`).set(auth('admin')).send({ rol: 'EVALUADOR' }).expect(200);
    const r = await http.get('/api/auditoria?entidad=usuario').set(auth('admin')).expect(200);
    expect(r.body[0].accion).toBe('CAMBIAR_ROL');
    await http.get('/api/health').expect(200);
  });
});
