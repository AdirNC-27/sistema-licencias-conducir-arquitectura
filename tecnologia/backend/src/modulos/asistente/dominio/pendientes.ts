import { Categoria } from '../../../compartido/dominio/categoria';
import { Rol } from '../../../compartido/dominio/rol';
import { documentosObligatorios, TipoDocumento } from '../../documentos/dominio/documento';
import { Etapa } from '../../expedientes/dominio/etapa';
import { calcularPlazo, PLAZO_DIAS_HABILES } from '../../expedientes/dominio/plazo';
import { ResultadoVerificacion, Verificacion, verificacionesObligatorias, vigentes } from '../../revision/dominio/verificacion';

/**
 * RF14 ampliado a todos los roles: lo que cada persona tiene por hacer, calculado con los datos
 * del sistema (no con la IA). El asistente lo muestra al entrar y lo usa para responder
 * «¿qué tengo pendiente?». Solo lectura: ningún pendiente ejecuta nada.
 */
export interface Pendiente {
  codigo: string;
  texto: string;
  cantidad: number;
  urgente: boolean;
  /** Pantalla del portal donde se atiende. */
  ruta: string;
}

const MILISEGUNDOS_DIA = 86_400_000;
const DIAS_ALERTA_PLAZO = 2; // días hábiles restantes desde los que se avisa
const DIAS_ALERTA_CERTIFICADO = 30;
const HORAS_CONSULTA_ATRASADA = 48;

/* ---------- Personal ---------- */

export interface ExpedienteEnEmision {
  numero: string;
  categoria: Categoria;
  verificaciones: Verificacion[];
  observacionAbierta: boolean;
}

export interface CupoProximo {
  fecha: string; // AAAA-MM-DD
  tipo: 'CONOCIMIENTOS' | 'MANEJO';
  libres: number;
}

/** Datos que entrega el modelo de lectura; el dominio decide qué es pendiente y qué es urgente. */
export interface IndicadoresPersonal {
  documentosPorRevisar: number; // expedientes con documentos sin revisar
  pagosPorVerificar: number;
  observacionesAbiertas: number;
  licenciasPorRegistrar: number;
  consultasPendientes: Date[]; // fecha de cada consulta derivada sin respuesta
  derivadasUltimaSemana: number;
  examenesSinResultado: number; // ya rindieron (cita hoy o antes) y no tienen resultado
  citasDeHoy: number;
  citasProximas: number; // exámenes programados en los próximos 7 días
  resultadosPorValidar: number;
  enEmision: ExpedienteEnEmision[];
  abiertos: { numero: string; creadoEn: Date }[]; // expedientes que aún no terminan
  cupos: CupoProximo[]; // desde mañana, próximos días
}

export type EstadoEmision = 'POR_VERIFICAR' | 'NO_CONFORME' | 'OBSERVADO' | 'LISTO';

export function estadoEmision(e: ExpedienteEnEmision): EstadoEmision {
  if (e.observacionAbierta) return 'OBSERVADO';
  const ultimas = vigentes(e.verificaciones);
  const obligatorias = verificacionesObligatorias(e.categoria);
  if (obligatorias.some((t) => !ultimas.has(t))) return 'POR_VERIFICAR';
  if (obligatorias.some((t) => ultimas.get(t)?.resultado !== ResultadoVerificacion.CONFORME)) return 'NO_CONFORME';
  return 'LISTO';
}

function plazoPorVencer(abiertos: IndicadoresPersonal['abiertos'], hoy: Date): { vencidos: string[]; porVencer: string[] } {
  const vencidos: string[] = [];
  const porVencer: string[] = [];
  for (const e of abiertos) {
    const plazo = calcularPlazo(e.creadoEn, hoy);
    if (plazo.vencido) vencidos.push(e.numero);
    else if (plazo.diasRestantes <= DIAS_ALERTA_PLAZO) porVencer.push(e.numero);
  }
  return { vencidos, porVencer };
}

