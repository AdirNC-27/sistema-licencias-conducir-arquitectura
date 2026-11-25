import { Categoria } from '../../../compartido/dominio/categoria';
import { ReglaNegocioError } from '../../../compartido/dominio/errores';
import { EstadoObservacion, ObservacionExpediente } from './observacion';
import { NOMBRE_VERIFICACION, ResultadoVerificacion, Verificacion, verificacionesObligatorias, vigentes } from './verificacion';

/**
 * Lo que falta para autorizar la emisión (RF11, RF12, RF24, RF27). Los documentos, el pago y los
 * exámenes ya están garantizados por el orden de etapas (RF20); aquí se agregan las verificaciones
 * en portales oficiales y las observaciones del supervisor.
 */
export function pendientesDeEmision(categoria: Categoria, verificaciones: Verificacion[], observaciones: ObservacionExpediente[]): string[] {
  const ultimas = vigentes(verificaciones);
  const pendientes: string[] = [];
  for (const tipo of verificacionesObligatorias(categoria)) {
    const v = ultimas.get(tipo);
    if (!v) pendientes.push(`Falta verificar: ${NOMBRE_VERIFICACION[tipo]}`);
    else if (v.resultado === ResultadoVerificacion.NO_CONFORME) pendientes.push(`No conforme: ${NOMBRE_VERIFICACION[tipo]}`);
  }
  if (observaciones.some((o) => o.estado === EstadoObservacion.ABIERTA)) pendientes.push('Hay una observación del supervisor sin atender');
  return pendientes;
}

/** RF24: licencia emitida, registrada para su carga en el SNC. */
export interface LicenciaEmitida {
  expedienteId: number;
  numero: string;
  gestorId: number;
  registradaEn: Date;
}

/** Formato del número de licencia: letras, números y guiones (6 a 15). */
export function normalizarNumeroLicencia(numero: string): string {
  const limpio = numero.trim().toUpperCase();
  if (!/^[A-Z0-9-]{6,15}$/.test(limpio)) throw new ReglaNegocioError('El número de licencia debe tener de 6 a 15 letras, números o guiones');
  return limpio;
}
