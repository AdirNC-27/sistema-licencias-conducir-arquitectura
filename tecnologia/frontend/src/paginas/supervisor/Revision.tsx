import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/cliente';
import { fechaHora, NOMBRE_DOCUMENTO, nombreEtapa, soles, VERIFICACION, vigente } from '../../api/textos';
import type { Documento, Evaluacion, Expediente, Pago, PostulanteResumen, Revision as RevisionDatos } from '../../api/tipos';
import { mensajeError, useDatos } from '../../componentes/useDatos';
import { Aviso, Cargando, Chip, ChipEstado, Icono } from '../../componentes/ui';

/** RF11 · HU20, HU21 y HU22: el supervisor revisa el expediente completo, lo observa o autoriza la emisión. */
export function Revision() {
  const id = Number(useParams().id);
  const expediente = useDatos(() => api.get<Expediente>(`/expedientes/${id}`), [id]);
  const postulante = useDatos(() => (expediente.datos ? api.get<PostulanteResumen>(`/postulantes/${expediente.datos.postulanteId}`) : Promise.resolve(null)), [expediente.datos?.postulanteId]);
  const documentos = useDatos(() => api.get<Documento[]>(`/expedientes/${id}/documentos`), [id]);
  const pagos = useDatos(() => api.get<Pago[]>(`/expedientes/${id}/pagos`), [id]);
  const evaluaciones = useDatos(() => api.get<Evaluacion[]>(`/expedientes/${id}/evaluaciones`), [id]);
  const revision = useDatos(() => api.get<RevisionDatos>(`/expedientes/${id}/revision`), [id]);
  const [motivo, setMotivo] = useState('');
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const actuar = async (accion: () => Promise<unknown>, texto: string) => {
    setMensaje(null);
    try {
      await accion();
      setMensaje({ tipo: 'ok', texto });
      setMotivo('');
      revision.recargar();
      expediente.recargar();
    } catch (e) {
      setMensaje({ tipo: 'error', texto: mensajeError(e) });
    }
  };

  if (expediente.cargando || revision.cargando) return <Cargando />;
  if (!expediente.datos || !revision.datos) return <Aviso tipo="error">{expediente.error ?? revision.error ?? 'Expediente no encontrado'}</Aviso>;
  const e = expediente.datos;
  const r = revision.datos;
  const abierta = r.observaciones.find((o) => o.estado === 'ABIERTA');

  return (
    <div className="space-y-6">
      <Link to="/supervisor/emision" className="inline-flex items-center gap-1 text-sm font-semibold text-marca"><Icono nombre="arrow_back" className="text-lg" />Por emitir</Link>
      <div className="tarjeta flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-2xl font-extrabold text-marca">{e.numero}</p>
          <p className="font-medium capitalize">{postulante.datos?.nombre.toLowerCase()} · DNI {postulante.datos?.dni}</p>
        </div>
        <div className="text-right">
          <Chip color={e.etapa === 'EMITIDA' ? 'verde' : 'azul'}>{nombreEtapa(e.etapa)}</Chip>
          <p className="mt-2 text-sm text-slate-500">Licencia {e.categoria} · Día {e.plazo.diasTranscurridos}/10</p>
        </div>
      </div>
      {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="tarjeta" aria-labelledby="t-docs">
            <h2 id="t-docs" className="mb-2 font-bold text-marca-oscuro">Documentos y pago</h2>
            <ul className="divide-y divide-slate-100 text-sm">
              {documentos.datos?.map((d) => (
                <li key={d.id} className="flex items-center justify-between py-2"><span>{NOMBRE_DOCUMENTO[d.tipo] ?? d.tipo}</span><ChipEstado estado={d.estado} /></li>
              ))}
              {pagos.datos?.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2"><span>Pago {soles(Number(p.monto))} · Op. {p.numeroOperacion}</span><ChipEstado estado={p.estado} /></li>
              ))}
            </ul>
          </section>

          <section className="tarjeta" aria-labelledby="t-exam">
            <h2 id="t-exam" className="mb-2 font-bold text-marca-oscuro">Exámenes validados</h2>
            <ul className="divide-y divide-slate-100 text-sm">
              {evaluaciones.datos?.map((ev) => {
                const ultimo = ev.historial[ev.historial.length - 1];
                return (
                  <li key={ev.id} className="flex items-center justify-between py-2">
                    <span>{ev.tipo === 'MANEJO' ? 'Manejo' : 'Conocimientos'} · {ev.intentos} de 3 intentos{ultimo ? ` · nota ${ultimo.puntaje}` : ''}</span>
                    <Chip color={ultimo?.aprobado ? 'verde' : 'rojo'}>{ultimo?.aprobado ? 'Aprobado' : 'Sin aprobar'}</Chip>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="tarjeta" aria-labelledby="t-verif">
            <h2 id="t-verif" className="mb-2 font-bold text-marca-oscuro">Verificaciones del gestor en portales oficiales</h2>
            <ul className="divide-y divide-slate-100 text-sm">
              {r.verificacionesObligatorias.map((tipo) => {
                const v = vigente(r.verificaciones, tipo);
                return (
                  <li key={tipo} className="py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span>{VERIFICACION[tipo].nombre}</span>
                      {v ? <Chip color={v.resultado === 'CONFORME' ? 'verde' : 'rojo'}>{v.resultado === 'CONFORME' ? 'Conforme' : 'No conforme'}</Chip> : <Chip color="ambar">Pendiente</Chip>}
                    </div>
                    {v && <p className="text-xs text-slate-500">{v.detalle ? `${v.detalle} · ` : ''}{fechaHora(v.registradoEn)}</p>}
                  </li>
                );
              })}
            </ul>
          </section>

          {r.observaciones.length > 0 && (
            <section className="tarjeta" aria-labelledby="t-obs">
              <h2 id="t-obs" className="mb-2 font-bold text-marca-oscuro">Observaciones</h2>
              <ul className="space-y-3 text-sm">
                {r.observaciones.map((o) => (
                  <li key={o.id} className="rounded-xl bg-fondo p-3">
                    <div className="flex items-center justify-between gap-2"><p className="font-medium">{o.motivo}</p><Chip color={o.estado === 'ABIERTA' ? 'ambar' : 'verde'}>{o.estado === 'ABIERTA' ? 'Abierta' : 'Atendida'}</Chip></div>
                    {o.respuesta && <p className="mt-1 text-slate-600">Gestor: {o.respuesta}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="tarjeta h-fit" aria-labelledby="t-decision">
            <h2 id="t-decision" className="mb-2 font-bold text-marca-oscuro">Decisión</h2>
            {e.etapa === 'EMITIDA' ? (
              <Aviso tipo="ok">Licencia emitida{r.licencia ? ` · N.° ${r.licencia.numero}` : ' · falta que el gestor registre el número para el SNC'}.</Aviso>
            ) : (
              <>
                {r.pendientes.length > 0 ? (
                  <ul className="mb-3 space-y-1 text-sm text-amber-900">{r.pendientes.map((p) => <li key={p}>• {p}</li>)}</ul>
                ) : (
                  <p className="mb-3 text-sm text-emerald-800">Todo conforme: puedes autorizar la emisión.</p>
                )}
                <button className="btn-acento w-full" disabled={!r.listoParaEmitir} onClick={() => actuar(() => api.patch(`/expedientes/${id}/emision`), `Emisión autorizada para ${e.numero}. Se notificó al postulante.`)}>
                  <Icono nombre="verified" className="text-lg" />Autorizar emisión
                </button>
                {!abierta && e.etapa === 'EMISION' && (
                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <label htmlFor="motivo" className="etiqueta">Observar y devolver al gestor</label>
                    <textarea id="motivo" className="campo" rows={3} value={motivo} onChange={(ev) => setMotivo(ev.target.value)} placeholder="Ej.: la constancia COFIPRO del SNC no coincide con el DNI" />
                    <button className="btn-peligro mt-2 w-full" disabled={motivo.trim().length < 10} onClick={() => actuar(() => api.post(`/expedientes/${id}/observaciones`, { motivo }), 'Expediente devuelto al gestor')}>
                      <Icono nombre="undo" className="text-lg" />Devolver al gestor
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