const lista = (numeros: string[]) => (numeros.length > 3 ? `${numeros.slice(0, 3).join(', ')} y ${numeros.length - 3} más` : numeros.join(', '));

function pendientesDePlazo(i: IndicadoresPersonal, hoy: Date, ruta: string): Pendiente[] {
  const { vencidos, porVencer } = plazoPorVencer(i.abiertos, hoy);
  const salida: Pendiente[] = [];
  if (vencidos.length) {
    salida.push({ codigo: 'PLAZO_VENCIDO', texto: `${vencidos.length === 1 ? '1 expediente superó' : `${vencidos.length} expedientes superaron`} los ${PLAZO_DIAS_HABILES} días hábiles del plazo legal: ${lista(vencidos)}`, cantidad: vencidos.length, urgente: true, ruta });
  }
  if (porVencer.length) {
    salida.push({ codigo: 'PLAZO_POR_VENCER', texto: `${porVencer.length === 1 ? '1 expediente vence' : `${porVencer.length} expedientes vencen`} su plazo legal en ${DIAS_ALERTA_PLAZO} días hábiles o menos: ${lista(porVencer)}`, cantidad: porVencer.length, urgente: true, ruta });
  }
  return salida;
}

/** Qué falta hacer según el rol. Los urgentes van primero. */
export function pendientesDelPersonal(rol: Rol, i: IndicadoresPersonal, hoy = new Date()): Pendiente[] {
  const p: Pendiente[] = [];
  /** textos: [singular, plural]; «#» se reemplaza por la cantidad. */
  const agregar = (codigo: string, cantidad: number, [uno, varios]: [string, string], ruta: string, urgente = false) => {
    if (cantidad > 0) p.push({ codigo, texto: (cantidad === 1 ? uno : varios).replace('#', String(cantidad)), cantidad, urgente, ruta });
  };
  const emision = i.enEmision.map(estadoEmision);
  const contar = (estado: EstadoEmision) => emision.filter((e) => e === estado).length;

  switch (rol) {
    case Rol.GESTOR: {
      const atrasadas = i.consultasPendientes.filter((f) => hoy.getTime() - f.getTime() > HORAS_CONSULTA_ATRASADA * 3_600_000).length;
      agregar('OBSERVACIONES', i.observacionesAbiertas, ['1 expediente devuelto por el supervisor: corrígelo y márcalo como atendido', '# expedientes devueltos por el supervisor: corrígelos y márcalos como atendidos'], '/gestor', true);
      agregar('DOCUMENTOS', i.documentosPorRevisar, ['1 expediente con documentos por revisar', '# expedientes con documentos por revisar'], '/gestor?etapa=DOCUMENTOS');
      agregar('PAGOS', i.pagosPorVerificar, ['1 pago por verificar en el SAT', '# pagos por verificar en el SAT'], '/gestor?etapa=PAGO');
      agregar('VERIFICACIONES', contar('POR_VERIFICAR'), ['1 expediente en emisión sin verificar en el SNC o el récord de sanciones', '# expedientes en emisión sin verificar en el SNC o el récord de sanciones'], '/gestor?etapa=EMISION');
      agregar('LICENCIAS', i.licenciasPorRegistrar, ['1 licencia emitida sin número registrado para el SNC', '# licencias emitidas sin número registrado para el SNC'], '/gestor?etapa=EMITIDA', true);
      agregar('CONSULTAS', i.consultasPendientes.length, ['1 consulta de un postulante espera tu respuesta', '# consultas de postulantes esperan tu respuesta'], '/gestor/consultas', atrasadas > 0);
      p.push(...pendientesDePlazo(i, hoy, '/gestor'));
      break;
    }
    case Rol.EVALUADOR:
      agregar('SIN_RESULTADO', i.examenesSinResultado, ['1 examen ya rendido sin resultado registrado', '# exámenes ya rendidos sin resultado registrado'], '/evaluador', true);
      agregar('CITAS_HOY', i.citasDeHoy, ['1 postulante citado hoy', '# postulantes citados hoy'], '/evaluador');
      agregar('CITAS_PROXIMAS', i.citasProximas, ['1 examen programado en los próximos 7 días', '# exámenes programados en los próximos 7 días'], '/evaluador');
      agregar('EN_VALIDACION', i.resultadosPorValidar, ['1 resultado espera la validación del supervisor (aún puedes corregirlo)', '# resultados esperan la validación del supervisor (aún puedes corregirlos)'], '/evaluador');
      break;
    case Rol.SUPERVISOR:
      agregar('POR_VALIDAR', i.resultadosPorValidar, ['1 resultado de examen por validar', '# resultados de examen por validar'], '/supervisor', true);
      agregar('LISTOS', contar('LISTO'), ['1 expediente verificado y listo para autorizar la emisión', '# expedientes verificados y listos para autorizar la emisión'], '/supervisor/emision', true);
      agregar('NO_CONFORME', contar('NO_CONFORME'), ['1 expediente en emisión con una verificación no conforme', '# expedientes en emisión con una verificación no conforme'], '/supervisor/emision');
      agregar('OBSERVADOS', contar('OBSERVADO'), ['1 expediente que devolviste y el gestor aún no atiende', '# expedientes que devolviste y el gestor aún no atiende'], '/supervisor/emision');
      p.push(...pendientesDePlazo(i, hoy, '/supervisor/emision'));
      break;
    case Rol.ADMINISTRADOR: {
      for (const tipo of ['CONOCIMIENTOS', 'MANEJO'] as const) {
        const delTipo = i.cupos.filter((c) => c.tipo === tipo);
        const libres = delTipo.reduce((s, c) => s + c.libres, 0);
        const nombre = tipo === 'CONOCIMIENTOS' ? 'conocimientos' : 'manejo';
        if (delTipo.length === 0) p.push({ codigo: `SIN_CUPOS_${tipo}`, texto: `No hay horarios de ${nombre} habilitados para los próximos días`, cantidad: 1, urgente: true, ruta: '/admin/cupos' });
        else if (libres <= 5) p.push({ codigo: `CUPOS_${tipo}`, texto: `Quedan ${libres} cupos libres de ${nombre} en los próximos días`, cantidad: libres, urgente: true, ruta: '/admin/cupos' });
      }
      const atrasadas = i.consultasPendientes.filter((f) => hoy.getTime() - f.getTime() > HORAS_CONSULTA_ATRASADA * 3_600_000).length;
      agregar('CONSULTAS_ATRASADAS', atrasadas, ['1 consulta derivada lleva más de 48 horas sin respuesta del gestor', '# consultas derivadas llevan más de 48 horas sin respuesta del gestor'], '/admin/auditoria');
      agregar('CONTENIDO', i.derivadasUltimaSemana, ['1 consulta se derivó esta semana: revisa si conviene agregar contenido aprobado', '# consultas se derivaron esta semana: revisa si conviene agregar contenido aprobado'], '/admin/contenidos');
      break;
    }
    default:
      break;
  }
  return p.sort((a, b) => Number(b.urgente) - Number(a.urgente));
}

