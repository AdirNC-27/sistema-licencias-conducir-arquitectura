import { useCallback, useEffect, useState } from 'react';
import { ErrorApi } from '../api/cliente';

/**
 * Carga datos de la API con estados de carga y error.
 * `recargar` (tras una acción del usuario) actualiza en segundo plano, sin mostrar "Cargando",
 * para no desmontar el formulario ni perder el mensaje de confirmación.
 */
export function useDatos<T>(cargar: () => Promise<T>, dependencias: unknown[] = []) {
  const [datos, setDatos] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  const obtener = useCallback(async (silencioso: boolean) => {
    if (!silencioso) setCargando(true);
    setError(null);
    try {
      setDatos(await cargar());
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencias);

  useEffect(() => {
    void obtener(false);
  }, [obtener]);

  const recargar = useCallback(() => obtener(true), [obtener]);
  return { datos, error, cargando, recargar, setDatos };
}

export const mensajeError = (e: unknown) => (e instanceof ErrorApi ? e.message : 'No se pudo conectar con el servidor');
