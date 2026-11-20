import { useCallback, useEffect, useRef, useState } from 'react';
import { ErrorApi } from '../api/cliente';

/**
 * Carga datos de la API con estados de carga y error.
 * `recargar` (tras una acción del usuario) actualiza en segundo plano, sin mostrar "Cargando",
 * para no desmontar el formulario ni perder el mensaje de confirmación.
 *
 * Solo se aplica la respuesta de la solicitud más reciente: si el usuario aprueba varios documentos
 * seguidos o cambia un filtro rápido, una respuesta antigua que llega tarde no reemplaza a la nueva.
 */
export function useDatos<T>(cargar: () => Promise<T>, dependencias: unknown[] = []) {
  const [datos, setDatos] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const ultimaSolicitud = useRef(0);

  const obtener = useCallback(async (silencioso: boolean) => {
    const solicitud = ++ultimaSolicitud.current;
    const vigente = () => solicitud === ultimaSolicitud.current;
    if (!silencioso) setCargando(true);
    try {
      const resultado = await cargar();
      if (!vigente()) return;
      setDatos(resultado);
      setError(null);
    } catch (e) {
      if (vigente()) setError(mensajeError(e));
    } finally {
      if (vigente()) setCargando(false);
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