/* ---------- Postulante ---------- */

export interface DatosPostulante {
  numero: string;
  categoria: Categoria;
  etapa: Etapa;
  creadoEn: Date;
  documentos: { tipo: TipoDocumento; estado: string; observacion: string | null; fechaEmision: Date | null }[]; // el último de cada tipo
  ultimoPago: { estado: string; observacion: string | null } | null;
  proximasCitas: { tipo: 'CONOCIMIENTOS' | 'MANEJO'; fecha: string; hora: string }[];
  evaluaciones: { tipo: 'CONOCIMIENTOS' | 'MANEJO'; estado: string; intentos: number }[];
  respuestasNuevas: number; // respuestas del gestor de los últimos 7 días
  licencia: string | null;
}

const NOMBRE_DOCUMENTO: Record<TipoDocumento, [string, string]> = {
  [TipoDocumento.DECLARACION_JURADA]: ['declaración jurada', 'tu declaración jurada'],
  [TipoDocumento.CERTIFICADO_MEDICO]: ['certificado médico', 'tu certificado médico'],
  [TipoDocumento.FOTOGRAFIA]: ['fotografías', 'tus fotografías'],
  [TipoDocumento.CONSTANCIA_COFIPRO]: ['constancia COFIPRO', 'tu constancia COFIPRO'],
};
const TASA: Record<Categoria, string> = { [Categoria.II_B]: 'S/ 69.90', [Categoria.II_C]: 'S/ 69.40' };
const fechaCorta = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

