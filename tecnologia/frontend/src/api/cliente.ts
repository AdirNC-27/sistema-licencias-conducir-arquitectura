/** Cliente HTTP único: agrega el token JWT y traduce los errores de la API a mensajes. */
const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
const CLAVE_TOKEN = 'licencias.token';

export class ErrorApi extends Error {
  readonly estado: number;
  constructor(estado: number, mensaje: string) {
    super(mensaje);
    this.estado = estado;
  }
}

export const token = {
  leer: (): string | null => {
    try {
      return sessionStorage.getItem(CLAVE_TOKEN);
    } catch {
      return null;
    }
  },
  guardar: (valor: string | null) => {
    try {
      if (valor) sessionStorage.setItem(CLAVE_TOKEN, valor);
      else sessionStorage.removeItem(CLAVE_TOKEN);
    } catch {
      /* el navegador no permite almacenamiento */
    }
  },
};

let alExpirar: (() => void) | null = null;
export const configurarExpiracion = (fn: () => void) => {
  alExpirar = fn;
};

async function pedir<T>(metodo: string, ruta: string, cuerpo?: unknown): Promise<T> {
  const cabeceras: Record<string, string> = {};
  const t = token.leer();
  if (t) cabeceras.Authorization = `Bearer ${t}`;
  let body: BodyInit | undefined;
  if (cuerpo instanceof FormData) body = cuerpo;
  else if (cuerpo !== undefined) {
    cabeceras['Content-Type'] = 'application/json';
    body = JSON.stringify(cuerpo);
  }
  const r = await fetch(`${BASE}${ruta}`, { method: metodo, headers: cabeceras, body });
  if (r.status === 401 && t) alExpirar?.();
  if (!r.ok) {
    const datos = await r.json().catch(() => ({}));
    const mensaje = Array.isArray(datos.message) ? datos.message.join('. ') : (datos.mensaje ?? datos.message ?? `Error ${r.status}`);
    throw new ErrorApi(r.status, mensaje);
  }
  const tipo = r.headers.get('content-type') ?? '';
  return (tipo.includes('application/json') ? r.json() : r.blob()) as Promise<T>;
}

export const api = {
  get: <T>(ruta: string) => pedir<T>('GET', ruta),
  post: <T>(ruta: string, cuerpo?: unknown) => pedir<T>('POST', ruta, cuerpo),
  patch: <T>(ruta: string, cuerpo?: unknown) => pedir<T>('PATCH', ruta, cuerpo),
  archivo: (ruta: string) => pedir<Blob>('GET', ruta),
};
