import { Categoria } from '../../../compartido/dominio/categoria';
import { ReglaNegocioError } from '../../../compartido/dominio/errores';
import { Rol } from '../../../compartido/dominio/rol';
import { CONTENIDOS_INICIALES } from '../../../migraciones/1795094100000-asistente-virtual';
import { CONTENIDOS_PERSONAL } from '../../../migraciones/1795094200000-asistente-por-rol';
import { expediente, ExpedientesEnMemoria, usuario } from '../../../test-utils/fakes';
import { TipoDocumento } from '../../documentos/dominio/documento';
import { Etapa } from '../../expedientes/dominio/etapa';
import { ResultadoVerificacion, TipoVerificacion, Verificacion } from '../../revision/dominio/verificacion';
import {
  ConsultarAsistentePersonalUseCase,
  ConsultarAsistenteUseCase,
  ConsultarPendientesUseCase,
  MENSAJE_ACCION_PERSONAL,
  MENSAJE_SIN_CONTENIDO_PERSONAL,
} from '../aplicacion/casos-de-uso';
import { ConsultaAsistente, OrigenRespuesta } from '../dominio/consulta';
import { Audiencia, ContenidoAprobado, TemaContenido } from '../dominio/contenido';
import { AsistenteIA, LecturaPendientes, RedaccionIA, RepositorioConsultas, RepositorioContenidos } from '../dominio/contratos';
import { pidePendientes } from '../dominio/intencion';
import { DatosPostulante, describirPendientes, estadoEmision, IndicadoresPersonal, pendientesDelPersonal, recordatoriosDelPostulante } from '../dominio/pendientes';

const HOY = new Date('2026-11-25T15:00:00Z'); // miércoles
const haceDias = (n: number) => new Date(HOY.getTime() - n * 86_400_000);
const codigos = (p: { codigo: string }[]) => p.map((x) => x.codigo);

const vacio = (): IndicadoresPersonal => ({
  documentosPorRevisar: 0,
  pagosPorVerificar: 0,
  observacionesAbiertas: 0,
  licenciasPorRegistrar: 0,
  consultasPendientes: [],
  derivadasUltimaSemana: 0,
  examenesSinResultado: 0,
  citasDeHoy: 0,
  citasProximas: 0,
  resultadosPorValidar: 0,
  enEmision: [],
  abiertos: [],
  cupos: [
    { fecha: '2026-11-30', tipo: 'CONOCIMIENTOS', libres: 15 },
    { fecha: '2026-11-26', tipo: 'MANEJO', libres: 8 },
  ],
});

let siguiente = 1;
const verif = (tipo: TipoVerificacion, resultado = ResultadoVerificacion.CONFORME): Verificacion => ({ id: siguiente++, expedienteId: 1, tipo, resultado, detalle: null, gestorId: 2, registradoEn: HOY });

