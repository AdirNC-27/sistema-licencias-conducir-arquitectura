import { Evaluacion } from '../modelo/evaluacion';
import { TipoEvaluacion } from '../modelo/tipos';

export interface RepositorioEvaluaciones {
  buscarPorId(id: number): Promise<Evaluacion>;
  buscarOCrear(expedienteId: number, tipo: TipoEvaluacion): Promise<Evaluacion>;
  listarDeExpediente(expedienteId: number): Promise<Evaluacion[]>;
  guardar(evaluacion: Evaluacion): Promise<void>;
}

export const REPOSITORIO_EVALUACIONES = Symbol('RepositorioEvaluaciones');
export const ESTRATEGIAS_CALIFICACION = Symbol('EstrategiasCalificacion');
