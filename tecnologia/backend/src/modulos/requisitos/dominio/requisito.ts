import { Categoria, TipoTramite } from '../../../compartido/dominio/categoria';

export interface Requisito {
  id: number;
  tipoTramite: TipoTramite;
  categoria: Categoria | null; // null = aplica a II-B y II-C
  orden: number;
  descripcion: string;
  codigoDocumento: string | null; // documento que el postulante debe subir, si corresponde
}

export interface RepositorioRequisitos {
  listar(tipoTramite: TipoTramite, categoria: Categoria): Promise<Requisito[]>;
}

export const REPOSITORIO_REQUISITOS = Symbol('RepositorioRequisitos');
