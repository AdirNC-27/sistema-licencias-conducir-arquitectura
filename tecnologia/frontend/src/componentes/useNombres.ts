import { api } from '../api/cliente';
import type { Expediente, PostulanteResumen } from '../api/tipos';
import { useDatos } from './useDatos';

/** Nombres de los postulantes de una lista de expedientes, en una sola consulta (evita N+1). */
export function useNombres(expedientes: Pick<Expediente, 'postulanteId'>[] | null | undefined) {
  const ids = [...new Set((expedientes ?? []).map((e) => e.postulanteId))].sort((a, b) => a - b).join(',');
  const { datos } = useDatos(() => (ids ? api.get<PostulanteResumen[]>(`/postulantes?ids=${ids}`) : Promise.resolve([])), [ids]);
  return new Map((datos ?? []).map((p) => [p.id, p]));
}
