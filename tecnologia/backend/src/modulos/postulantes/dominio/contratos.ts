import { DatosIdentidad, Postulante } from './postulante';

/** Contrato que implementa el adaptador de API Perú (ADR-012). */
export interface VerificadorIdentidad {
  consultar(dni: string): Promise<DatosIdentidad>;
}

export interface RepositorioPostulantes {
  existeDni(dni: string): Promise<boolean>;
  crear(datos: Omit<Postulante, 'id' | 'nombreCompleto'>): Promise<Postulante>;
  buscarPorId(id: number): Promise<Postulante | null>;
  buscarVarios(ids: number[]): Promise<Postulante[]>;
}

export const VERIFICADOR_IDENTIDAD = Symbol('VerificadorIdentidad');
export const REPOSITORIO_POSTULANTES = Symbol('RepositorioPostulantes');
