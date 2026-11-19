import { Cupo, TipoExamen } from './cupo';

export interface Cita {
  id: number;
  expedienteId: number;
  cupoId: number;
  tipo: TipoExamen;
  fecha: Date;
  hora: string;
}

export interface RepositorioCitas {
  crearCupo(datos: { fecha: Date; hora: string; tipo: TipoExamen; capacidad: number }): Promise<Cupo>;
  buscarCupo(id: number): Promise<Cupo>;
  listarCupos(tipo: TipoExamen, desde: Date): Promise<Cupo[]>;
  /** Reserva de forma atómica: devuelve null si otro usuario tomó el último cupo (concurrencia). */
  reservar(cupoId: number, expedienteId: number): Promise<Cita | null>;
  citasDeExpediente(expedienteId: number): Promise<Cita[]>;
}

export const REPOSITORIO_CITAS = Symbol('RepositorioCitas');
