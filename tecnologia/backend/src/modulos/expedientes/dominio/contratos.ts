import { Categoria, TipoTramite } from '../../../compartido/dominio/categoria';
import { Etapa } from './etapa';
import { Expediente } from './expediente';

export interface FiltroExpedientes {
  etapa?: Etapa;
  categoria?: Categoria;
  pagina: number;
  tamano: number;
}

export interface RepositorioExpedientes {
  crear(datos: { postulanteId: number; tipoTramite: TipoTramite; categoria: Categoria }): Promise<Expediente>;
  buscarPorId(id: number): Promise<Expediente>;
  listar(filtro: FiltroExpedientes): Promise<{ total: number; datos: Expediente[] }>;
  listarDePostulante(postulanteId: number): Promise<Expediente[]>;
  guardarEtapa(expediente: Expediente): Promise<void>;
  guardarCategoria(expediente: Expediente): Promise<void>;
  tieneTramiteActivo(postulanteId: number): Promise<boolean>;
}

export const REPOSITORIO_EXPEDIENTES = Symbol('RepositorioExpedientes');

/** Fachada pública del módulo (patrón Facade): lo único que otros módulos pueden usar. */
export interface ExpedientesApi {
  obtener(id: number): Promise<Expediente>;
  avanzarEtapa(id: number, desde: Etapa, usuarioId: number): Promise<Expediente>;
  /** Trámite más reciente del postulante, o null si no tiene ninguno. */
  ultimoDePostulante(postulanteId: number): Promise<Expediente | null>;
}

export const EXPEDIENTES_API = Symbol('ExpedientesApi');
