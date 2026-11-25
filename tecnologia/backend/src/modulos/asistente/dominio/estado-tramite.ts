import { Expediente } from '../../expedientes/dominio/expediente';
import { Etapa } from '../../expedientes/dominio/etapa';
import { calcularPlazo, PLAZO_DIAS_HABILES } from '../../expedientes/dominio/plazo';

const QUE_SIGUE: Record<Etapa, string> = {
  [Etapa.DOCUMENTOS]: 'adjunta en «Mis documentos» los que falten o estén observados; el gestor los revisa.',
  [Etapa.PAGO]: 'paga la tasa en el SAT Huamanga o en el banco y registra el número de operación en «Pago».',
  [Etapa.CITA]: 'elige el día de tu examen de conocimientos en «Mi cita».',
  [Etapa.EXAMEN_CONOCIMIENTOS]: 'preséntate al examen de conocimientos en la fecha de tu cita; luego se valida el resultado.',
  [Etapa.EXAMEN_MANEJO]: 'reserva y rinde el examen de manejo en «Mi cita».',
  [Etapa.EMISION]: 'la Subgerencia de Tránsito revisa tu expediente y autoriza la emisión.',
  [Etapa.EMITIDA]: 'tu licencia fue emitida; revisa «Resultados» para ver el número registrado.',
};

const NOMBRE: Record<Etapa, string> = {
  [Etapa.DOCUMENTOS]: 'revisión de documentos',
  [Etapa.PAGO]: 'pago',
  [Etapa.CITA]: 'elegir cita',
  [Etapa.EXAMEN_CONOCIMIENTOS]: 'examen de conocimientos',
  [Etapa.EXAMEN_MANEJO]: 'examen de manejo',
  [Etapa.EMISION]: 'emisión de la licencia',
  [Etapa.EMITIDA]: 'licencia emitida',
};

/** RF14: estado del trámite con los datos del propio expediente, sin pasar por la IA. */
export function describirEstado(expediente: Expediente | null, hoy = new Date()): string {
  if (!expediente) return 'Aún no tienes un trámite. Puedes iniciarlo en «Inicio» eligiendo la categoría II-B (moto) o II-C (mototaxi).';
  const plazo = calcularPlazo(expediente.creadoEn, hoy);
  const base = `Tu trámite ${expediente.numero} (${expediente.categoria}) está en la etapa: ${NOMBRE[expediente.etapa]}.`;
  if (expediente.etapa === Etapa.EMITIDA) return `${base} Siguiente paso: ${QUE_SIGUE[expediente.etapa]}`;
  return `${base} Lleva ${plazo.diasTranscurridos} de ${PLAZO_DIAS_HABILES} días hábiles del plazo legal. Siguiente paso: ${QUE_SIGUE[expediente.etapa]}`;
}
