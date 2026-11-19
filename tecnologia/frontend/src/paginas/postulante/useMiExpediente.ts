import { api } from '../../api/cliente';
import type { Expediente } from '../../api/tipos';
import { useDatos } from '../../componentes/useDatos';

/** El trámite activo del postulante (el más reciente). */
export function useMiExpediente() {
  const r = useDatos(async () => (await api.get<Expediente[]>('/expedientes/mios'))[0] ?? null);
  return { expediente: r.datos, cargando: r.cargando, error: r.error, recargar: r.recargar };
}
