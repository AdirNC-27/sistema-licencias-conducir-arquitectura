import { Categoria } from '../../../compartido/dominio/categoria';
import { ReglaNegocioError } from '../../../compartido/dominio/errores';

/**
 * Verificaciones que el gestor hace en portales oficiales (RF24, RF27). El SNC y el récord del
 * conductor no ofrecen una API pública: el gestor consulta el portal y deja constancia aquí.
 * Una integración futura por la PIDE solo agregaría un adaptador que registre el mismo resultado.
 */
export enum TipoVerificacion {
  SNC_CERTIFICADO_MEDICO = 'SNC_CERTIFICADO_MEDICO',
  SNC_COFIPRO = 'SNC_COFIPRO',
  SANCIONES = 'SANCIONES',
}

export enum ResultadoVerificacion {
  CONFORME = 'CONFORME',
  NO_CONFORME = 'NO_CONFORME',
}

export interface Verificacion {
  id: number;
  expedienteId: number;
  tipo: TipoVerificacion;
  resultado: ResultadoVerificacion;
  detalle: string | null;
  gestorId: number;
  registradoEn: Date;
}

export const NOMBRE_VERIFICACION: Record<TipoVerificacion, string> = {
  [TipoVerificacion.SNC_CERTIFICADO_MEDICO]: 'Certificado médico registrado en el SNC',
  [TipoVerificacion.SNC_COFIPRO]: 'Constancia COFIPRO registrada en el SNC',
  [TipoVerificacion.SANCIONES]: 'Sin multas ni sanciones pendientes',
};

/** TUPA MPH: la II-C agrega la COFIPRO y la consulta de sanciones. */
export function verificacionesObligatorias(categoria: Categoria): TipoVerificacion[] {
  const base = [TipoVerificacion.SNC_CERTIFICADO_MEDICO];
  return categoria === Categoria.II_C ? [...base, TipoVerificacion.SNC_COFIPRO, TipoVerificacion.SANCIONES] : base;
}

export function validarVerificacion(categoria: Categoria, tipo: TipoVerificacion, resultado: ResultadoVerificacion, detalle: string | null): void {
  if (!verificacionesObligatorias(categoria).includes(tipo)) {
    throw new ReglaNegocioError(`${NOMBRE_VERIFICACION[tipo]} no corresponde a la categoría ${categoria}`);
  }
  if (resultado === ResultadoVerificacion.NO_CONFORME && !detalle?.trim()) {
    throw new ReglaNegocioError('Indique qué encontró en el portal oficial');
  }
}

/** La constancia vigente de cada tipo es la última registrada (las anteriores quedan como historial). */
export function vigentes(verificaciones: Verificacion[]): Map<TipoVerificacion, Verificacion> {
  const ultimas = new Map<TipoVerificacion, Verificacion>();
  for (const v of [...verificaciones].sort((a, b) => a.id - b.id)) ultimas.set(v.tipo, v);
  return ultimas;
}