describe('Pendientes del personal (RF14 para todos los roles)', () => {
  it('estado de un expediente en emisión según verificaciones y observaciones', () => {
    const base = { numero: 'EXP-1', categoria: Categoria.II_C, observacionAbierta: false };
    expect(estadoEmision({ ...base, verificaciones: [verif(TipoVerificacion.SNC_CERTIFICADO_MEDICO)] })).toBe('POR_VERIFICAR');
    const todas = [verif(TipoVerificacion.SNC_CERTIFICADO_MEDICO), verif(TipoVerificacion.SNC_COFIPRO), verif(TipoVerificacion.SANCIONES, ResultadoVerificacion.NO_CONFORME)];
    expect(estadoEmision({ ...base, verificaciones: todas })).toBe('NO_CONFORME');
    expect(estadoEmision({ ...base, verificaciones: [...todas, verif(TipoVerificacion.SANCIONES)] })).toBe('LISTO'); // la última constancia es la vigente
    expect(estadoEmision({ ...base, observacionAbierta: true, verificaciones: [] })).toBe('OBSERVADO');
    expect(estadoEmision({ numero: 'EXP-2', categoria: Categoria.II_B, observacionAbierta: false, verificaciones: [verif(TipoVerificacion.SNC_CERTIFICADO_MEDICO)] })).toBe('LISTO');
  });

  it('gestor: lo que debe revisar, con singular y plural, y los urgentes primero', () => {
    const i = { ...vacio(), documentosPorRevisar: 3, pagosPorVerificar: 1, observacionesAbiertas: 1, licenciasPorRegistrar: 2, consultasPendientes: [haceDias(3), HOY] };
    const p = pendientesDelPersonal(Rol.GESTOR, i, HOY);
    expect(p.map((x) => x.texto)).toEqual(
      expect.arrayContaining(['3 expedientes con documentos por revisar', '1 pago por verificar en el SAT', '2 consultas de postulantes esperan tu respuesta']),
    );
    expect(p.slice(0, 3).every((x) => x.urgente)).toBe(true);
    expect(p.find((x) => x.codigo === 'CONSULTAS')?.urgente).toBe(true); // una lleva más de 48 horas
    expect(p.find((x) => x.codigo === 'PAGOS')?.ruta).toBe('/gestor?etapa=PAGO');
    expect(pendientesDelPersonal(Rol.GESTOR, vacio(), HOY)).toEqual([]);
  });

  it('gestor y supervisor: avisa el plazo legal vencido o por vencer', () => {
    const i = { ...vacio(), abiertos: [{ numero: 'EXP-1', creadoEn: new Date('2026-11-06T12:00:00Z') }, { numero: 'EXP-2', creadoEn: new Date('2026-11-13T12:00:00Z') }, { numero: 'EXP-3', creadoEn: HOY }] };
    const p = pendientesDelPersonal(Rol.SUPERVISOR, i, HOY);
    expect(p.find((x) => x.codigo === 'PLAZO_VENCIDO')?.texto).toContain('EXP-1');
    expect(p.find((x) => x.codigo === 'PLAZO_POR_VENCER')?.texto).toBe('1 expediente vence su plazo legal en 2 días hábiles o menos: EXP-2');
    expect(codigos(pendientesDelPersonal(Rol.GESTOR, i, HOY))).toContain('PLAZO_VENCIDO');
  });

  it('evaluador y supervisor: exámenes sin resultado, validaciones y emisiones', () => {
    const listo = { numero: 'EXP-9', categoria: Categoria.II_B, observacionAbierta: false, verificaciones: [verif(TipoVerificacion.SNC_CERTIFICADO_MEDICO)] };
    const i = { ...vacio(), examenesSinResultado: 2, citasDeHoy: 4, citasProximas: 3, resultadosPorValidar: 1, enEmision: [listo, { ...listo, verificaciones: [] }] };
    expect(codigos(pendientesDelPersonal(Rol.EVALUADOR, i, HOY))).toEqual(['SIN_RESULTADO', 'CITAS_HOY', 'CITAS_PROXIMAS', 'EN_VALIDACION']);
    const supervisor = pendientesDelPersonal(Rol.SUPERVISOR, i, HOY);
    expect(supervisor.find((x) => x.codigo === 'LISTOS')?.texto).toBe('1 expediente verificado y listo para autorizar la emisión');
    expect(codigos(pendientesDelPersonal(Rol.GESTOR, i, HOY))).toContain('VERIFICACIONES');
  });

  it('administrador: horarios faltantes o casi llenos, consultas atrasadas y contenido por agregar', () => {
    const sinManejo = { ...vacio(), cupos: [{ fecha: '2026-11-30', tipo: 'CONOCIMIENTOS' as const, libres: 3 }], consultasPendientes: [haceDias(4)], derivadasUltimaSemana: 5 };
    const p = pendientesDelPersonal(Rol.ADMINISTRADOR, sinManejo, HOY);
    expect(codigos(p)).toEqual(['CUPOS_CONOCIMIENTOS', 'SIN_CUPOS_MANEJO', 'CONSULTAS_ATRASADAS', 'CONTENIDO']);
    expect(p[0].texto).toBe('Quedan 3 cupos libres de conocimientos en los próximos días');
    expect(pendientesDelPersonal(Rol.ADMINISTRADOR, vacio(), HOY)).toEqual([]);
    expect(pendientesDelPersonal(Rol.POSTULANTE, vacio(), HOY)).toEqual([]);
  });

  it('el texto para el chat lista hasta 6 pendientes y marca los urgentes', () => {
    const p = pendientesDelPersonal(Rol.GESTOR, { ...vacio(), pagosPorVerificar: 2, observacionesAbiertas: 1 }, HOY);
    expect(describirPendientes(p, true)).toBe(
      'Esto tienes pendiente:\n• 1 expediente devuelto por el supervisor: corrígelo y márcalo como atendido (urgente)\n• 2 pagos por verificar en el SAT',
    );
    expect(describirPendientes([], true)).toContain('Todo está al día');
    expect(describirPendientes([], false)).toBe('No tienes pendientes por ahora.');
  });
});

