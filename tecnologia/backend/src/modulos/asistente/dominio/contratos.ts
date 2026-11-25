import { ConsultaAsistente, OrigenRespuesta } from './consulta';
import { Audiencia, ContenidoAprobado, DatosContenido } from './contenido';
import { DatosPostulante, IndicadoresPersonal } from './pendientes';

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
  redactar(pregunta: string, contenidos: ContenidoAprobado[], audiencia?: Audiencia): Promise<RedaccionIA | null>;
}

/**
 * Modelo de lectura de los pendientes (ADR-016): consultas de solo lectura sobre las tablas del
 * trámite para contar lo que falta hacer. No escribe ni pasa por los casos de uso de otros módulos.
 */
export interface LecturaPendientes {
  indicadoresPersonal(hoy: Date): Promise<IndicadoresPersonal>;
  datosPostulante(postulanteId: number, hoy: Date): Promise<DatosPostulante | null>;
}

export const REPOSITORIO_CONTENIDOS = Symbol('RepositorioContenidos');
export const REPOSITORIO_CONSULTAS = Symbol('RepositorioConsultas');
export const ASISTENTE_IA = Symbol('AsistenteIA');
export const LECTURA_PENDIENTES = Symbol('LecturaPendientes');
