/** Etapas del trámite en orden obligatorio (RF20). */
export enum Etapa {
  DOCUMENTOS = 'DOCUMENTOS',
  PAGO = 'PAGO',
  CITA = 'CITA',
  EXAMEN_CONOCIMIENTOS = 'EXAMEN_CONOCIMIENTOS',
  EXAMEN_MANEJO = 'EXAMEN_MANEJO',
  EMISION = 'EMISION',
  EMITIDA = 'EMITIDA',
}

export const ORDEN_ETAPAS: Etapa[] = [
  Etapa.DOCUMENTOS,
  Etapa.PAGO,
  Etapa.CITA,
  Etapa.EXAMEN_CONOCIMIENTOS,
  Etapa.EXAMEN_MANEJO,
  Etapa.EMISION,
  Etapa.EMITIDA,
];

export function siguienteEtapa(actual: Etapa): Etapa | null {
  const i = ORDEN_ETAPAS.indexOf(actual);
  return i >= 0 && i < ORDEN_ETAPAS.length - 1 ? ORDEN_ETAPAS[i + 1] : null;
}
