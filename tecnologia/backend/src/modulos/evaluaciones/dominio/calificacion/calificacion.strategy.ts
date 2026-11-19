import { Resultado, TipoEvaluacion } from '../modelo/tipos';

export interface DatosCalificacion {
  puntaje: number;
  faltaEliminatoria?: boolean;
  observaciones?: string | null;
}

/** Patrón Strategy: cada examen se califica a su manera (RF08, RF16). */
export interface CalificacionStrategy {
  readonly tipo: TipoEvaluacion;
  calificar(datos: DatosCalificacion): Resultado;
}

/** Conocimientos: aprueba con la nota mínima configurable (por defecto 14 de 20). */
export class CalificacionConocimientos implements CalificacionStrategy {
  readonly tipo = TipoEvaluacion.CONOCIMIENTOS;
  constructor(private readonly notaMinima = 14) {}
  calificar(datos: DatosCalificacion): Resultado {
    return new Resultado(datos.puntaje, datos.puntaje >= this.notaMinima, datos.observaciones ?? null);
  }
}

/** Manejo: además de la nota mínima, una falta eliminatoria desaprueba el intento. */
export class CalificacionManejo implements CalificacionStrategy {
  readonly tipo = TipoEvaluacion.MANEJO;
  constructor(private readonly notaMinima = 14) {}
  calificar(datos: DatosCalificacion): Resultado {
    const aprobado = !datos.faltaEliminatoria && datos.puntaje >= this.notaMinima;
    return new Resultado(datos.puntaje, aprobado, datos.observaciones ?? null);
  }
}