const datos = (cambios: Partial<DatosPostulante> = {}): DatosPostulante => ({
  numero: 'EXP-2026-00005',
  categoria: Categoria.II_B,
  etapa: Etapa.DOCUMENTOS,
  creadoEn: haceDias(1),
  documentos: [],
  ultimoPago: null,
  proximasCitas: [],
  evaluaciones: [],
  respuestasNuevas: 0,
  licencia: null,
  ...cambios,
});
const doc = (tipo: TipoDocumento, estado = 'PENDIENTE', fechaEmision: Date | null = haceDias(10), observacion: string | null = null) => ({ tipo, estado, observacion, fechaEmision });

describe('Recordatorios del postulante', () => {
  it('sin trámite, lo invita a iniciarlo', () => {
    expect(codigos(recordatoriosDelPostulante(null, HOY))).toEqual(['SIN_TRAMITE']);
  });

  it('documentos: faltantes, observados o en revisión', () => {
    expect(recordatoriosDelPostulante(datos(), HOY)[0].texto).toBe('Te falta adjuntar: declaración jurada, certificado médico, fotografías.');
    const observado = datos({ documentos: [doc(TipoDocumento.DECLARACION_JURADA), doc(TipoDocumento.CERTIFICADO_MEDICO), doc(TipoDocumento.FOTOGRAFIA, 'OBSERVADO', null, 'La foto no es a color')] });
    expect(recordatoriosDelPostulante(observado, HOY)[0]).toEqual(expect.objectContaining({ codigo: 'DOCUMENTO_OBSERVADO', texto: 'Corrige tus fotografías: La foto no es a color.', urgente: true }));
    const completo = datos({ documentos: [doc(TipoDocumento.DECLARACION_JURADA), doc(TipoDocumento.CERTIFICADO_MEDICO), doc(TipoDocumento.FOTOGRAFIA)] });
    expect(codigos(recordatoriosDelPostulante(completo, HOY))).toEqual(['DOCUMENTOS_EN_REVISION']);
    expect(recordatoriosDelPostulante(datos({ categoria: Categoria.II_C }), HOY)[0].texto).toContain('constancia COFIPRO');
  });

  it('certificado médico por vencer o vencido (6 meses)', () => {
    const porVencer = datos({ etapa: Etapa.CITA, documentos: [doc(TipoDocumento.CERTIFICADO_MEDICO, 'APROBADO', new Date('2026-06-10T00:00:00Z'))] });
    expect(recordatoriosDelPostulante(porVencer, HOY).find((r) => r.codigo === 'CERTIFICADO_POR_VENCER')?.texto).toContain('(en 15 días)');
    const vencido = datos({ etapa: Etapa.EXAMEN_MANEJO, documentos: [doc(TipoDocumento.CERTIFICADO_MEDICO, 'APROBADO', new Date('2026-05-01T00:00:00Z'))] });
    expect(codigos(recordatoriosDelPostulante(vencido, HOY))).toContain('CERTIFICADO_VENCIDO');
    const emitida = datos({ etapa: Etapa.EMITIDA, licencia: 'Q123456', documentos: [doc(TipoDocumento.CERTIFICADO_MEDICO, 'APROBADO', new Date('2026-05-01T00:00:00Z'))] });
    expect(codigos(recordatoriosDelPostulante(emitida, HOY))).toEqual(['LICENCIA']);
  });

  it('pago: registrar con la tasa de su categoría, corregir uno observado o esperar la verificación', () => {
    expect(recordatoriosDelPostulante(datos({ etapa: Etapa.PAGO }), HOY)[0].texto).toBe('Paga S/ 69.90 en el SAT Huamanga y registra el número de operación.');
    const observado = datos({ etapa: Etapa.PAGO, categoria: Categoria.II_C, ultimoPago: { estado: 'OBSERVADO', observacion: 'el monto no coincide' } });
    expect(recordatoriosDelPostulante(observado, HOY)[0].texto).toContain('S/ 69.40');
    expect(recordatoriosDelPostulante(observado, HOY)[0].texto).toContain('el monto no coincide');
    expect(codigos(recordatoriosDelPostulante(datos({ etapa: Etapa.PAGO, ultimoPago: { estado: 'PENDIENTE', observacion: null } }), HOY))).toEqual(['PAGO_EN_VERIFICACION']);
  });

  it('citas y exámenes: elegir, recordar la fecha, reintentar o intentos agotados', () => {
    expect(codigos(recordatoriosDelPostulante(datos({ etapa: Etapa.CITA }), HOY))).toEqual(['ELEGIR_CITA']);
    const manana = datos({ etapa: Etapa.EXAMEN_CONOCIMIENTOS, proximasCitas: [{ tipo: 'CONOCIMIENTOS', fecha: '2026-11-26', hora: '08:30' }] });
    expect(recordatoriosDelPostulante(manana, HOY)[0]).toEqual(expect.objectContaining({ texto: 'Tu examen de conocimientos es el jueves, 26 de noviembre a las 08:30. Lleva tu DNI.', urgente: true }));
    const lejos = datos({ etapa: Etapa.EXAMEN_CONOCIMIENTOS, proximasCitas: [{ tipo: 'CONOCIMIENTOS', fecha: '2026-12-02', hora: '08:30' }] });
    expect(recordatoriosDelPostulante(lejos, HOY)[0].urgente).toBe(false);
    const yaUsada = datos({ etapa: Etapa.EMITIDA, licencia: 'Q1234567', proximasCitas: [{ tipo: 'MANEJO', fecha: '2026-11-26', hora: '14:00' }] });
    expect(codigos(recordatoriosDelPostulante(yaUsada, HOY))).toEqual(['LICENCIA']);
    const reintento = datos({ etapa: Etapa.EXAMEN_CONOCIMIENTOS, evaluaciones: [{ tipo: 'CONOCIMIENTOS', estado: 'PENDIENTE', intentos: 1 }] });
    expect(recordatoriosDelPostulante(reintento, HOY)[0].texto).toBe('No aprobaste el intento 1 de conocimientos; te quedan 2 sin volver a pagar. Reserva una nueva cita.');
    expect(codigos(recordatoriosDelPostulante(datos({ etapa: Etapa.EXAMEN_MANEJO, evaluaciones: [{ tipo: 'MANEJO', estado: 'AGOTADO', intentos: 3 }] }), HOY))).toEqual(['INTENTOS_AGOTADOS']);
    expect(codigos(recordatoriosDelPostulante(datos({ etapa: Etapa.EXAMEN_MANEJO, evaluaciones: [{ tipo: 'MANEJO', estado: 'REGISTRADO', intentos: 1 }] }), HOY))).toEqual(['RESULTADO_EN_VALIDACION']);
    expect(codigos(recordatoriosDelPostulante(datos({ etapa: Etapa.EXAMEN_MANEJO }), HOY))).toEqual(['RESERVAR_MANEJO']);
  });

  it('emisión, plazo vencido y respuestas del gestor', () => {
    const r = recordatoriosDelPostulante(datos({ etapa: Etapa.EMISION, creadoEn: new Date('2026-11-02T12:00:00Z'), respuestasNuevas: 2 }), HOY);
    expect(codigos(r)).toEqual(['EN_EMISION', 'PLAZO', 'RESPUESTAS']);
    expect(r[2].texto).toBe('El gestor respondió 2 de tus consultas.');
    expect(recordatoriosDelPostulante(datos({ etapa: Etapa.EMITIDA }), HOY)[0].texto).toContain('pronto verás su número');
  });
});

