import { Documento, TipoDocumento } from './documento';

export interface ArchivoDocumento {
  nombre: string;
  tipoMime: string;
  contenido: Buffer;
}

export interface RepositorioDocumentos {
  registrar(datos: { expedienteId: number; tipo: TipoDocumento; fechaEmision: Date | null; archivo: ArchivoDocumento }): Promise<Documento>;
  buscarPorId(id: number): Promise<Documento>;
  listarDeExpediente(expedienteId: number): Promise<Documento[]>;
  guardarRevision(documento: Documento): Promise<void>;
  leerArchivo(id: number): Promise<ArchivoDocumento>;
}

export const REPOSITORIO_DOCUMENTOS = Symbol('RepositorioDocumentos');
