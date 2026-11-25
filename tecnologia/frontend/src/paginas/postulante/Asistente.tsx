import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api } from '../../api/cliente';
import { fechaHora } from '../../api/textos';
import type { ConsultaAsistente, OrigenRespuesta } from '../../api/tipos';
import { mensajeError, useDatos } from '../../componentes/useDatos';
import { Pendientes } from '../../componentes/Pendientes';
import { Aviso, Cargando, Chip, Encabezado, Icono } from '../../componentes/ui';

const ORIGEN: Record<OrigenRespuesta, { texto: string; color: string }> = {
  IA: { texto: 'IA de orientación · contenido aprobado', color: 'azul' },
  CONTENIDO: { texto: 'Respuesta aprobada por la municipalidad', color: 'azul' },
  ESTADO: { texto: 'Datos de tu trámite', color: 'verde' },
  DERIVADA: { texto: 'Derivada al gestor de trámites', color: 'ambar' },
};

const SUGERENCIAS = ['¿Cómo va mi trámite?', '¿Cuánto cuesta la licencia?', '¿Cuántos intentos tengo para los exámenes?', '¿Cuánto tiempo vale el certificado médico?'];

/** RF14 y RF15 · HU11: el postulante pregunta; el asistente orienta o deriva al gestor. Nunca modifica el trámite. */
export function Asistente() {
  const conversacion = useDatos(() => api.get<ConsultaAsistente[]>('/asistente/consultas/mias'));
  const [pregunta, setPregunta] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const final = useRef<HTMLDivElement>(null);
  const cantidad = conversacion.datos?.length ?? 0;

  useEffect(() => {
    final.current?.scrollIntoView?.({ block: 'end' });
  }, [cantidad]);

  const enviar = async (texto: string) => {
    if (!texto.trim() || enviando) return;
    setEnviando(true);
    setError(null);
    try {
      const nueva = await api.post<ConsultaAsistente>('/asistente/consultas', { pregunta: texto.trim() });
      conversacion.setDatos([...(conversacion.datos ?? []), nueva]);
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
      <Encabezado titulo="Asistente" subtitulo="Te orienta sobre requisitos, pagos, citas, exámenes y el estado de tu trámite. No aprueba ni modifica nada." />
      <Pendientes titulo="Recordatorios" />
      <div className="tarjeta flex flex-col gap-4">
        {conversacion.cargando ? <Cargando /> : conversacion.error ? <Aviso tipo="error">{conversacion.error}</Aviso> : (
          <div className="flex max-h-[55vh] flex-col gap-4 overflow-y-auto pr-1" aria-live="polite">
            {cantidad === 0 && (
              <div className="flex items-start gap-3 rounded-2xl bg-fondo p-4 text-sm text-slate-700">
                <Icono nombre="smart_toy" className="mt-0.5 text-2xl text-marca" />
                <p>Hola, soy la IA de orientación de la Municipalidad Provincial de Huamanga. Respondo con la información aprobada del trámite. Si no tengo una respuesta segura, paso tu consulta al gestor y él te responde aquí.</p>
              </div>
            )}
            {conversacion.datos?.map((c) => (
              <div key={c.id} className="space-y-2">
                <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-marca px-4 py-2.5 text-sm text-white">{c.pregunta}</p>
                <div className="max-w-[90%] space-y-2">
                  <div className="rounded-2xl rounded-bl-md bg-fondo px-4 py-3 text-sm text-slate-800">
                    <p>{c.respuesta}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Chip color={ORIGEN[c.origen].color}>{ORIGEN[c.origen].texto}</Chip>
                      <span className="text-xs text-slate-500">{fechaHora(c.creadoEn)}</span>
                    </div>
                  </div>
                  {c.respuestaGestor && (
                    <div className="rounded-2xl rounded-bl-md bg-emerald-50 px-4 py-3 text-sm text-emerald-900 ring-1 ring-emerald-200">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide">Respuesta del gestor de trámites</p>
                      <p>{c.respuestaGestor}</p>
                    </div>
                  )}
                  {c.derivada && !c.respuestaGestor && <p className="text-xs text-amber-800">El gestor aún no responde. Te avisaremos cuando lo haga.</p>}
                </div>
              </div>
            ))}
            <div ref={final} />
          </div>
        )}
        {error && <Aviso tipo="error">{error}</Aviso>}
        <div className="flex flex-wrap gap-2">
          {SUGERENCIAS.map((s) => (
            <button key={s} type="button" className="rounded-full bg-marca-claro px-3 py-1.5 text-xs font-semibold text-marca hover:bg-blue-100 disabled:opacity-50" disabled={enviando} onClick={() => enviar(s)}>{s}</button>
          ))}
        </div>
        <form onSubmit={alEnviar} className="flex gap-2">
          <label htmlFor="pregunta" className="sr-only">Escribe tu pregunta</label>
          <input id="pregunta" className="campo flex-1" maxLength={300} placeholder="Escribe tu pregunta…" value={pregunta} onChange={(e) => setPregunta(e.target.value)} />
          <button className="btn-primario" disabled={enviando || pregunta.trim().length < 3}>
            <Icono nombre="send" className="text-lg" />{enviando ? 'Enviando…' : 'Enviar'}
          </button>
        </form>
      </div>
    </div>
  );
}
