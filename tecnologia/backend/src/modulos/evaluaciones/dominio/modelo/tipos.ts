export enum TipoEvaluacion {
  CONOCIMIENTOS = 'CONOCIMIENTOS',
  MANEJO = 'MANEJO',
}

export enum EstadoResultado {
  PENDIENTE = 'PENDIENTE', // espera el registro del intento
  REGISTRADO = 'REGISTRADO', // el evaluador lo registró; aún se puede corregir
  VALIDADO = 'VALIDADO', // aprobado y validado por el supervisor: bloqueado
  AGOTADO = 'AGOTADO', // 3 intentos desaprobados y validados
}

/** Objeto de valor: el resultado de un intento. */
export class Resultado {
  constructor(
    readonly puntaje: number,
    readonly aprobado: boolean,
    readonly observaciones: string | null = null,
  ) {}
}

export interface IntentoValidado {
  numero: number;
  puntaje: number;
  aprobado: boolean;
  observaciones: string | null;
}
