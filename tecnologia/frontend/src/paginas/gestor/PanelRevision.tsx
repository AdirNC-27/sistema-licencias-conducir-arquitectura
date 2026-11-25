import { useState } from 'react';
import { api } from '../../api/cliente';
import { fechaHora, VERIFICACION, vigente } from '../../api/textos';
import type { Expediente, Revision, TipoVerificacion } from '../../api/tipos';
import { mensajeError, useDatos } from '../../componentes/useDatos';
import { Aviso, Chip, Icono } from '../../componentes/ui';

/**
 * RF24, RF27 y RF11 para el gestor: deja constancia de lo que vio en los portales oficiales,
 * atiende las observaciones del supervisor y registra la licencia emitida para el SNC.
 */
export function PanelRevision({ expediente, dni, alCambiar }: { expediente: Expediente; dni?: string; alCambiar: () => void }) {
  const revision = useDatos(() => api.get<Revision>(`/expedientes/${expediente.id}/revision`), [expediente.id, expediente.etapa]);
  const [detalle, setDetalle] = useState<Record<string, string>>({});
  const [respuesta, setRespuesta] = useState('');
  const [numero, setNumero] = useState('');
  const [reabiertas, setReabiertas] = useState<Record<string, boolean>>({});
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const actuar = async (accion: () => Promise<unknown>, texto: string, limpiar?: () => void) => {
    setMensaje(null);
    try {
      await accion();
      setMensaje({ tipo: 'ok', texto });
      limpiar?.();
      revision.recargar();
      alCambiar();
    } catch (e) {
      setMensaje({ tipo: 'error', texto: mensajeError(e) });
    }
  };

  const r = revision.datos;
  if (!r) return <div className="tarjeta h-fit text-sm text-slate-500">{revision.error ?? 'Cargando verificaciones…'}</div>;
  const emitido = r.etapa === 'EMITIDA';
  const abierta = r.observaciones.find((o) => o.estado === 'ABIERTA');
  const verificar = (tipo: TipoVerificacion, resultado: 'CONFORME' | 'NO_CONFORME') =>
    actuar(
      () => api.post(`/expedientes/${expediente.id}/verificaciones`, { tipo, resultado, detalle: detalle[tipo] || undefined }),
      `${VERIFICACION[tipo].nombre}: ${resultado === 'CONFORME' ? 'conforme' : 'no conforme'}`,
      () => {
        setDetalle({ ...detalle, [tipo]: '' });
        setReabiertas({ ...reabiertas, [tipo]: false });
      },
    );

  return (
    <div className="space-y-6">
      {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}

      {abierta && (
        <div className="tarjeta ring-2 ring-amber-300">
          <h2 className="mb-1 flex items-center gap-2 font-bold text-amber-900"><Icono nombre="undo" className="text-lg" />Devuelto por el supervisor</h2>
          <p className="text-sm text-slate-700">{abierta.motivo}</p>
          <p className="mt-1 text-xs text-slate-500">{fechaHora(abierta.creadoEn)}</p>
          <label htmlFor="atencion" className="etiqueta mt-3">Qué corregiste</label>
          <textarea id="atencion" className="campo" rows={3} value={respuesta} onChange={(e) => setRespuesta(e.target.value)} placeholder="Ej.: se volvió a consultar el SNC y la constancia es correcta" />
          <button className="btn-primario mt-2 w-full" disabled={respuesta.trim().length < 10} onClick={() => actuar(() => api.patch(`/observaciones/${abierta.id}/atencion`, { respuesta }), 'Observación atendida: el supervisor puede volver a revisar', () => setRespuesta(''))}>
            Marcar como atendida
          </button>
        </div>
      )}

      <div className="tarjeta h-fit">
        <h2 className="mb-1 font-bold text-marca-oscuro">Verificación en portales oficiales</h2>
        <p className="mb-4 text-sm text-slate-500">Consulta con el DNI {dni} y deja constancia. Sin estas verificaciones conformes no se puede emitir la licencia.</p>
        <ul className="space-y-4">
          {r.verificacionesObligatorias.map((tipo) => {
            const v = vigente(r.verificaciones, tipo);
            const info = VERIFICACION[tipo];
            return (
              <li key={tipo} className="rounded-xl bg-fondo p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-800">{info.nombre}</p>
                  {v ? <Chip color={v.resultado === 'CONFORME' ? 'verde' : 'rojo'}>{v.resultado === 'CONFORME' ? 'Conforme' : 'No conforme'}</Chip> : <Chip color="ambar">Pendiente</Chip>}
                </div>
                {v?.detalle && <p className="mt-1 text-xs text-slate-600">{v.detalle}</p>}
                <a href={info.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-marca">{info.portal}<Icono nombre="open_in_new" className="text-sm" /></a>
                {!emitido && v?.resultado === 'CONFORME' && !reabiertas[tipo] && (
                  <button className="mt-1 block text-xs font-semibold text-slate-500 underline" onClick={() => setReabiertas({ ...reabiertas, [tipo]: true })}>Volver a verificar</button>
                )}
                {!emitido && (v?.resultado !== 'CONFORME' || reabiertas[tipo]) && (
                  <div className="mt-2 space-y-2">
                    <label className="sr-only" htmlFor={`detalle-${tipo}`}>Detalle de {info.nombre}</label>
                    <input id={`detalle-${tipo}`} className="campo py-2" placeholder="Detalle (obligatorio si no es conforme)" value={detalle[tipo] ?? ''} onChange={(e) => setDetalle({ ...detalle, [tipo]: e.target.value })} />
                    <div className="flex gap-2">
                      <button className="btn-primario flex-1 py-2" aria-label={`Conforme: ${info.nombre}`} onClick={() => verificar(tipo, 'CONFORME')}>Conforme</button>
                      <button className="btn-peligro flex-1 py-2" aria-label={`No conforme: ${info.nombre}`} disabled={!detalle[tipo]?.trim()} onClick={() => verificar(tipo, 'NO_CONFORME')}>No conforme</button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        {r.pendientes.length > 0 && r.etapa === 'EMISION' && <p className="mt-3 text-xs text-amber-800">Pendiente para emitir: {r.pendientes.join('; ')}.</p>}
      </div>

      {emitido && (
        <div className="tarjeta h-fit">
          <h2 className="mb-1 font-bold text-marca-oscuro">Licencia para el SNC</h2>
          {r.licencia ? (
            <Aviso tipo="ok">Licencia <b>{r.licencia.numero}</b> registrada el {fechaHora(r.licencia.registradaEn)}.</Aviso>
          ) : (
            <>
              <p className="mb-3 text-sm text-slate-500">Registra el número de la licencia emitida para su carga en el SNC del MTC. Se avisará al postulante.</p>
              <label htmlFor="numero-licencia" className="etiqueta">Número de licencia</label>
              <input id="numero-licencia" className="campo" maxLength={15} value={numero} onChange={(e) => setNumero(e.target.value)} placeholder={`Ej.: Q${dni ?? '45892014'}`} />
              <button className="btn-acento mt-2 w-full" disabled={numero.trim().length < 6} onClick={() => actuar(() => api.post(`/expedientes/${expediente.id}/licencia`, { numero }), 'Licencia registrada para el SNC', () => setNumero(''))}>
                Registrar licencia
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
