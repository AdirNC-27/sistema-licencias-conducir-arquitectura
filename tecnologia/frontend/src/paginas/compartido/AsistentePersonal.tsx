import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api } from '../../api/cliente';
import { fechaHora } from '../../api/textos';
import type { ConsultaPersonal, OrigenRespuesta, Rol } from '../../api/tipos';
import { Pendientes } from '../../componentes/Pendientes';
import { mensajeError } from '../../componentes/useDatos';
import { Aviso, Chip, Encabezado, Icono } from '../../componentes/ui';
import { useSesion } from '../../sesion/sesion';

const ORIGEN: Record<OrigenRespuesta, { texto: string; color: string }> = {
  IA: { texto: 'IA de orientación · procedimiento aprobado', color: 'azul' },
  CONTENIDO: { texto: 'Procedimiento aprobado', color: 'azul' },
  ESTADO: { texto: 'Datos del sistema', color: 'verde' },
  DERIVADA: { texto: 'Sin contenido aprobado', color: 'ambar' },
};

const SUGERENCIAS: Partial<Record<Rol, string[]>> = {
  GESTOR: ['¿Qué tengo pendiente?', '¿Cómo verifico un pago?', '¿Cómo verifico en el SNC?', '¿Cómo registro el número de licencia?'],
  EVALUADOR: ['¿Qué tengo pendiente?', '¿Cómo registro el resultado de un examen?', '¿Puedo corregir una nota?', '¿Qué es una falta eliminatoria?'],
  SUPERVISOR: ['¿Qué tengo pendiente?', '¿Cuándo autorizo la emisión?', '¿Cómo valido un resultado?', '¿Cuál es el plazo legal?'],
  ADMINISTRADOR: ['¿Qué tengo pendiente?', '¿Cómo habilito horarios de examen?', '¿Cómo mantengo las respuestas de la IA?', '¿Qué registra la auditoría?'],
};

/** La conversación no se guarda en el servidor; se conserva mientras la pestaña esté abierta. */
const clave = (id?: number) => `conversacion-personal-${id ?? 0}`;
function leer(id?: number): ConsultaPersonal[] {
  try {
    return JSON.parse(sessionStorage.getItem(clave(id)) ?? '[]') as ConsultaPersonal[];
  } catch {
    return [];
  }
}

/** IA de orientación para el personal: pendientes del rol y procedimientos aprobados. No ejecuta acciones. */
export function AsistentePersonal() {
  const { usuario } = useSesion();
  const [conversacion, setConversacion] = useState<ConsultaPersonal[]>(() => leer(usuario?.id));
  const [pregunta, setPregunta] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const final = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(clave(usuario?.id), JSON.stringify(conversacion.slice(-30)));
    } catch {
      /* sin almacenamiento: la conversación vive solo en memoria */
    }
    final.current?.scrollIntoView?.({ block: 'end' });
  }, [conversacion, usuario?.id]);

  const enviar = async (texto: string) => {
    if (!texto.trim() || enviando) return;
    setEnviando(true);
    setError(null);
    try {
      const r = await api.post<ConsultaPersonal>('/asistente/personal/consultas', { pregunta: texto.trim() });
      setConversacion((c) => [...c, r]);
      setPregunta('');
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setEnviando(false);
    }
  };

  const alEnviar = (e: FormEvent) => {
    e.preventDefault();
    void enviar(pregunta);
  };

  return (
    <div className="space-y-6">
      <Encabezado titulo="Asistente" subtitulo="Te recuerda lo pendiente y responde cómo hacer cada paso con los procedimientos aprobados. No ejecuta acciones." />
      <Pendientes vacio="No tienes pendientes en este momento." />
      <div className="tarjeta flex flex-col gap-4">
        <div className="flex max-h-[50vh] flex-col gap-4 overflow-y-auto pr-1" aria-live="polite">
          {conversacion.length === 0 && (
            <div className="flex items-start gap-3 rounded-2xl bg-fondo p-4 text-sm text-slate-700">
              <Icono nombre="smart_toy" className="mt-0.5 text-2xl text-marca" />
              <p>Hola, {usuario?.nombre.split(' ')[0]}. Soy la IA de orientación. Pregúntame qué tienes pendiente o cómo se hace algún paso del trámite.</p>
            </div>
          )}
          {conversacion.map((c, i) => (
            <div key={`${c.creadoEn}-${i}`} className="space-y-2">
              <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-marca px-4 py-2.5 text-sm text-white">{c.pregunta}</p>
              <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-fondo px-4 py-3 text-sm text-slate-800">
                <p className="whitespace-pre-line">{c.respuesta}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Chip color={ORIGEN[c.origen].color}>{ORIGEN[c.origen].texto}</Chip>
                  <span className="text-xs text-slate-500">{fechaHora(c.creadoEn)}</span>
                </div>
              </div>
            </div>
          ))}
          <div ref={final} />
        </div>
        {error && <Aviso tipo="error">{error}</Aviso>}
        <div className="flex flex-wrap gap-2">
          {(usuario ? SUGERENCIAS[usuario.rol] ?? [] : []).map((s) => (
            <button key={s} type="button" className="rounded-full bg-marca-claro px-3 py-1.5 text-xs font-semibold text-marca hover:bg-blue-100 disabled:opacity-50" disabled={enviando} onClick={() => enviar(s)}>{s}</button>
          ))}
        </div>
        <form onSubmit={alEnviar} className="flex gap-2">
          <label htmlFor="pregunta-personal" className="sr-only">Escribe tu pregunta</label>
          <input id="pregunta-personal" className="campo flex-1" maxLength={300} placeholder="Escribe tu pregunta…" value={pregunta} onChange={(e) => setPregunta(e.target.value)} />
          <button className="btn-primario" disabled={enviando || pregunta.trim().length < 3}>
            <Icono nombre="send" className="text-lg" />{enviando ? 'Enviando…' : 'Enviar'}
          </button>
        </form>
      </div>
    </div>
  );
}
