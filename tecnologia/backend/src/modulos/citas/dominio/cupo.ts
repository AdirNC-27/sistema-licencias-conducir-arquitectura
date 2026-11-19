import { ConflictoError, ReglaNegocioError } from '../../../compartido/dominio/errores';

export enum TipoExamen {
  CONOCIMIENTOS = 'CONOCIMIENTOS',
  MANEJO = 'MANEJO',
}

/** RF21: conocimientos de lunes a miércoles; manejo de martes a viernes (0 = domingo). */
export const DIAS_PERMITIDOS: Record<TipoExamen, number[]> = {
  [TipoExamen.CONOCIMIENTOS]: [1, 2, 3],
  [TipoExamen.MANEJO]: [2, 3, 4, 5],
};

export function validarDiaDeExamen(tipo: TipoExamen, fecha: Date): void {
  if (!DIAS_PERMITIDOS[tipo].includes(fecha.getUTCDay())) {
    const texto = tipo === TipoExamen.CONOCIMIENTOS ? 'lunes a miércoles' : 'martes a viernes';
    throw new ReglaNegocioError(`El examen de ${tipo.toLowerCase()} solo se programa de ${texto}`);
  }
}

export class Cupo {
  constructor(
    readonly id: number,
    readonly fecha: Date,
    readonly hora: string,
    readonly tipo: TipoExamen,
    readonly capacidad: number,
    private ocupados: number,
  ) {
    if (capacidad < 1) throw new ReglaNegocioError('La capacidad debe ser al menos 1');
  }

  get disponibles(): number {
    return this.capacidad - this.ocupados;
  }

  /** RF21: no se asigna una cita si no hay cupo. */
  reservar(hoy = new Date()): void {
    if (this.fecha.getTime() < new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate())).getTime()) {
      throw new ReglaNegocioError('No se puede reservar una fecha pasada');
    }
    if (this.disponibles <= 0) throw new ConflictoError('No hay cupos disponibles para ese horario');
    this.ocupados++;
  }
}
