import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/cliente';
import { fecha, NOMBRE_DOCUMENTO, nombreEtapa, soles } from '../../api/textos';
import type { Documento, Expediente, Pago, PostulanteResumen } from '../../api/tipos';
import { mensajeError, useDatos } from '../../componentes/useDatos';
import { Aviso, Cargando, Chip, ChipEstado, Icono, Vacio } from '../../componentes/ui';
import { PanelRevision } from './PanelRevision';

/** Detalle del expediente para el gestor: documentos (RF04), pagos (RF06), verificaciones oficiales (RF24, RF27) y observaciones del supervisor (RF11). */
export function Detalle() {
  const id = Number(useParams().id);
  const expediente = useDatos(() => api.get<Expediente>(`/expedientes/${id}`), [id]);
  const postulante = useDatos(() => (expediente.datos ? api.get<PostulanteResumen>(`/postulantes/${expediente.datos.postulanteId}`) : Promise.resolve(null)), [expediente.datos?.postulanteId]);
  const documentos = useDatos(() => api.get<Documento[]>(`/expedientes/${id}/documentos`), [id]);
  const pagos = useDatos(() => api.get<Pago[]>(`/expedientes/${id}/pagos`), [id]);
  const [observacion, setObservacion] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const actuar = async (accion: () => Promise<unknown>, texto: string) => {
    setMensaje(null);
    try {
      await accion();
      setMensaje({ tipo: 'ok', texto });
      documentos.recargar();
      pagos.recargar();
      expediente.recargar();
    } catch (e) {
      setMensaje({ tipo: 'error', texto: mensajeError(e) });
    }
  };

  const verArchivo = async (docId: number) => {
    try {
      const blob = await api.archivo(`/documentos/${docId}/archivo`);
      window.open(URL.createObjectURL(blob), '_blank', 'noopener');
    } catch (e) {
      setMensaje({ tipo: 'error', texto: mensajeError(e) });
    }
  };

  if (expediente.cargando) return <Cargando />;
  if (expediente.error || !expediente.datos) return <Aviso tipo="error">{expediente.error ?? 'Expediente no encontrado'}</Aviso>;
  const e = expediente.datos;
  const p = postulante.datos;

  return (
    <div className="space-y-6">
      <Link to="/gestor" className="inline-flex items-center gap-1 text-sm font-semibold text-marca"><Icono nombre="arrow_back" className="text-lg" />Bandeja</Link>
      <div className="tarjeta flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-2xl font-extrabold text-marca">{e.numero}</p>
          <p className="font-medium capitalize">{p?.nombre.toLowerCase()} · DNI {p?.dni}</p>
          <p className="text-sm text-slate-500">{p?.correo} · {p?.celular}</p>
        </div>
        <div className="text-right">
          <Chip color="azul">{nombreEtapa(e.etapa)}</Chip>
          <p className="mt-2 text-sm text-slate-500">Licencia {e.categoria} · Día {e.plazo.diasTranscurridos}/10</p>
        </div>
      </div>
      {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="tarjeta">
            <h2 className="mb-2 font-bold text-marca-oscuro">Documentos</h2>
            {!documentos.datos?.length ? <Vacio titulo="El postulante aún no adjunta documentos" icono="folder_open" /> : (
              <ul className="divide-y divide-slate-100">
                {documentos.datos.map((d) => (
                  <li key={d.id} className="py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button onClick={() => verArchivo(d.id)} className="flex items-center gap-2 font-semibold text-slate-800 hover:text-marca">
                        <Icono nombre="visibility" className="text-lg text-marca" />{NOMBRE_DOCUMENTO[d.tipo] ?? d.tipo}
                      </button>
                      <ChipEstado estado={d.estado} />
                    </div>
                    {d.observacion && <p className="mt-1 text-sm text-red-700">{d.observacion}</p>}
                    {d.estado === 'PENDIENTE' && (
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <input className="campo flex-1" placeholder="Observación (si corresponde)" value={observacion[`d${d.id}`] ?? ''} onChange={(ev) => setObservacion({ ...observacion, [`d${d.id}`]: ev.target.value })} />
                        <button className="btn-primario" onClick={() => actuar(() => api.patch(`/documentos/${d.id}/revision`, { estado: 'APROBADO' }), 'Documento aprobado')}>Aprobar</button>
                        <button className="btn-peligro" disabled={!observacion[`d${d.id}`]} onClick={() => actuar(() => api.patch(`/documentos/${d.id}/revision`, { estado: 'OBSERVADO', observacion: observacion[`d${d.id}`] }), 'Documento observado')}>Observar</button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="tarjeta">
            <h2 className="mb-2 font-bold text-marca-oscuro">Pagos</h2>
            {!pagos.datos?.length ? <Vacio titulo="Sin pagos registrados" icono="receipt_long" /> : (
              <ul className="divide-y divide-slate-100">
                {pagos.datos.map((pg) => (
                  <li key={pg.id} className="py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">Op. {pg.numeroOperacion} · {soles(Number(pg.monto))} · {fecha(pg.fechaPago)}</p>
                      <ChipEstado estado={pg.estado} />
                    </div>
                    {pg.estado === 'PENDIENTE' && (
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <input className="campo flex-1" placeholder="Observación (si corresponde)" value={observacion[`p${pg.id}`] ?? ''} onChange={(ev) => setObservacion({ ...observacion, [`p${pg.id}`]: ev.target.value })} />
                        <button className="btn-primario" onClick={() => actuar(() => api.patch(`/pagos/${pg.id}/verificacion`, { estado: 'VERIFICADO' }), 'Pago verificado')}>Verificar</button>
                        <button className="btn-suave" disabled={!observacion[`p${pg.id}`]} onClick={() => actuar(() => api.patch(`/pagos/${pg.id}/verificacion`, { estado: 'OBSERVADO', observacion: observacion[`p${pg.id}`] }), 'Pago observado')}>Observar</button>
                        <button className="btn-peligro" disabled={!observacion[`p${pg.id}`]} onClick={() => actuar(() => api.patch(`/pagos/${pg.id}/verificacion`, { estado: 'RECHAZADO', observacion: observacion[`p${pg.id}`] }), 'Pago rechazado')}>Rechazar</button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <PanelRevision expediente={e} dni={p?.dni} alCambiar={expediente.recargar} />
      </div>
    </div>
  );
}