/* ---------- Casos de uso ---------- */

const aContenidos = (filas: [string, string, string, string][], audiencia: Audiencia, desde: number): ContenidoAprobado[] =>
  filas.map(([tema, pregunta, respuesta, palabrasClave], i) => ({ id: desde + i, tema: tema as TemaContenido, audiencia, pregunta, respuesta, palabrasClave, activo: true }));
const TODOS = [...aContenidos(CONTENIDOS_INICIALES, Audiencia.POSTULANTE, 1), ...aContenidos(CONTENIDOS_PERSONAL, Audiencia.PERSONAL, 100)];

const repoContenidos: RepositorioContenidos = {
  activos: async () => TODOS,
  todos: async () => TODOS,
  buscarPorId: async (id) => TODOS.find((c) => c.id === id)!,
  crear: async () => TODOS[0],
  actualizar: async (c) => c,
};

class IAFalsa implements AsistenteIA {
  recibido: { contenidos: ContenidoAprobado[]; audiencia?: Audiencia } | null = null;
  constructor(
    public disponible = true,
    private readonly salida: RedaccionIA | null = { respuesta: 'Compara el voucher con el reporte del SAT.', confiable: true },
  ) {}
  async redactar(_pregunta: string, contenidos: ContenidoAprobado[], audiencia?: Audiencia) {
    this.recibido = { contenidos, audiencia };
    return this.salida;
  }
}

