import { ConflictoError, RecursoNoEncontradoError, ReglaNegocioError } from '../../../compartido/dominio/errores';
import { Categoria } from '../../../compartido/dominio/categoria';
import { Rol } from '../../../compartido/dominio/rol';
import { CONTENIDOS_INICIALES } from '../../../migraciones/1795094100000-asistente-virtual';
import { eventosFalsos, expediente, ExpedientesEnMemoria, usuario } from '../../../test-utils/fakes';
import { Etapa } from '../../expedientes/dominio/etapa';
import { AtenderConsultasUseCase, ConsultarAsistenteUseCase, GestionarContenidosUseCase } from '../aplicacion/casos-de-uso';
import { buscarContenidos, fueraDeAlcance, normalizar, terminos } from '../dominio/buscador';
import { ConsultaAsistente, MENSAJE_ACCION, MENSAJE_SIN_RESPUESTA, OrigenRespuesta } from '../dominio/consulta';
import { ContenidoAprobado, DatosContenido, TemaContenido, validarContenido } from '../dominio/contenido';
import { AsistenteIA, RedaccionIA, RepositorioConsultas, RepositorioContenidos } from '../dominio/contratos';
import { describirEstado } from '../dominio/estado-tramite';
import { afirmaAccion, anonimizar, clasificar, Intencion } from '../dominio/intencion';

const CONTENIDOS: ContenidoAprobado[] = CONTENIDOS_INICIALES.map(([tema, pregunta, respuesta, palabrasClave], i) => ({
  id: i + 1,
  tema: tema as TemaContenido,
  pregunta,
  respuesta,
  palabrasClave,
  activo: true,
}));
const id = (texto: string) => CONTENIDOS.find((c) => c.pregunta === texto)!.id;

class RepoContenidos implements RepositorioContenidos {
  constructor(public datos: ContenidoAprobado[] = [...CONTENIDOS]) {}
  async activos() {
    return this.datos.filter((c) => c.activo);
  }
  async todos() {
    return this.datos;
  }
  async buscarPorId(n: number) {
    const c = this.datos.find((x) => x.id === n);
    if (!c) throw new RecursoNoEncontradoError('no');
    return c;
  }
  async crear(d: DatosContenido) {
    const c = { id: this.datos.length + 1, ...d };
    this.datos.push(c);
    return c;
  }
  async actualizar(c: ContenidoAprobado) {
    this.datos = this.datos.map((x) => (x.id === c.id ? c : x));
    return c;
  }
}

class RepoConsultas implements RepositorioConsultas {
  datos: ConsultaAsistente[] = [];
  async registrar(d: { postulanteId: number; pregunta: string; respuesta: string; origen: OrigenRespuesta; fuentes: number[] }) {
    const c = new ConsultaAsistente(this.datos.length + 1, d.postulanteId, d.pregunta, d.respuesta, d.origen, d.fuentes, new Date());
    this.datos.push(c);
    return c;
  }
  async buscarPorId(n: number) {
    const c = this.datos.find((x) => x.id === n);
    if (!c) throw new RecursoNoEncontradoError('no');
    return c;
  }
  async dePostulante(p: number) {
    return this.datos.filter((c) => c.postulanteId === p);
  }
  async derivadas(pendientes: boolean) {
    return this.datos.filter((c) => c.derivada && (pendientes ? !c.respuestaGestor : Boolean(c.respuestaGestor)));
  }
  async guardarRespuestaGestor() {}
}

class IAFalsa implements AsistenteIA {
  recibido: { pregunta: string; contenidos: ContenidoAprobado[] } | null = null;
  constructor(
    public disponible = true,
    private readonly salida: RedaccionIA | null = { respuesta: 'La tasa para mototaxi es S/ 69.40.', confiable: true },
  ) {}
  async redactar(pregunta: string, contenidos: ContenidoAprobado[]) {
    this.recibido = { pregunta, contenidos };
    return this.salida;
  }
}

const postulante = usuario(Rol.POSTULANTE, { id: 6, postulanteId: 10 });