/** Recordatorios del postulante: lo que debe hacer ahora y lo que está por vencer. */
export function recordatoriosDelPostulante(d: DatosPostulante | null, hoy = new Date()): Pendiente[] {
  if (!d) return [{ codigo: 'SIN_TRAMITE', texto: 'Aún no inicias tu trámite: elige la categoría II-B (moto) o II-C (mototaxi) en Inicio.', cantidad: 1, urgente: false, ruta: '/postulante' }];
  const r: Pendiente[] = [];
  const agregar = (codigo: string, texto: string, ruta: string, urgente = false) => r.push({ codigo, texto, cantidad: 1, urgente, ruta });
  const hoyIso = hoy.toISOString().slice(0, 10);

  if (d.etapa === Etapa.DOCUMENTOS) {
    for (const doc of d.documentos.filter((x) => x.estado === 'OBSERVADO')) {
      agregar('DOCUMENTO_OBSERVADO', `Corrige ${NOMBRE_DOCUMENTO[doc.tipo][1]}: ${doc.observacion ?? 'fue observado'}.`, '/postulante/documentos', true);
    }
    const faltan = documentosObligatorios(d.categoria).filter((t) => !d.documentos.some((x) => x.tipo === t));
    if (faltan.length) agregar('DOCUMENTOS_FALTANTES', `Te falta adjuntar: ${faltan.map((t) => NOMBRE_DOCUMENTO[t][0]).join(', ')}.`, '/postulante/documentos', true);
    else if (!d.documentos.some((x) => x.estado === 'OBSERVADO')) agregar('DOCUMENTOS_EN_REVISION', 'El gestor está revisando tus documentos.', '/postulante/documentos');
  }

  const certificado = d.documentos.find((x) => x.tipo === TipoDocumento.CERTIFICADO_MEDICO && x.fechaEmision);
  if (certificado?.fechaEmision && d.etapa !== Etapa.EMITIDA) {
    const vence = new Date(certificado.fechaEmision);
    vence.setUTCMonth(vence.getUTCMonth() + 6);
    const dias = Math.ceil((vence.getTime() - hoy.getTime()) / MILISEGUNDOS_DIA);
    const fecha = vence.toISOString().slice(0, 10);
    if (dias < 0) agregar('CERTIFICADO_VENCIDO', `Tu certificado médico venció el ${fechaCorta(fecha)}: necesitas uno nuevo para continuar.`, '/postulante/documentos', true);
    else if (dias <= DIAS_ALERTA_CERTIFICADO) agregar('CERTIFICADO_POR_VENCER', `Tu certificado médico vence el ${fechaCorta(fecha)} (en ${dias} días). Avanza con tus exámenes antes de esa fecha.`, '/postulante/resultados', true);
  }

  if (d.etapa === Etapa.PAGO) {
    if (!d.ultimoPago || d.ultimoPago.estado === 'OBSERVADO' || d.ultimoPago.estado === 'RECHAZADO') {
      const motivo = d.ultimoPago?.observacion ? ` Tu pago anterior fue observado: ${d.ultimoPago.observacion}.` : '';
      agregar('REGISTRAR_PAGO', `Paga ${TASA[d.categoria]} en el SAT Huamanga y registra el número de operación.${motivo}`, '/postulante/pago', true);
    } else agregar('PAGO_EN_VERIFICACION', 'Tu pago está en verificación por el gestor.', '/postulante/pago');
  }
  if (d.etapa === Etapa.CITA) agregar('ELEGIR_CITA', 'Elige la fecha de tu examen de conocimientos (lunes a miércoles).', '/postulante/cita', true);

  // Solo la cita del examen que le toca: las anteriores ya se usaron.
  const examenActual = d.etapa === Etapa.EXAMEN_CONOCIMIENTOS ? 'CONOCIMIENTOS' : d.etapa === Etapa.EXAMEN_MANEJO ? 'MANEJO' : null;
  for (const c of d.proximasCitas.filter((x) => x.tipo === examenActual)) {
    const nombre = c.tipo === 'CONOCIMIENTOS' ? 'conocimientos' : 'manejo';
    const pronto = Math.ceil((new Date(`${c.fecha}T00:00:00Z`).getTime() - new Date(`${hoyIso}T00:00:00Z`).getTime()) / MILISEGUNDOS_DIA) <= 1;
    agregar(`CITA_${c.tipo}`, `Tu examen de ${nombre} es el ${fechaCorta(c.fecha)} a las ${c.hora}. Lleva tu DNI.`, '/postulante/cita', pronto);
  }

  const etapaExamen = examenActual;
  if (etapaExamen) {
    const ev = d.evaluaciones.find((e) => e.tipo === etapaExamen);
    const tieneCita = d.proximasCitas.some((c) => c.tipo === etapaExamen);
    const nombre = etapaExamen === 'CONOCIMIENTOS' ? 'conocimientos' : 'manejo';
    if (ev?.estado === 'AGOTADO') agregar('INTENTOS_AGOTADOS', `Usaste los 3 intentos del examen de ${nombre}. Acércate a la Subgerencia de Tránsito para orientarte.`, '/postulante/resultados', true);
    else if (ev?.estado === 'REGISTRADO') agregar('RESULTADO_EN_VALIDACION', `Tu resultado de ${nombre} está en validación por el supervisor.`, '/postulante/resultados');
    else if (ev && ev.intentos > 0 && !tieneCita) agregar('REINTENTO', `No aprobaste el intento ${ev.intentos} de ${nombre}; te quedan ${3 - ev.intentos} sin volver a pagar. Reserva una nueva cita.`, '/postulante/cita', true);
    else if (!tieneCita && etapaExamen === 'MANEJO') agregar('RESERVAR_MANEJO', 'Aprobaste conocimientos: reserva tu examen de manejo (martes a viernes).', '/postulante/cita', true);
  }

  if (d.etapa === Etapa.EMISION) agregar('EN_EMISION', 'Aprobaste ambos exámenes: la Subgerencia de Tránsito revisa tu expediente para emitir la licencia.', '/postulante');
  if (d.etapa === Etapa.EMITIDA) {
    agregar('LICENCIA', d.licencia ? `Tu licencia ${d.licencia} fue registrada.` : 'Tu licencia fue emitida; pronto verás su número registrado.', '/postulante/resultados');
  } else {
    const plazo = calcularPlazo(d.creadoEn, hoy);
    if (plazo.vencido) agregar('PLAZO', `Tu trámite ${d.numero} superó los ${PLAZO_DIAS_HABILES} días hábiles del plazo legal.`, '/postulante');
  }
  if (d.respuestasNuevas > 0) agregar('RESPUESTAS', `El gestor respondió ${d.respuestasNuevas === 1 ? 'una de tus consultas' : `${d.respuestasNuevas} de tus consultas`}.`, '/postulante/asistente');

  return r.sort((a, b) => Number(b.urgente) - Number(a.urgente));
}

/** Texto para el chat: «¿qué tengo pendiente?». */
export function describirPendientes(pendientes: Pendiente[], personal: boolean): string {
  if (pendientes.length === 0) return personal ? 'No tienes pendientes en este momento. Todo está al día.' : 'No tienes pendientes por ahora.';
  const lineas = pendientes.slice(0, 6).map((p) => `• ${p.texto}${p.urgente ? ' (urgente)' : ''}`);
  return `${personal ? 'Esto tienes pendiente:' : 'Lo que te toca ahora:'}\n${lineas.join('\n')}`;
}

