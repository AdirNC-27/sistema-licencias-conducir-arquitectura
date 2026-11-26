import { useState } from 'react';
import { api } from '../../api/cliente';
import { fechaHora } from '../../api/textos';
import type { ConsultaAsistente } from '../../api/tipos';
import { mensajeError, useDatos } from '../../componentes/useDatos';
import { Aviso, Cargando, Encabezado, Icono, Vacio } from '../../componentes/ui';

/** RF15: consultas que el asistente no pudo responder con seguridad o que pedían una acción. */
export function Consultas() {
  const [estado, setEstado] = useState<'PENDIENTE' | 'RESPONDIDA'>('PENDIENTE');
  const consultas = useDatos(() => api.get<ConsultaAsistente[]>(`/asistente/derivadas?estado=${estado}`), [estado]);
  const [respuestas, setRespuestas] = useState<Record<number, string>>({});
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const responder = async (c: ConsultaAsistente) => {
    setMensaje(null);
    try {
      await api.patch(`/asistente/consultas/${c.id}/respuesta`, { respuesta: respuestas[c.id] });
      setMensaje({ tipo: 'ok', texto: 'Respuesta enviada. El postulante recibió un aviso.' });
      consultas.recargar();
    } catch (e) {
      setMensaje({ tipo: 'error', texto: mensajeError(e) });
    }
  };

  return (
    <div className="space-y-6">
      <Encabezado icono="chats" titulo="Consultas del asistente" subtitulo="Preguntas que la IA de orientación derivó porque no tenía una respuesta aprobada o pedían una acción" />
      <div className="flex gap-2">
        {(['PENDIENTE', 'RESPONDIDA'] as const).map((e) => (
          <button key={e} onClick={() => setEstado(e)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ring-1 ${estado === e ? 'bg-marca text-white ring-marca' : 'bg-white text-slate-600 ring-slate-200'}`}>
            {e === 'PENDIENTE' ? 'Por responder' : 'Respondidas'}
          </button>
        ))}
      </div>
      {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}
      {consultas.error && <Aviso tipo="error">{consultas.error}</Aviso>}
      {consultas.cargando ? <Cargando /> : !consultas.datos?.length ? (
        <div className="tarjeta"><Vacio titulo={estado === 'PENDIENTE' ? 'No hay consultas por responder' : 'Aún no hay consultas respondidas'} icono="forum" /></div>
      ) : (
        <ul className="space-y-4">
          {consultas.datos.map((c) => (
            <li key={c.id} className="tarjeta">
              <p className="text-xs text-slate-500"><span className="font-semibold text-slate-700">{c.postulanteNombre ?? `Postulante ${c.postulanteId}`}</span>{c.postulanteDni && ` · DNI ${c.postulanteDni}`} · {fechaHora(c.creadoEn)}</p>
              <p className="mt-1 font-semibold text-slate-800">{c.pregunta}</p>
              {c.respuestaGestor ? (
                <p className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{c.respuestaGestor}</p>
              ) : (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <label htmlFor={`respuesta-${c.id}`} className="sr-only">Respuesta a: {c.pregunta}</label>
                  <input id={`respuesta-${c.id}`} className="campo flex-1" placeholder="Escribe la respuesta para el postulante" value={respuestas[c.id] ?? ''} onChange={(e) => setRespuestas({ ...respuestas, [c.id]: e.target.value })} />
                  <button className="btn-primario" disabled={(respuestas[c.id] ?? '').trim().length < 5} onClick={() => responder(c)}>
                    <Icono nombre="send" className="text-lg" />Responder
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
