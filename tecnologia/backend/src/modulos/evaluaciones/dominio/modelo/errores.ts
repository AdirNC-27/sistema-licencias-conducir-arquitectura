import { ConflictoError } from '../../../../compartido/dominio/errores';

export class ResultadoBloqueadoError extends ConflictoError {
  constructor(id: number) {
    super(`El resultado de la evaluación ${id} ya fue validado y no se puede modificar`);
  }
}

export class IntentosAgotadosError extends ConflictoError {
  constructor(id: number) {
    super(`La evaluación ${id} ya usó sus 3 intentos`);
  }
}
