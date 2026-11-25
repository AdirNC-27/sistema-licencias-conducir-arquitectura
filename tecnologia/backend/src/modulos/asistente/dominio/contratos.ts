import { ConsultaAsistente, OrigenRespuesta } from './consulta';
import { ContenidoAprobado, DatosContenido } from './contenido';

export interface RepositorioContenidos {
  /** Contenido público que casi no cambia: el adaptador puede mantenerlo en caché (ADR-009). */
  activos(): Promise<ContenidoAprobado[]>;
  todos(): Promise<ContenidoAprobado[]>;
  buscarPorId(id: number): Promise<ContenidoAprobado>;
  crear(datos: DatosContenido): Promise<ContenidoAprobado>;
  actualizar(contenido: ContenidoAprobado): Promise<ContenidoAprobado>;
}

export interface RepositorioConsultas {
  registrar(datos: { postulanteId: number; pregunta: string; respuesta: string; origen: OrigenRespuesta; fuentes: number[] }): Promise<ConsultaAsistente>;
  buscarPorId(id: number): Promise<ConsultaAsistente>;
  dePostulante(postulanteId: number, limite: number): Promise<ConsultaAsistente[]>;
  derivadas(soloPendientes: boolean): Promise<ConsultaAsistente[]>;
  guardarRespuestaGestor(consulta: ConsultaAsistente): Promise<void>;
}

/** Lo que la IA devuelve: un texto y si el contenido entregado alcanza para responder. */
export interface RedaccionIA {
  respuesta: string;
  confiable: boolean;
}

/**
 * Contrato de la IA de orientación (ADR-007, ADR-015). Recibe la pregunta ya anonimizada y solo
 * el contenido aprobado que la responde; no recibe datos del expediente ni puede escribir nada.
 */
export interface AsistenteIA {
  readonly disponible: boolean;
  /** null si el servicio no respondió a tiempo o devolvió algo no válido. */
  redactar(pregunta: string, contenidos: ContenidoAprobado[]): Promise<RedaccionIA | null>;
}

export const REPOSITORIO_CONTENIDOS = Symbol('RepositorioContenidos');
export const REPOSITORIO_CONSULTAS = Symbol('RepositorioConsultas');
export const ASISTENTE_IA = Symbol('AsistenteIA');
