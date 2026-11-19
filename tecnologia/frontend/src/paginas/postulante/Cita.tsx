import { useState } from 'react';
import { api } from '../../api/cliente';
import { fecha } from '../../api/textos';
import type { Cita as TCita, Cupo } from '../../api/tipos';
import { mensajeError, useDatos } from '../../componentes/useDatos';
import { Aviso, Cargando, Chip, Encabezado, Icono, Vacio } from '../../componentes/ui';
import { SinTramite } from './SinTramite';
import { useMiExpediente } from './useMiExpediente';

/** RF07: elegir día y hora del examen según los cupos habilitados. */
export function Cita() {
  const { expediente, cargando, recargar } = useMiExpediente();
  const tipo = expediente?.etapa === 'EXAMEN_MANEJO' ? 'MANEJO' : 'CONOCIMIENTOS';
  const puedeReservar = expediente?.etapa === 'CITA' || expediente?.etapa === 'EXAMEN_MANEJO';
  const cupos = useDatos(() => (puedeReservar ? api.get<Cupo[]>(`/cupos?tipo=${tipo}`) : Promise.resolve([])), [expediente?.etapa]);
  const citas = useDatos(() => (expediente ? api.get<TCita[]>(`/expedientes/${expediente.id}/citas`) : Promise.resolve([])), [expediente?.id]);
  const [elegido, setElegido] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (cargando) return <Cargando />;
  if (!expediente) return <SinTramite />;
  const yaReservada = citas.datos?.some((c) => c.tipo === tipo);

  const reservar = async () => {
    if (!elegido) return;
    setEnviando(true);
    setMensaje(null);
    try {
      await api.post(`/expedientes/${expediente.id}/citas`, { cupoId: elegido });
      setMensaje({ tipo: 'ok', texto: 'Cita reservada. Te enviamos un recordatorio por correo.' });
      citas.recargar();
      cupos.recargar();
      recargar();
    } catch (e) {
      setMensaje({ tipo: 'error', texto: mensajeError(e) });
    } finally {
      setEnviando(false);
    }
  };

  const porDia = (cupos.datos ?? []).reduce<Record<string, Cupo[]>>((a, c) => ({ ...a, [c.fecha]: [...(a[c.fecha] ?? []), c] }), {});

  return (
    <div className="space-y-6">
      <Encabezado titulo="Elegir cita" subtitulo={tipo === 'MANEJO' ? 'Examen de manejo · martes a viernes' : 'Examen de conocimientos · lunes a miércoles'} />
      {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="tarjeta lg:col-span-2">
          {!puedeReservar ? (
            <Vacio titulo="Aún no puedes reservar" texto="La cita se habilita cuando el gestor verifica tu pago." icono="event_busy" />
          ) : yaReservada ? (
            <Vacio titulo="Ya tienes tu cita" texto="Revisa la fecha en el panel de la derecha." icono="event_available" />
          ) : cupos.cargando ? <Cargando /> : !Object.keys(porDia).length ? (
            <Vacio titulo="No hay cupos disponibles" texto="La administración habilita nuevos horarios cada semana." icono="event_busy" />
          ) : (
            <>
              <div className="space-y-5">
                {Object.entries(porDia).map(([dia, lista]) => (
                  <div key={dia}>
                    <p className="mb-2 text-sm font-semibold capitalize text-slate-600">{fecha(dia)}</p>
                    <div className="flex flex-wrap gap-2">
                      {lista.map((c) => (
                        <button key={c.id} disabled={c.disponibles === 0} onClick={() => setElegido(c.id)}
                          className={`rounded-xl px-4 py-2.5 text-sm font-semibold ring-1 transition disabled:opacity-40 ${elegido === c.id ? 'bg-marca text-white ring-marca' : 'bg-white ring-slate-200 hover:ring-marca'}`}>
                          {c.hora.slice(0, 5)} <span className={`ml-1 text-xs ${elegido === c.id ? 'text-blue-100' : 'text-slate-500'}`}>{c.disponibles} libres</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn-acento mt-6" disabled={!elegido || enviando} onClick={reservar}>
                <Icono nombre="event_available" className="text-lg" /> {enviando ? 'Reservando…' : 'Confirmar cita'}
              </button>
            </>
          )}
        </div>
        <div className="tarjeta">
          <h2 className="mb-3 font-bold text-marca-oscuro">Mis citas</h2>
          {!citas.datos?.length ? <p className="text-sm text-slate-500">Sin citas reservadas.</p> : (
            <ul className="space-y-3">
              {citas.datos.map((c) => (
                <li key={c.id} className="rounded-xl bg-fondo p-3">
                  <Chip color="azul">{c.tipo === 'MANEJO' ? 'Manejo' : 'Conocimientos'}</Chip>
                  <p className="mt-2 font-semibold capitalize">{fecha(c.fecha)}</p>
                  <p className="text-sm text-slate-600">{c.hora.slice(0, 5)} · Circuito de manejo MPH</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
