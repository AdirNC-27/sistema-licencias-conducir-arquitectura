import { ReglaNegocioError } from '../../../compartido/dominio/errores';

export enum TemaContenido {
  REQUISITOS = 'REQUISITOS',
  DOCUMENTOS = 'DOCUMENTOS',
  PAGOS = 'PAGOS',
  CITAS = 'CITAS',
  EVALUACIONES = 'EVALUACIONES',
  TRAMITE = 'TRAMITE',
}

/** A quién responde el contenido: al ciudadano o al personal municipal (procedimientos internos). */
export enum Audiencia {
  POSTULANTE = 'POSTULANTE',
  PERSONAL = 'PERSONAL',
}

/** Contenido aprobado por el administrador (HU25): la única fuente de las respuestas (RF15, RC06). */
export interface ContenidoAprobado {
  id: number;
  tema: TemaContenido;
  audiencia: Audiencia;
  pregunta: string;
  respuesta: string;
  /** Sinónimos o formas en que la gente pregunta, separados por comas. */
  palabrasClave: string;
  activo: boolean;
}

export type DatosContenido = Omit<ContenidoAprobado, 'id'>;

export function validarContenido(d: DatosContenido): DatosContenido {
  const pregunta = d.pregunta.trim();
  const respuesta = d.respuesta.trim();
  if (pregunta.length < 5) throw new ReglaNegocioError('La pregunta debe tener al menos 5 caracteres');
  if (respuesta.length < 10) throw new ReglaNegocioError('La respuesta debe tener al menos 10 caracteres');
  return { ...d, pregunta, respuesta, palabrasClave: d.palabrasClave.trim() };
}
