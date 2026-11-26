import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api/cliente';
import type { ConsultaAsistente, OrigenRespuesta, Pendiente, Rol } from '../../api/tipos';
import { useSesion } from '../../sesion/sesion';
import { mensajeError } from '../useDatos';
import { Icono } from '../ui';
import { AvatarLucia } from './AvatarLucia';

/** Un mensaje de la conversación, venga del postulante (guardado en la API) o del personal (en la pestaña). */
interface Mensaje {
  pregunta: string;
  respuesta: string;
  origen: OrigenRespuesta;
  creadoEn: string;
  respuestaGestor?: string | null;
  derivada?: boolean;
}

/** Opciones rápidas, como en WhatsApp: el texto del botón y la pregunta que se envía. */
const OPCIONES: Record<Rol, [string, string][]> = {
  POSTULANTE: [
    ['🏍️ Licencia para moto (II-B)', '¿Qué requisitos necesito para la licencia de moto II-B?'],
    ['🛺 Licencia para mototaxi (II-C)', '¿Qué requisitos necesito para la licencia de mototaxi II-C?'],
    ['💳 ¿Cuánto cuesta?', '¿Cuánto cuesta la licencia?'],
    ['🏦 ¿Dónde pago?', '¿Dónde pago la tasa?'],
    ['📅 Reservar mi cita', '¿Cómo reservo mi cita para el examen?'],
    ['📝 Exámenes e intentos', '¿Cuántos intentos tengo para los exámenes?'],
    ['📍 ¿Cómo va mi trámite?', '¿Cómo va mi trámite?'],
  ],
  GESTOR: [
    ['📋 ¿Qué tengo pendiente?', '¿Qué tengo pendiente?'],
    ['💳 Verificar un pago', '¿Cómo verifico un pago?'],
    ['🔎 Verificar en el SNC', '¿Cómo verifico en el SNC y en el récord de sanciones?'],
    ['🪪 Registrar la licencia', '¿Cómo registro el número de licencia para el SNC?'],
    ['💬 Consultas derivadas', '¿Cómo respondo las consultas que deriva la IA?'],
  ],
  EVALUADOR: [
    ['📋 ¿Qué tengo pendiente?', '¿Qué tengo pendiente?'],
    ['📝 Registrar una nota', '¿Cómo registro el resultado de un examen?'],
    ['✏️ Corregir una nota', '¿Puedo corregir un resultado que ya registré?'],
    ['🔁 Si desaprueba', '¿Qué pasa cuando un postulante desaprueba?'],
  ],
  SUPERVISOR: [
    ['📋 ¿Qué tengo pendiente?', '¿Qué tengo pendiente?'],
    ['✅ Validar un resultado', '¿Cómo valido un resultado?'],
    ['🪪 Autorizar la emisión', '¿Cuándo autorizo la emisión de una licencia?'],
    ['⏱️ Plazo legal', '¿Cuál es el plazo para atender un expediente?'],
  ],
  ADMINISTRADOR: [
    ['📋 ¿Qué tengo pendiente?', '¿Qué tengo pendiente?'],
    ['📅 Habilitar horarios', '¿Cómo habilito horarios de examen?'],
    ['🤖 Respuestas de Lucía', '¿Cómo mantengo las respuestas de la IA?'],
    ['👥 Cuentas del personal', '¿Cómo gestiono las cuentas del personal?'],
  ],
};

const ETIQUETA: Partial<Record<OrigenRespuesta, string>> = {
  IA: 'IA de orientación · contenido aprobado',
  CONTENIDO: 'Información oficial',
  ESTADO: 'Datos del sistema',
  DERIVADA: 'Pasé tu consulta al gestor',
};

const hora = (iso: string) => new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
const claveLocal = (id: number) => `lucia-conversacion-${id}`;

function leerLocal(id: number): Mensaje[] {
  try {
    return JSON.parse(sessionStorage.getItem(claveLocal(id)) ?? '[]') as Mensaje[];
  } catch {
    return [];
  }
}