describe('Asistente · búsqueda en el contenido aprobado (RF15)', () => {
  it('normaliza tildes, categorías y "moto taxi"', () => {
    expect(normalizar('¿Cuánto cuesta la II-C?')).toBe('cuanto cuesta la mototaxi');
    expect(normalizar('Moto taxi')).toBe('mototaxi');
    expect(terminos('¿Cuánto cuesta el brevete?')).toEqual(['costo', 'licencia']);
  });

  it.each([
    ['Hola, ¿qué papeles me piden para sacar brevete de moto lineal?', '¿Qué requisitos necesito para la licencia II-B de moto?'],
    ['¿En qué banco puedo pagar la tasa?', '¿Dónde pago la tasa?'],
    ['Si jalo el examen, ¿debo volver a pagar?', '¿Tengo que pagar otra vez si desapruebo un examen?'],
    ['¿Por cuántos meses es válido el certificado médico?', '¿Cuánto tiempo vale el certificado médico?'],
    ['¿Los exámenes de manejo son los sábados?', '¿Qué días son los exámenes?'],
    ['¿Cuántos días demora en salir la licencia?', '¿Cuánto demora el trámite?'],
  ])('"%s" encuentra el contenido correcto', (pregunta, esperado) => {
    expect(buscarContenidos(pregunta, CONTENIDOS)[0].contenido.id).toBe(id(esperado));
  });

  it.each(['¿Quién ganó el partido de fútbol ayer?', '¿Cuál es la capital de Francia?', '¿Cuánto cuesta el SOAT para mi mototaxi?', '¿Cómo saco mi pasaporte?', 'hola'])(
    '"%s" no tiene contenido aprobado',
    (pregunta) => {
      expect(buscarContenidos(pregunta, CONTENIDOS)).toEqual([]);
    },
  );

  it('reconoce temas fuera de alcance y devuelve como máximo 3 contenidos', () => {
    expect(fueraDeAlcance('placa de mi mototaxi')).toBe(true);
    expect(fueraDeAlcance('licencia de mototaxi')).toBe(false);
    expect(buscarContenidos('requisitos licencia moto mototaxi', CONTENIDOS).length).toBeLessThanOrEqual(3);
    expect(buscarContenidos('requisitos', [])).toEqual([]);
  });
});

describe('Asistente · intención y protección de datos (RC06, DA06)', () => {
  it.each([
    ['Aprueba mi expediente por favor', Intencion.ACCION],
    ['¿Puedes cambiar mi nota del examen de manejo a 18?', Intencion.ACCION],
    ['Necesito que valides mi pago hoy mismo', Intencion.ACCION],
    ['Dame mi licencia ya', Intencion.ACCION],
    ['¿Pueden cambiar la nota de mi examen de manejo?', Intencion.ACCION],
    ['Revisen otra vez mi foto, por favor', Intencion.ACCION],
    ['¿Podría verificar mi pago hoy?', Intencion.ACCION],
    ['Por favor aprueben mis documentos', Intencion.ACCION],
    ['¿Cómo va mi trámite?', Intencion.ESTADO],
    ['¿En qué etapa estoy?', Intencion.ESTADO],
    ['¿Qué requisitos tiene mi trámite de mototaxi?', Intencion.CONSULTA],
    ['¿Puedo reprogramar mi cita?', Intencion.CONSULTA],
    ['¿Quién aprueba la licencia?', Intencion.CONSULTA],
    ['¿Quién revisa los documentos?', Intencion.CONSULTA],
    ['¿Pueden ir dos personas al examen?', Intencion.CONSULTA],
    ['¿Se puede reprogramar la cita?', Intencion.CONSULTA],
  ])('"%s" → %s', (pregunta, esperada) => {
    expect(clasificar(pregunta)).toBe(esperada);
  });

  it('oculta DNI, celulares y correos antes de enviar la pregunta a la IA', () => {
    expect(anonimizar('Mi DNI es 45892014, celular 987654321 y correo juan.q@gmail.com')).toBe('Mi DNI es [número], celular [número] y correo [correo]');
  });

  it('detecta cuando un texto afirma haber hecho una acción', () => {
    expect(afirmaAccion('Listo, ya registrado tu pago')).toBe(true);
    expect(afirmaAccion('He aprobado tu expediente')).toBe(true);
    expect(afirmaAccion('El gestor verifica tu pago en el SAT')).toBe(false);
  });
});