const lectura = (cambios: Partial<IndicadoresPersonal> = {}, postulante: DatosPostulante | null = null): LecturaPendientes => ({
  indicadoresPersonal: async () => ({ ...vacio(), ...cambios }),
  datosPostulante: async () => postulante,
});

describe('Asistente del personal y pendientes (casos de uso)', () => {
  const crear = (ia: AsistenteIA = new IAFalsa(false), l = lectura({ pagosPorVerificar: 2 })) => new ConsultarAsistentePersonalUseCase(repoContenidos, ia, new ConsultarPendientesUseCase(l));
  const gestor = usuario(Rol.GESTOR, { id: 2 });

  it('reconoce cuándo el personal pregunta por sus pendientes', () => {
    for (const q of ['¿Qué tengo pendiente?', 'Dame un resumen', '¿Qué me falta hacer hoy?', '¿Me olvidé de algo?', '¿Qué es lo urgente?']) expect(pidePendientes(q)).toBe(true);
    for (const q of ['¿Cómo verifico un pago?', '¿Qué días son los exámenes?', '¿Qué hago con un expediente devuelto?']) expect(pidePendientes(q)).toBe(false);
  });

  it('cada rol recibe sus pendientes; el postulante, sus recordatorios', async () => {
    const caso = new ConsultarPendientesUseCase(lectura({ pagosPorVerificar: 2, resultadosPorValidar: 1 }, datos({ etapa: Etapa.CITA })));
    expect(codigos(await caso.ejecutar(gestor, HOY))).toEqual(['PAGOS']);
    expect(codigos(await caso.ejecutar(usuario(Rol.SUPERVISOR), HOY))).toEqual(['POR_VALIDAR']);
    expect(codigos(await caso.ejecutar(usuario(Rol.POSTULANTE, { postulanteId: 10 }), HOY))).toEqual(['ELEGIR_CITA']);
    expect(await caso.ejecutar(usuario(Rol.POSTULANTE), HOY)).toEqual([]);
  });

  it('«¿qué tengo pendiente?» responde con los datos del sistema, sin la IA', async () => {
    const ia = new IAFalsa();
    const r = await crear(ia).preguntar(gestor, '¿Qué tengo pendiente hoy?');
    expect(r).toEqual(expect.objectContaining({ origen: OrigenRespuesta.ESTADO, respuesta: 'Esto tienes pendiente:\n• 2 pagos por verificar en el SAT' }));
    expect(ia.recibido).toBeNull();
  });

  it('responde procedimientos con el contenido del personal y la IA en modo personal', async () => {
    const sinIA = await crear().preguntar(gestor, '¿Cómo verifico un pago?');
    expect(sinIA.origen).toBe(OrigenRespuesta.CONTENIDO);
    expect(sinIA.respuesta).toContain('reporte del SAT');
    const ia = new IAFalsa();
    const conIA = await crear(ia).preguntar(gestor, '¿Cómo verifico un pago?');
    expect(conIA.origen).toBe(OrigenRespuesta.IA);
    expect(ia.recibido?.audiencia).toBe(Audiencia.PERSONAL);
    expect(ia.recibido?.contenidos.every((c) => c.audiencia === Audiencia.PERSONAL)).toBe(true);
  });

  it('si no hay procedimiento, usa las reglas públicas del trámite; si no hay nada, lo dice', async () => {
    const r = await crear().preguntar(usuario(Rol.EVALUADOR), '¿Dónde se paga la tasa?');
    expect(r.respuesta).toContain('SAT Huamanga');
    expect((await crear().preguntar(gestor, '¿Quién ganó el partido ayer?')).respuesta).toBe(MENSAJE_SIN_CONTENIDO_PERSONAL);
    expect((await crear(new IAFalsa(true, { respuesta: '', confiable: false })).preguntar(gestor, '¿Cómo verifico un pago?')).origen).toBe(OrigenRespuesta.DERIVADA);
  });

  it('un pedido de acción no se ejecuta: explica dónde hacerlo', async () => {
    const r = await crear().preguntar(usuario(Rol.SUPERVISOR), 'Autoriza la emisión del expediente 5');
    expect(r.respuesta.startsWith(MENSAJE_ACCION_PERSONAL)).toBe(true);
    expect((await crear().preguntar(gestor, 'Aprueba todo ya')).respuesta).toBe(MENSAJE_ACCION_PERSONAL);
    const afirma = await crear(new IAFalsa(true, { respuesta: 'Ya he verificado el pago.', confiable: true })).preguntar(gestor, '¿Cómo verifico un pago?');
    expect(afirma.origen).toBe(OrigenRespuesta.CONTENIDO);
    expect((await crear(new IAFalsa(true, null)).preguntar(gestor, '¿Cómo verifico un pago?')).origen).toBe(OrigenRespuesta.CONTENIDO);
  });

  it('solo para el personal y con la misma validación de longitud', async () => {
    await expect(crear().preguntar(usuario(Rol.POSTULANTE, { postulanteId: 10 }), '¿Qué tengo pendiente?')).rejects.toThrow('personal municipal');
    await expect(crear().preguntar(gestor, 'a')).rejects.toThrow(ReglaNegocioError);
  });

  it('Lucía saluda al personal por su nombre y no consulta a la IA para la charla', async () => {
    const ia = new IAFalsa();
    const r = await crear(ia).preguntar(usuario(Rol.GESTOR, { nombre: 'MARÍA ELENA' }), 'Hola');
    expect(r).toEqual(expect.objectContaining({ origen: OrigenRespuesta.CONVERSACION, respuesta: expect.stringMatching(/^¡Hola, María! Soy Lucía/) }));
    expect(ia.recibido).toBeNull();
    const conPregunta = await crear().preguntar(gestor, 'Hola, ¿cómo verifico un pago?');
    expect(conPregunta.respuesta).toMatch(/^¡Hola! Compara el número de operación/);
  });

  it('el postulante que pregunta por su trámite recibe además sus recordatorios urgentes', async () => {
    const consultas: RepositorioConsultas = {
      registrar: async (d) => new ConsultaAsistente(1, d.postulanteId, d.pregunta, d.respuesta, d.origen, d.fuentes, HOY),
      buscarPorId: async () => { throw new Error('no usado'); },
      dePostulante: async () => [],
      derivadas: async () => [],
      guardarRespuestaGestor: async () => undefined,
    };
    const l = lectura({}, datos({ etapa: Etapa.PAGO }));
    const caso = new ConsultarAsistenteUseCase(repoContenidos, consultas, new IAFalsa(false), new ExpedientesEnMemoria(expediente(Etapa.PAGO)), l);
    const r = await caso.preguntar(usuario(Rol.POSTULANTE, { postulanteId: 10 }), '¿Cómo va mi trámite?');
    expect(r.respuesta).toContain('Importante: Paga S/ 69.90');
    // y nunca responde con procedimientos internos
    const interno = await caso.preguntar(usuario(Rol.POSTULANTE, { postulanteId: 10 }), '¿Cómo registro el número de licencia para el SNC?');
    expect(interno.fuentes.every((id) => id < 100)).toBe(true);
    // la charla se guarda en su conversación, sin derivarse al gestor
    const ofensa = await caso.preguntar(usuario(Rol.POSTULANTE, { postulanteId: 10, nombre: 'JUAN' }), 'eres una inútil');
    expect(ofensa).toEqual(expect.objectContaining({ origen: OrigenRespuesta.CONVERSACION, derivada: false }));
    const saludo = await caso.preguntar(usuario(Rol.POSTULANTE, { postulanteId: 10, nombre: 'JUAN' }), 'Hola, ¿cómo va mi trámite?');
    expect(saludo.respuesta).toMatch(/^¡Hola, Juan! /);
    expect(saludo.origen).toBe(OrigenRespuesta.ESTADO);
  });
});
