import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, configurarExpiracion, token } from '../api/cliente';
import type { Rol, UsuarioSesion } from '../api/tipos';

interface ContextoSesion {
  usuario: UsuarioSesion | null;
  cargando: boolean;
  iniciar: (usuario: string, clave: string) => Promise<UsuarioSesion>;
  salir: () => void;
}

const Contexto = createContext<ContextoSesion | null>(null);
const CLAVE_USUARIO = 'licencias.usuario';

const leerUsuario = (): UsuarioSesion | null => {
  try {
    const v = sessionStorage.getItem(CLAVE_USUARIO);
    return v ? (JSON.parse(v) as UsuarioSesion) : null;
  } catch {
    return null;
  }
};

/** Inicio de la app según el rol: el rol lo define la cuenta (ADR-004). */
export const INICIO_POR_ROL: Record<Rol, string> = {
  POSTULANTE: '/postulante',
  GESTOR: '/gestor',
  EVALUADOR: '/evaluador',
  SUPERVISOR: '/supervisor',
  ADMINISTRADOR: '/admin',
};

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(() => (token.leer() ? leerUsuario() : null));
  const [cargando] = useState(false);

  const salir = useCallback(() => {
    token.guardar(null);
    try {
      sessionStorage.removeItem(CLAVE_USUARIO);
    } catch {
      /* sin almacenamiento */
    }
    setUsuario(null);
  }, []);

  useEffect(() => configurarExpiracion(salir), [salir]);

  const iniciar = useCallback(async (u: string, clave: string) => {
    const r = await api.post<{ token: string; usuario: UsuarioSesion }>('/auth/login', { usuario: u, clave });
    token.guardar(r.token);
    try {
      sessionStorage.setItem(CLAVE_USUARIO, JSON.stringify(r.usuario));
    } catch {
      /* sin almacenamiento */
    }
    setUsuario(r.usuario);
    return r.usuario;
  }, []);

  const valor = useMemo(() => ({ usuario, cargando, iniciar, salir }), [usuario, cargando, iniciar, salir]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSesion() {
  const c = useContext(Contexto);
  if (!c) throw new Error('useSesion fuera de ProveedorSesion');
  return c;
}