/**
 * Lucía, la asistente virtual (IA de orientación), como chat flotante en todas las pantallas.
 * Postulante: su conversación se guarda (RF14, RF15). Personal: vive en la pestaña y no se guarda.
 */
export function ChatLucia() {
  const { usuario } = useSesion();
  const [parametros, setParametros] = useSearchParams();
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[] | null>(null);
  const [pendientes, setPendientes] = useState<Pendiente[]>([]);
  const [texto, setTexto] = useState('');
  const [escribiendo, setEscribiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitacion, setInvitacion] = useState(() => {
    try {
      return sessionStorage.getItem('lucia-invitacion') !== 'vista';
    } catch {
      return true;
    }
  });
  const final = useRef<HTMLDivElement>(null);
  const entrada = useRef<HTMLInputElement>(null);
  const postulante = usuario?.rol === 'POSTULANTE';

  // Un recordatorio puede abrir el chat con «?chat=abierto».
  useEffect(() => {
    if (parametros.get('chat') === 'abierto') {
      setAbierto(true);
      parametros.delete('chat');
      setParametros(parametros, { replace: true });
    }
  }, [parametros, setParametros]);

  const cargar = useCallback(async () => {
    if (!usuario) return;
    setError(null);
    try {
      if (postulante) setMensajes(await api.get<ConsultaAsistente[]>('/asistente/consultas/mias'));
      else setMensajes(leerLocal(usuario.id));
      setPendientes(await api.get<Pendiente[]>('/asistente/pendientes'));
    } catch (e) {
      setMensajes((m) => m ?? []);
      setError(mensajeError(e));
    }
  }, [usuario, postulante]);

  useEffect(() => {
    if (abierto) {
      void cargar();
      setInvitacion(false);
      try {
        sessionStorage.setItem('lucia-invitacion', 'vista');
      } catch {
        /* sin almacenamiento */
      }
      setTimeout(() => entrada.current?.focus(), 50);
    }
  }, [abierto, cargar]);

  useEffect(() => {
    if (!postulante && usuario && mensajes) {
      try {
        sessionStorage.setItem(claveLocal(usuario.id), JSON.stringify(mensajes.slice(-30)));
      } catch {
        /* sin almacenamiento: vive en memoria */
      }
    }
    final.current?.scrollIntoView?.({ block: 'end' });
  }, [mensajes, escribiendo, postulante, usuario]);

  // En pantallas anchas el chat abierto corre el contenido a la izquierda en lugar de taparlo.
  useEffect(() => {
    document.body.classList.toggle('lucia-abierta', abierto);
    return () => document.body.classList.remove('lucia-abierta');
  }, [abierto]);

  // La invitación se esconde sola a los 10 segundos.
  useEffect(() => {
    if (!invitacion) return;
    const t = setTimeout(() => setInvitacion(false), 10_000);
    return () => clearTimeout(t);
  }, [invitacion]);

  useEffect(() => {
    const alTeclado = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(false);
    window.addEventListener('keydown', alTeclado);
    return () => window.removeEventListener('keydown', alTeclado);
  }, []);

  if (!usuario) return null;
  const nombre = usuario.nombre.split(' ')[0];
  const nombreBonito = nombre.charAt(0).toUpperCase() + nombre.slice(1).toLowerCase();
  const urgentes = pendientes.filter((p) => p.urgente).length;

  const enviar = async (pregunta: string) => {
    if (pregunta.trim().length < 2 || escribiendo) return;
    setEscribiendo(true);
    setError(null);
    setTexto('');
    const provisional: Mensaje = { pregunta: pregunta.trim(), respuesta: '', origen: 'CONTENIDO', creadoEn: new Date().toISOString() };
    setMensajes((m) => [...(m ?? []), provisional]);
    try {
      const ruta = postulante ? '/asistente/consultas' : '/asistente/personal/consultas';
      const r = await api.post<Mensaje>(ruta, { pregunta: pregunta.trim() });
      setMensajes((m) => [...(m ?? []).slice(0, -1), r]);
    } catch (e) {
      setMensajes((m) => (m ?? []).slice(0, -1));
      setTexto(pregunta);
      setError(mensajeError(e));
    } finally {
      setEscribiendo(false);
    }
  };

  const alEnviar = (e: FormEvent) => {
    e.preventDefault();
    void enviar(texto);
  };

  return (
    <>
      {abierto && (
        <section
          role="dialog"
          aria-label="Chat con Lucía, asistente virtual"
          className="lucia-entrada fixed inset-x-2 bottom-2 z-50 flex h-[min(640px,calc(100dvh-1rem))] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 sm:inset-x-auto sm:bottom-24 sm:right-6 sm:h-[min(620px,calc(100dvh-8rem))] sm:w-[390px]"
        >
          <header className="flex items-center gap-3 bg-gradient-to-r from-marca-oscuro to-marca px-4 py-3 text-white">
            <AvatarLucia className="h-11 w-11 shrink-0" />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="font-bold">Lucía</p>
              <p className="flex items-center gap-1.5 text-xs text-blue-100">
                <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
                En línea · IA de orientación
              </p>
            </div>
            <button type="button" aria-label="Cerrar chat" onClick={() => setAbierto(false)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/15">
              <Icono nombre="close" className="text-xl" />
            </button>
          </header>

          <div className="lucia-fondo flex-1 space-y-3 overflow-y-auto px-3 py-4" aria-live="polite">
            <Burbuja de="lucia">
              <p>¡Hola, {nombreBonito}! 👋 Soy <b>Lucía</b>, la asistente virtual de la Municipalidad Provincial de Huamanga.</p>
              <p className="mt-1">{postulante ? '¿En qué te puedo ayudar con tu licencia?' : '¿En qué te ayudo hoy?'}</p>
              {pendientes.length > 0 && (
                <p className={`mt-2 rounded-xl px-3 py-2 text-xs font-semibold ${urgentes ? 'bg-amber-50 text-amber-900' : 'bg-marca-claro text-marca'}`}>
                  {postulante ? `Tienes ${pendientes.length === 1 ? 'un recordatorio' : `${pendientes.length} recordatorios`}` : `Tienes ${pendientes.length} ${pendientes.length === 1 ? 'pendiente' : 'pendientes'}`}
                  {urgentes ? ` (${urgentes} urgente${urgentes === 1 ? '' : 's'})` : ''}. Pregúntame «¿qué tengo pendiente?»{postulante ? ' o «¿cómo va mi trámite?»' : ''}.
                </p>
              )}
            </Burbuja>

            {mensajes === null && <p className="text-center text-xs text-slate-500">Cargando conversación…</p>}
            {mensajes?.map((m, i) => (
              <div key={`${m.creadoEn}-${i}`} className="space-y-2">
                <Burbuja de="usuario" hora={hora(m.creadoEn)}>{m.pregunta}</Burbuja>
                {m.respuesta && (
                  <Burbuja de="lucia" hora={hora(m.creadoEn)} etiqueta={ETIQUETA[m.origen]}>
                    <p className="whitespace-pre-line">{m.respuesta}</p>
                  </Burbuja>
                )}
                {m.respuestaGestor && (
                  <Burbuja de="gestor">
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700">Respuesta del gestor de trámites</p>
                    <p>{m.respuestaGestor}</p>
                  </Burbuja>
                )}
                {m.derivada && !m.respuestaGestor && <p className="pl-2 text-[11px] text-amber-800">El gestor aún no responde. Te avisaremos cuando lo haga.</p>}
              </div>
            ))}
            {escribiendo && (
              <div className="flex items-end gap-2">
                <AvatarLucia className="h-7 w-7 shrink-0" />
                <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm" aria-label="Lucía está escribiendo">
                  <span className="lucia-punto" />
                  <span className="lucia-punto [animation-delay:150ms]" />
                  <span className="lucia-punto [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={final} />
          </div>

          {error && <p role="alert" className="bg-red-50 px-4 py-2 text-xs text-red-700">{error}</p>}
          <div className="flex gap-2 overflow-x-auto border-t border-slate-100 bg-white px-3 py-2" role="group" aria-label="Opciones rápidas">
            {OPCIONES[usuario.rol].map(([etiqueta, pregunta]) => (
              <button
                key={etiqueta}
                type="button"
                disabled={escribiendo}
                onClick={() => enviar(pregunta)}
                className="shrink-0 rounded-full border border-marca/30 bg-white px-3 py-1.5 text-xs font-semibold text-marca transition hover:bg-marca-claro disabled:opacity-50"
              >
                {etiqueta}
              </button>
            ))}
          </div>
          <form onSubmit={alEnviar} className="flex items-center gap-2 bg-white px-3 pb-3 pt-1">
            <label htmlFor="mensaje-lucia" className="sr-only">Escribe tu mensaje para Lucía</label>
            <input
              id="mensaje-lucia"
              ref={entrada}
              className="flex-1 rounded-full border border-slate-200 bg-fondo px-4 py-2.5 text-sm outline-none focus:border-marca focus:ring-2 focus:ring-marca/20"
              maxLength={300}
              autoComplete="off"
              placeholder="Escribe un mensaje…"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
            />
            <button aria-label="Enviar" disabled={escribiendo || texto.trim().length < 2} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-acento-fuerte text-white shadow-md transition hover:brightness-95 disabled:opacity-40">
              <Icono nombre="send" className="text-lg" />
            </button>
          </form>
        </section>
      )}

      {!abierto && invitacion && (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="lucia-entrada fixed bottom-[11rem] right-4 z-40 hidden max-w-[220px] sm:block rounded-2xl rounded-br-md bg-white px-4 py-3 text-left text-sm text-slate-700 shadow-xl ring-1 ring-black/5 sm:bottom-28 sm:right-6"
        >
          <span className="font-bold text-marca-oscuro">¡Hola, {nombreBonito}!</span> Soy Lucía. ¿Te ayudo con algo?
        </button>
      )}

      <button
        type="button"
        aria-label={abierto ? 'Cerrar chat con Lucía' : 'Abrir chat con Lucía'}
        aria-expanded={abierto}
        onClick={() => setAbierto((a) => !a)}
        className={`fixed right-4 z-40 rounded-full shadow-xl shadow-blue-900/30 transition hover:scale-105 sm:right-6 ${postulante ? 'bottom-24 lg:bottom-6' : 'bottom-6'} ${abierto ? 'hidden sm:block' : ''}`}
      >
        <span className={`block ${!abierto ? 'lucia-flota' : ''}`}>
          <AvatarLucia className="h-16 w-16" saludando={!abierto} />
        </span>
        {!abierto && urgentes > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-6 min-w-6 place-items-center rounded-full bg-red-600 px-1.5 text-xs font-bold text-white ring-2 ring-white">{urgentes}</span>
        )}
      </button>
    </>
  );
}

function Burbuja({ de, hora, etiqueta, children }: { de: 'lucia' | 'usuario' | 'gestor'; hora?: string; etiqueta?: string; children: React.ReactNode }) {
  if (de === 'usuario') {
    return (
      <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-marca px-3.5 py-2 text-sm text-white shadow-sm">
        {children}
        {hora && <span className="ml-2 align-bottom text-[10px] text-blue-100">{hora}</span>}
      </div>
    );
  }
  return (
    <div className="flex items-end gap-2">
      {de === 'lucia' ? <AvatarLucia className="h-7 w-7 shrink-0" /> : <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-600 text-white"><Icono nombre="person" className="text-sm" /></span>}
      <div className={`max-w-[85%] rounded-2xl rounded-bl-md px-3.5 py-2.5 text-sm shadow-sm ${de === 'gestor' ? 'bg-emerald-50 text-emerald-950 ring-1 ring-emerald-200' : 'bg-white text-slate-800'}`}>
        {children}
        {(etiqueta || hora) && (
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[10px] text-slate-500">
            {etiqueta && <span className="font-semibold text-marca">{etiqueta}</span>}
            {hora && <span>{hora}</span>}
          </p>
        )}
      </div>
    </div>
  );
}
