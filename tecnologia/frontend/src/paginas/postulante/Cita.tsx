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
      <Encabezado icono="event" titulo="Elegir cita" subtitulo={tipo === 'MANEJO' ? 'Examen de manejo · martes a viernes' : 'Examen de conocimientos · lunes a miércoles'} />
      {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="tarjeta lg:col-span-2">
          {!puedeReservar ? (
            <ComoSonLosExamenes etapa={expediente?.etapa} />
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
                  <p className="text-sm text-slate-600">{c.hora.slice(0, 5)} · {c.tipo === 'MANEJO' ? 'Circuito de manejo de la MPH' : 'Subgerencia de Tránsito, Av. 26 de Enero'}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/** Vista previa mientras la reserva no está habilitada: qué exámenes hay, qué días y dónde. */
function ComoSonLosExamenes({ etapa }: { etapa?: string }) {
  const examenes = [
    { icono: 'quiz', titulo: 'Examen de conocimientos', dias: [0, 1, 2], texto: 'Lunes a miércoles', lugar: 'Subgerencia de Tránsito y Seguridad Vial, Av. 26 de Enero', nota: 'Primero este. El examen lo proporciona el MTC.' },
    { icono: 'two_wheeler', titulo: 'Examen de manejo', dias: [1, 2, 3, 4], texto: 'Martes a viernes', lugar: 'Circuito de manejo de la municipalidad', nota: 'Se habilita al aprobar el de conocimientos.' },
  ];
  const semana = ['L', 'M', 'M', 'J', 'V'];
  return (
    <div>
      <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
        <Icono nombre="lock" className="mt-0.5 shrink-0 text-lg" />
        <p><b>Aún no puedes reservar.</b> {etapa === 'DOCUMENTOS' ? 'Primero el gestor aprueba tus documentos, luego registras tu pago y, cuando lo verifique, eliges aquí tu cita.' : 'La cita se habilita cuando el gestor verifica tu pago.'}</p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {examenes.map((e, i) => (
          <div key={e.titulo} className="rounded-2xl bg-white p-4 opacity-90 ring-1 ring-slate-200">
            <p className="flex items-center gap-2 font-bold text-marca-oscuro">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-marca text-xs text-white">{i + 1}</span>
              <Icono nombre={e.icono} className="text-lg text-marca" />{e.titulo}
            </p>
            <div className="mt-3 flex gap-1.5">
              {semana.map((d, n) => (
                <span key={n} aria-hidden="true" className={`grid h-8 w-8 place-items-center rounded-lg text-xs font-bold ${e.dias.includes(n) ? 'bg-marca-claro text-marca ring-1 ring-blue-200' : 'bg-slate-100 text-slate-400'}`}>{d}</span>
              ))}
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-700">{e.texto}</p>
            <p className="mt-1 flex gap-1.5 text-sm text-slate-600"><Icono nombre="location_on" className="mt-0.5 shrink-0 text-marca" />{e.lugar}</p>
            <p className="mt-1 text-xs text-slate-500">{e.nota}</p>
          </div>
        ))}
      </div>
      <ul className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
        <li className="flex gap-2"><Icono nombre="check_circle" className="mt-0.5 shrink-0 text-emerald-600" />3 oportunidades por examen, sin pagar de nuevo</li>
        <li className="flex gap-2"><Icono nombre="check_circle" className="mt-0.5 shrink-0 text-emerald-600" />Apruebas con 14 de 20</li>
        <li className="flex gap-2"><Icono nombre="notifications" className="mt-0.5 shrink-0 text-marca" />Te recordamos tu cita por correo</li>
      </ul>
    </div>
  );
}
