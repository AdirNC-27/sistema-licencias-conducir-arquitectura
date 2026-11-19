import { useState, type FormEvent } from 'react';
import { api } from '../../api/cliente';
import { fecha } from '../../api/textos';
import type { Cupo } from '../../api/tipos';
import { mensajeError, useDatos } from '../../componentes/useDatos';
import { Aviso, Barra, Cargando, Encabezado, Vacio } from '../../componentes/ui';

type Tipo = 'CONOCIMIENTOS' | 'MANEJO';

/** RF21: días y cupos de examen. Conocimientos de lunes a miércoles; manejo de martes a viernes. */
export function Cupos() {
  const [tipo, setTipo] = useState<Tipo>('CONOCIMIENTOS');
  const lista = useDatos(() => api.get<Cupo[]>(`/cupos?tipo=${tipo}`), [tipo]);
  const [f, setF] = useState({ fecha: '', hora: '08:30', capacidad: '15' });
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const crear = async (e: FormEvent) => {
    e.preventDefault();
    setMensaje(null);
    try {
      await api.post('/cupos', { ...f, tipo, capacidad: Number(f.capacidad) });
      setMensaje({ tipo: 'ok', texto: 'Horario habilitado.' });
      lista.recargar();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: mensajeError(err) });
    }
  };

  return (
    <div className="space-y-6">
      <Encabezado titulo="Días y cupos" subtitulo="Conocimientos: lunes a miércoles · Manejo: martes a viernes" />
      <div className="flex gap-2">
        {(['CONOCIMIENTOS', 'MANEJO'] as const).map((t) => (
          <button key={t} onClick={() => setTipo(t)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ring-1 ${tipo === t ? 'bg-marca text-white ring-marca' : 'bg-white text-slate-600 ring-slate-200'}`}>{t === 'MANEJO' ? 'Manejo' : 'Conocimientos'}</button>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={crear} className="tarjeta h-fit space-y-4">
          <h2 className="font-bold text-marca-oscuro">Habilitar horario</h2>
          <div><label className="etiqueta" htmlFor="f">Fecha</label><input id="f" type="date" className="campo" value={f.fecha} onChange={(e) => setF({ ...f, fecha: e.target.value })} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="etiqueta" htmlFor="h">Hora</label><input id="h" type="time" className="campo" value={f.hora} onChange={(e) => setF({ ...f, hora: e.target.value })} required /></div>
            <div><label className="etiqueta" htmlFor="c">Cupos</label><input id="c" type="number" min={1} max={200} className="campo" value={f.capacidad} onChange={(e) => setF({ ...f, capacidad: e.target.value })} required /></div>
          </div>
          {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}
          <button className="btn-acento w-full">Habilitar</button>
        </form>
        <div className="tarjeta lg:col-span-2">
          <h2 className="mb-3 font-bold text-marca-oscuro">Próximos horarios</h2>
          {lista.cargando ? <Cargando /> : !lista.datos?.length ? <Vacio titulo="Sin horarios habilitados" icono="event_busy" /> : (
            <ul className="divide-y divide-slate-100">
              {lista.datos.map((c) => (
                <li key={c.id} className="flex items-center gap-4 py-3">
                  <div className="w-44"><p className="font-semibold capitalize">{fecha(c.fecha)}</p><p className="text-sm text-slate-500">{c.hora.slice(0, 5)}</p></div>
                  <div className="flex-1"><Barra porcentaje={((c.capacidad - c.disponibles) / c.capacidad) * 100} /></div>
                  <p className="w-28 text-right text-sm"><b>{c.capacidad - c.disponibles}</b>/{c.capacidad} ocupados</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
