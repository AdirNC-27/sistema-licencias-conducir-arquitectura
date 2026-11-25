import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configurarAplicacion } from '../src/configuracion/aplicacion';
import { ASISTENTE_IA } from '../src/modulos/asistente/dominio/contratos';
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
      // Sin IA externa: el asistente responde con el contenido aprobado y el resultado es reproducible
      .overrideProvider(ASISTENTE_IA)
      .useValue({ disponible: false, redactar: async () => null })
      .compile();
    app = configurarAplicacion(modulo.createNestApplication());
    await app.init();
    const ds = app.get(DataSource);
    await ds.query('TRUNCATE auditoria, notificaciones, evaluaciones, citas, pagos, documentos, expedientes, verificaciones_oficiales, observaciones_expediente, licencias_emitidas, consultas_asistente RESTART IDENTITY');
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

  it('un horario repetido se rechaza con 409, no con un error interno (RF21)', async () => {
    const [cupo] = (await http.get('/api/cupos?tipo=CONOCIMIENTOS').set(auth('admin')).expect(200)).body as { fecha: string; hora: string }[];
    const r = await http.post('/api/cupos').set(auth('admin')).send({ fecha: cupo.fecha, hora: cupo.hora, tipo: 'CONOCIMIENTOS', capacidad: 10 }).expect(409);
    expect(r.body).toEqual({ estado: 409, error: 'ConflictoError', mensaje: `Ya existe un horario de conocimientos el ${cupo.fecha} a las ${cupo.hora}` });
  });

  it('todos los errores tienen el mismo formato y mensajes en español', async () => {
    expect((await http.get('/api/expedientes').expect(401)).body).toEqual({ estado: 401, error: 'NoAutenticado', mensaje: 'Inicie sesión: el token falta, no es válido o expiró' });
    expect((await http.get('/api/no-existe').set(auth('gestor')).expect(404)).body.mensaje).toBe('La ruta solicitada no existe');
    const invalido = await http.post('/api/expedientes').set(auth('45892014')).send({ tipoTramite: 'EMISION', categoria: 'II-X' }).expect(400);
    expect(invalido.body.detalles).toEqual(['categoria debe ser uno de estos valores: II-B, II-C']);
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

  it('manejo aprobado y validado lleva a EMISION; sin verificaciones no se autoriza (RF12, RF24)', async () => {
    const m = await http.post(`/api/expedientes/${expedienteId}/evaluaciones/MANEJO/resultado`).set(auth('evaluador')).send({ puntaje: 16, faltaEliminatoria: false }).expect(201);
    await http.post(`/api/evaluaciones/${m.body.id}/validacion`).set(auth('supervisor')).expect(200);
    const revision = await http.get(`/api/expedientes/${expedienteId}/revision`).set(auth('supervisor')).expect(200);
    expect(revision.body).toMatchObject({ etapa: 'EMISION', listoParaEmitir: false, verificacionesObligatorias: ['SNC_CERTIFICADO_MEDICO', 'SNC_COFIPRO', 'SANCIONES'] });
    const r = await http.patch(`/api/expedientes/${expedienteId}/emision`).set(auth('supervisor')).expect(422);
    expect(r.body.mensaje).toContain('Falta verificar');
    await http.get(`/api/expedientes/${expedienteId}/revision`).set(auth('45892014')).expect(403);
  });

  it('el gestor verifica en el SNC y en el récord de sanciones; una sanción pendiente bloquea (RF24, RF27)', async () => {
    const verificar = (tipo: string, resultado: string, detalle?: string) =>
      http.post(`/api/expedientes/${expedienteId}/verificaciones`).set(auth('gestor')).send({ tipo, resultado, detalle });
    await verificar('SNC_CERTIFICADO_MEDICO', 'CONFORME', 'Certificado registrado en el SNC').expect(201);
    await verificar('SNC_COFIPRO', 'CONFORME').expect(201);
    await verificar('SANCIONES', 'NO_CONFORME').expect(422);
    await verificar('SANCIONES', 'NO_CONFORME', 'Papeleta pendiente en el récord del conductor').expect(201);
    await http.post(`/api/expedientes/${expedienteId}/verificaciones`).set(auth('supervisor')).send({ tipo: 'SANCIONES', resultado: 'CONFORME' }).expect(403);
    const bloqueada = await http.patch(`/api/expedientes/${expedienteId}/emision`).set(auth('supervisor')).expect(422);
    expect(bloqueada.body.mensaje).toContain('No conforme: Sin multas ni sanciones pendientes');
    await verificar('SANCIONES', 'CONFORME', 'Papeleta pagada; récord sin pendientes').expect(201);
    const revision = await http.get(`/api/expedientes/${expedienteId}/revision`).set(auth('gestor')).expect(200);
    expect(revision.body.verificaciones).toHaveLength(4);
    expect(revision.body.pendientes).toEqual([]);
  });

  it('el supervisor observa el expediente, el gestor lo atiende y recién se emite (RF11, RF12)', async () => {
    await http.post(`/api/expedientes/${expedienteId}/observaciones`).set(auth('supervisor')).send({ motivo: 'corto' }).expect(422);
    const o = await http.post(`/api/expedientes/${expedienteId}/observaciones`).set(auth('supervisor')).send({ motivo: 'La COFIPRO del SNC no coincide con el DNI' }).expect(201);
    await http.post(`/api/expedientes/${expedienteId}/observaciones`).set(auth('supervisor')).send({ motivo: 'Otra observación del mismo expediente' }).expect(409);
    const abiertas = await http.get('/api/observaciones/abiertas').set(auth('gestor')).expect(200);
    expect(abiertas.body).toEqual([expect.objectContaining({ id: o.body.id, numeroExpediente: 'EXP-2026-00001', estado: 'ABIERTA' })]);
    const bloqueada = await http.patch(`/api/expedientes/${expedienteId}/emision`).set(auth('supervisor')).expect(422);
    expect(bloqueada.body.mensaje).toContain('observación');
    await http.patch(`/api/observaciones/${o.body.id}/atencion`).set(auth('gestor')).send({ respuesta: 'Se volvió a consultar el SNC: la constancia es correcta' }).expect(200);
    await http.patch(`/api/observaciones/${o.body.id}/atencion`).set(auth('gestor')).send({ respuesta: 'Segunda atención de la misma' }).expect(409);
    await http.patch('/api/observaciones/999/atencion').set(auth('gestor')).send({ respuesta: 'No existe esta observación' }).expect(404);
    const e = await http.patch(`/api/expedientes/${expedienteId}/emision`).set(auth('supervisor')).expect(200);
    expect(e.body).toEqual({ expedienteId, numero: 'EXP-2026-00001', etapa: 'EMITIDA' });
    await http.post(`/api/expedientes/${expedienteId}/observaciones`).set(auth('supervisor')).send({ motivo: 'Observación después de emitir' }).expect(409);
  });

  it('el gestor registra la licencia para el SNC; el postulante la ve y recibe el aviso (RF24)', async () => {
    await http.get(`/api/expedientes/${expedienteId}/licencia`).set(auth('45892014')).expect(404);
    await http.post(`/api/expedientes/${expedienteId}/licencia`).set(auth('gestor')).send({ numero: 'Q 45' }).expect(422);
    const l = await http.post(`/api/expedientes/${expedienteId}/licencia`).set(auth('gestor')).send({ numero: 'q45892014' }).expect(201);
    expect(l.body.numero).toBe('Q45892014');
    await http.post(`/api/expedientes/${expedienteId}/licencia`).set(auth('gestor')).send({ numero: 'Q00000001' }).expect(409);
    expect((await http.get(`/api/expedientes/${expedienteId}/licencia`).set(auth('45892014')).expect(200)).body.numero).toBe('Q45892014');
    await http.post(`/api/expedientes/${expedienteId}/verificaciones`).set(auth('gestor')).send({ tipo: 'SANCIONES', resultado: 'CONFORME' }).expect(409);
    const avisos = await http.get('/api/notificaciones/mias').set(auth('45892014')).expect(200);
    expect(avisos.body[0].asunto).toBe('Tu licencia Q45892014 fue registrada');
  });

  describe('Asistente virtual con la IA de orientación (RF14, RF15, EQ-08)', () => {
    let derivadaId = 0;

    it('responde con contenido aprobado, sin inventar', async () => {
      const r = await http.post('/api/asistente/consultas').set(auth('45892014')).send({ pregunta: '¿Cuánto cuesta la licencia de mototaxi?' }).expect(201);
      expect(r.body).toMatchObject({ origen: 'CONTENIDO', derivada: false, respuestaGestor: null });
      expect(r.body.respuesta).toContain('S/ 69.40');
      expect(r.body.fuentes).toHaveLength(1);
    });

    it('responde el estado del propio trámite', async () => {
      const r = await http.post('/api/asistente/consultas').set(auth('45892014')).send({ pregunta: '¿Cómo va mi trámite?' }).expect(201);
      expect(r.body.origen).toBe('ESTADO');
      expect(r.body.respuesta).toContain('EXP-2026-00001');
      expect(r.body.respuesta).toContain('licencia emitida');
    });

    it('un pedido de acción se deriva y no cambia nada (0 acciones)', async () => {
      const auditoriaAntes = (await http.get('/api/auditoria').set(auth('admin')).expect(200)).body.length;
      const r = await http.post('/api/asistente/consultas').set(auth('45892014')).send({ pregunta: 'Aprueba mi expediente por favor' }).expect(201);
      expect(r.body).toMatchObject({ origen: 'DERIVADA', derivada: true });
      expect((await http.get('/api/auditoria').set(auth('admin')).expect(200)).body.length).toBe(auditoriaAntes);
    });

    it('una pregunta ajena al trámite se deriva al gestor, que responde', async () => {
      const r = await http.post('/api/asistente/consultas').set(auth('45892014')).send({ pregunta: '¿Quién ganó el partido de fútbol ayer?' }).expect(201);
      expect(r.body.derivada).toBe(true);
      derivadaId = r.body.id;
      const pendientes = await http.get('/api/asistente/derivadas').set(auth('gestor')).expect(200);
      expect(pendientes.body.map((c: { id: number }) => c.id)).toContain(derivadaId);
      await http.get('/api/asistente/derivadas?estado=OTRO').set(auth('gestor')).expect(400);
      await http.patch(`/api/asistente/consultas/${derivadaId}/respuesta`).set(auth('gestor')).send({ respuesta: 'Solo atendemos consultas sobre la licencia de conducir.' }).expect(200);
      await http.patch(`/api/asistente/consultas/${derivadaId}/respuesta`).set(auth('gestor')).send({ respuesta: 'Otra vez' }).expect(409);
      await http.patch('/api/asistente/consultas/1/respuesta').set(auth('gestor')).send({ respuesta: 'No era derivada' }).expect(422);
      const respondidas = await http.get('/api/asistente/derivadas?estado=RESPONDIDA').set(auth('gestor')).expect(200);
      expect(respondidas.body[0]).toMatchObject({ id: derivadaId, respuestaGestor: 'Solo atendemos consultas sobre la licencia de conducir.' });
    });

    it('el postulante ve su conversación con la respuesta del gestor; nadie más la ve (EQ-02)', async () => {
      const r = await http.get('/api/asistente/consultas/mias').set(auth('45892014')).expect(200);
      expect(r.body).toHaveLength(4);
      expect(r.body[3]).toMatchObject({ id: derivadaId, respuestaGestor: 'Solo atendemos consultas sobre la licencia de conducir.' });
      const otro = await http.post('/api/auth/login').send({ usuario: '70123456', clave: 'demo123' }).expect(200);
      expect((await http.get('/api/asistente/consultas/mias').set({ Authorization: `Bearer ${otro.body.token}` }).expect(200)).body).toEqual([]);
      await http.post('/api/asistente/consultas').set(auth('gestor')).send({ pregunta: '¿Cuánto cuesta?' }).expect(403);
      await http.get('/api/asistente/derivadas').set(auth('45892014')).expect(403);
      await http.post('/api/asistente/consultas').set(auth('45892014')).send({ pregunta: '' }).expect(400);
    });

    it('el administrador mantiene el contenido aprobado (HU25)', async () => {
      const c = await http.post('/api/asistente/contenidos').set(auth('admin')).send({ tema: 'CITAS', pregunta: '¿Hay exámenes en días feriados?', respuesta: 'No, en los feriados no se toman exámenes.', palabrasClave: 'feriado' }).expect(201);
      const r = await http.post('/api/asistente/consultas').set(auth('45892014')).send({ pregunta: '¿Hay examen en feriado?' }).expect(201);
      expect(r.body.fuentes).toEqual([c.body.id]);
      await http.put(`/api/asistente/contenidos/${c.body.id}`).set(auth('admin')).send({ tema: 'CITAS', pregunta: '¿Hay exámenes en días feriados?', respuesta: 'No, en los feriados no se toman exámenes.', activo: false }).expect(200);
      const sinContenido = await http.post('/api/asistente/consultas').set(auth('45892014')).send({ pregunta: '¿Hay examen en feriado?' }).expect(201);
      expect(sinContenido.body.derivada).toBe(true);
      await http.post('/api/asistente/contenidos').set(auth('gestor')).send({ tema: 'CITAS', pregunta: '¿Algo?', respuesta: 'Algo más largo' }).expect(403);
      await http.put('/api/asistente/contenidos/999').set(auth('admin')).send({ tema: 'CITAS', pregunta: '¿No existe?', respuesta: 'Este contenido no existe' }).expect(404);
      expect((await http.get('/api/asistente/contenidos').set(auth('gestor')).expect(200)).body.length).toBeGreaterThan(25);
    });

    it('cada rol ve sus pendientes; el postulante, sus recordatorios', async () => {
      await http.get('/api/asistente/pendientes').expect(401);
      const gestor = await http.get('/api/asistente/pendientes').set(auth('gestor')).expect(200);
      expect(gestor.body.map((p: { codigo: string }) => p.codigo)).not.toContain('LICENCIAS'); // ya se registró
      for (const rol of ['evaluador', 'supervisor', 'admin']) {
        expect(Array.isArray((await http.get('/api/asistente/pendientes').set(auth(rol)).expect(200)).body)).toBe(true);
      }
      const postulante = await http.get('/api/asistente/pendientes').set(auth('45892014')).expect(200);
      expect(postulante.body).toEqual(expect.arrayContaining([expect.objectContaining({ codigo: 'LICENCIA', texto: 'Tu licencia Q45892014 fue registrada.' })]));
    });

    it('la IA de orientación del personal responde pendientes y procedimientos, sin ejecutar nada', async () => {
      const pendientes = await http.post('/api/asistente/personal/consultas').set(auth('supervisor')).send({ pregunta: '¿Qué tengo pendiente?' }).expect(201);
      expect(pendientes.body.origen).toBe('ESTADO');
      const procedimiento = await http.post('/api/asistente/personal/consultas').set(auth('gestor')).send({ pregunta: '¿Cómo verifico un pago?' }).expect(201);
      expect(procedimiento.body).toMatchObject({ origen: 'CONTENIDO', pregunta: '¿Cómo verifico un pago?' });
      expect(procedimiento.body.respuesta).toContain('reporte del SAT');
      const contenidos = (await http.get('/api/asistente/contenidos').set(auth('admin')).expect(200)).body as { id: number; audiencia: string }[];
      expect(contenidos.find((c) => c.id === procedimiento.body.fuentes[0])?.audiencia).toBe('PERSONAL');
      const auditoriaAntes = (await http.get('/api/auditoria').set(auth('admin')).expect(200)).body.length;
      const accion = await http.post('/api/asistente/personal/consultas').set(auth('supervisor')).send({ pregunta: 'Autoriza la emisión del expediente 1' }).expect(201);
      expect(accion.body.respuesta).toContain('No ejecuto acciones');
      expect((await http.get('/api/auditoria').set(auth('admin')).expect(200)).body.length).toBe(auditoriaAntes);
      await http.post('/api/asistente/personal/consultas').set(auth('45892014')).send({ pregunta: '¿Qué tengo pendiente?' }).expect(403);
      // un procedimiento interno nunca se usa para responder al postulante
      const ciudadano = await http.post('/api/asistente/consultas').set(auth('45892014')).send({ pregunta: '¿Cómo verifico un pago en el SAT?' }).expect(201);
      expect(ciudadano.body.fuentes.every((id: number) => contenidos.find((c) => c.id === id)?.audiencia === 'POSTULANTE')).toBe(true);
    });
  });

  it('las operaciones importantes quedan en auditoría con usuario, fecha y valores (EQ-07)', async () => {
    const r = await http.get('/api/auditoria').set(auth('admin')).expect(200);
    const acciones = new Set(r.body.map((a: { accion: string }) => a.accion));
    for (const accion of [
      'APROBAR_DOCUMENTO',
      'VERIFICAR_PAGO',
      'REGISTRAR_RESULTADO',
      'CORREGIR_RESULTADO',
      'VALIDAR_RESULTADO',
      'CAMBIAR_ETAPA',
      'AUTORIZAR_EMISION',
      'INTENTO_MODIFICAR_BLOQUEADO',
      'VERIFICAR_PORTAL_OFICIAL',
      'OBSERVAR_EXPEDIENTE',
      'ATENDER_OBSERVACION',
      'REGISTRAR_LICENCIA_SNC',
      'RESPONDER_CONSULTA',
      'GESTIONAR_CONTENIDO',
    ]) {
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