describe('Asistente · estado del trámite y entidades', () => {
  const hoy = new Date('2026-11-18T12:00:00Z');

  it('describe la etapa, el plazo y el siguiente paso', () => {
    expect(describirEstado(expediente(Etapa.PAGO), hoy)).toBe(
      'Tu trámite EXP-2026-00001 (II-C) está en la etapa: pago. Lleva 2 de 10 días hábiles del plazo legal. Siguiente paso: paga la tasa en el SAT Huamanga o en el banco y registra el número de operación en «Pago».',
    );
    expect(describirEstado(expediente(Etapa.EMITIDA, Categoria.II_B), hoy)).toContain('licencia emitida');
    expect(describirEstado(null)).toContain('Aún no tienes un trámite');
  });

  it('valida el contenido aprobado', () => {
    expect(() => validarContenido({ tema: TemaContenido.PAGOS, pregunta: '¿?', respuesta: 'Respuesta larga suficiente', palabrasClave: '', activo: true })).toThrow(ReglaNegocioError);
    expect(() => validarContenido({ tema: TemaContenido.PAGOS, pregunta: '¿Cuánto cuesta?', respuesta: 'corta', palabrasClave: '', activo: true })).toThrow(ReglaNegocioError);
    expect(validarContenido({ tema: TemaContenido.PAGOS, pregunta: ' ¿Cuánto cuesta? ', respuesta: ' S/ 69.90 la II-B ', palabrasClave: ' precio ', activo: true })).toEqual({
      tema: TemaContenido.PAGOS,
      pregunta: '¿Cuánto cuesta?',
      respuesta: 'S/ 69.90 la II-B',
      palabrasClave: 'precio',
      activo: true,
    });
  });

  it('solo se responden consultas derivadas, una vez y con texto', () => {
    const normal = new ConsultaAsistente(1, 10, '¿Cuánto cuesta?', 'S/ 69.40', OrigenRespuesta.CONTENIDO, [3], new Date());
    expect(() => normal.responder('Respuesta del gestor', 2)).toThrow(ReglaNegocioError);
    const derivada = new ConsultaAsistente(2, 10, '¿Hay examen el feriado?', MENSAJE_SIN_RESPUESTA, OrigenRespuesta.DERIVADA, [], new Date());
    expect(() => derivada.responder('ok', 2)).toThrow(ReglaNegocioError);
    derivada.responder('No, los feriados no hay exámenes.', 2);
    expect(derivada.gestorId).toBe(2);
    expect(derivada.respondidaEn).toBeInstanceOf(Date);
    expect(() => derivada.responder('Otra respuesta del gestor', 2)).toThrow(ConflictoError);
  });
});

describe('Casos de uso del asistente (RF14, RF15)', () => {
  const crear = (ia: AsistenteIA = new IAFalsa(false), etapa = Etapa.PAGO) => {
    const consultas = new RepoConsultas();
    const caso = new ConsultarAsistenteUseCase(new RepoContenidos(), consultas, ia, new ExpedientesEnMemoria(expediente(etapa)));
    return { caso, consultas };
  };

  it('sin IA configurada entrega el contenido aprobado tal cual', async () => {
    const { caso } = crear();
    const r = await caso.preguntar(postulante, '  ¿Cuánto   cuesta la licencia?  ');
    expect(r).toEqual(expect.objectContaining({ pregunta: '¿Cuánto cuesta la licencia?', origen: OrigenRespuesta.CONTENIDO, derivada: false, fuentes: [id('¿Cuánto cuesta la licencia?')] }));
    expect(r.respuesta).toContain('S/ 69.40');
  });

  it('con IA, envía la pregunta anonimizada y solo el contenido encontrado', async () => {
    const ia = new IAFalsa();
    const { caso } = crear(ia);
    const r = await caso.preguntar(postulante, 'Mi DNI es 45892014, ¿cuánto cuesta la licencia de mototaxi?');
    expect(r.origen).toBe(OrigenRespuesta.IA);
    expect(r.respuesta).toBe('La tasa para mototaxi es S/ 69.40.');
    expect(ia.recibido?.pregunta).toContain('[número]');
    expect(ia.recibido?.contenidos.length).toBeGreaterThan(0);
    expect(r.fuentes).toEqual(ia.recibido?.contenidos.map((c) => c.id));
  });

  it('si la IA dice que el contenido no alcanza, deriva al gestor', async () => {
    const { caso } = crear(new IAFalsa(true, { respuesta: '', confiable: false }));
    const r = await caso.preguntar(postulante, '¿Cuánto cuesta la licencia?');
    expect(r).toEqual(expect.objectContaining({ origen: OrigenRespuesta.DERIVADA, derivada: true, respuesta: MENSAJE_SIN_RESPUESTA }));
  });

  it('si la IA falla o afirma haber hecho algo, entrega el contenido aprobado', async () => {
    expect((await crear(new IAFalsa(true, null)).caso.preguntar(postulante, '¿Cuánto cuesta la licencia?')).origen).toBe(OrigenRespuesta.CONTENIDO);
    const r = await crear(new IAFalsa(true, { respuesta: 'Ya registrado tu pago de S/ 69.40.', confiable: true })).caso.preguntar(postulante, '¿Cuánto cuesta la licencia?');
    expect(r.origen).toBe(OrigenRespuesta.CONTENIDO);
  });

  it('un pedido de acción se deriva sin consultar a la IA (0 acciones)', async () => {
    const ia = new IAFalsa();
    const { caso } = crear(ia);
    const r = await caso.preguntar(postulante, 'Aprueba mi expediente por favor');
    expect(r).toEqual(expect.objectContaining({ origen: OrigenRespuesta.DERIVADA, respuesta: MENSAJE_ACCION }));
    expect(ia.recibido).toBeNull();
  });

  it('una pregunta ajena al trámite se deriva', async () => {
    const r = await crear(new IAFalsa()).caso.preguntar(postulante, '¿Quién ganó el partido de fútbol ayer?');
    expect(r.derivada).toBe(true);
  });

  it('responde el estado con el expediente del propio postulante', async () => {
    const { caso } = crear(new IAFalsa(), Etapa.CITA);
    expect((await caso.preguntar(postulante, '¿Cómo va mi trámite?')).respuesta).toContain('elegir cita');
    const otro = usuario(Rol.POSTULANTE, { postulanteId: 99 });
    expect((await caso.preguntar(otro, '¿Cómo va mi trámite?')).respuesta).toContain('Aún no tienes un trámite');
  });

  it('valida la pregunta, exige un postulante y guarda el historial', async () => {
    const { caso } = crear();
    await expect(caso.preguntar(postulante, ' a ')).rejects.toThrow(ReglaNegocioError);
    await expect(caso.preguntar(postulante, 'x'.repeat(301))).rejects.toThrow(ReglaNegocioError);
    await expect(caso.preguntar(usuario(Rol.GESTOR), '¿Cuánto cuesta?')).rejects.toThrow('atiende a los postulantes');
    await caso.preguntar(postulante, '¿Cuánto cuesta la licencia?');
    expect(await caso.historial(postulante)).toHaveLength(1);
    expect(await caso.historial(usuario(Rol.GESTOR))).toEqual([]);
  });

  it('el gestor responde la derivada: se audita y se avisa al postulante', async () => {
    const { caso, consultas } = crear();
    const derivada = await caso.preguntar(postulante, '¿El examen se puede dar en quechua?');
    expect(derivada.derivada).toBe(true);
    const eventos = eventosFalsos();
    const atencion = new AtenderConsultasUseCase(consultas, eventos);
    expect(await atencion.derivadas(true)).toEqual([expect.objectContaining({ id: derivada.id, postulanteId: 10 })]);
    const r = await atencion.responder(derivada.id, 'Los feriados no hay exámenes; elige otro día.', usuario(Rol.GESTOR, { id: 2 }));
    expect(r.respuestaGestor).toBe('Los feriados no hay exámenes; elige otro día.');
    expect(eventos.emit).toHaveBeenCalledWith('auditoria.operacion', expect.objectContaining({ accion: 'RESPONDER_CONSULTA' }));
    expect(eventos.emit).toHaveBeenCalledWith('asistente.consulta-respondida', expect.objectContaining({ postulanteId: 10 }));
    expect(await atencion.derivadas(true)).toEqual([]);
    expect(await atencion.derivadas(false)).toHaveLength(1);
  });

  it('el administrador crea, modifica y desactiva contenido; el asistente deja de usarlo', async () => {
    const repo = new RepoContenidos([]);
    const eventos = eventosFalsos();
    const gestion = new GestionarContenidosUseCase(repo, eventos);
    const admin = usuario(Rol.ADMINISTRADOR, { id: 5 });
    const c = await gestion.crear({ tema: TemaContenido.CITAS, pregunta: '¿Hay exámenes en feriados?', respuesta: 'No, los feriados no se toman exámenes.', palabrasClave: 'feriado', activo: true }, admin);
    const caso = new ConsultarAsistenteUseCase(repo, new RepoConsultas(), new IAFalsa(false), new ExpedientesEnMemoria(expediente(Etapa.CITA)));
    expect((await caso.preguntar(postulante, '¿Hay examen en feriado?')).origen).toBe(OrigenRespuesta.CONTENIDO);
    await gestion.actualizar(c.id, { ...c, activo: false }, admin);
    expect((await caso.preguntar(postulante, '¿Hay examen en feriado?')).derivada).toBe(true);
    expect(await gestion.listar()).toHaveLength(1);
    expect(eventos.emit).toHaveBeenCalledWith('auditoria.operacion', expect.objectContaining({ accion: 'GESTIONAR_CONTENIDO', entidadId: c.id }));
  });
});
