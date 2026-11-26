import { useState, type FormEvent } from 'react';
import { api } from '../../api/cliente';
import { fecha, soles } from '../../api/textos';
import type { Pago as TPago } from '../../api/tipos';
import { mensajeError, useDatos } from '../../componentes/useDatos';
import { Aviso, Cargando, ChipEstado, Encabezado, Icono, Vacio } from '../../componentes/ui';
import { SinTramite } from './SinTramite';
import { useMiExpediente } from './useMiExpediente';

const TASA = { 'II-B': 69.9, 'II-C': 69.4 } as const;

/** RF05: registrar el recibo pagado en el SAT Huamanga. */
export function Pago() {
  const { expediente, cargando } = useMiExpediente();
  const pagos = useDatos(() => (expediente ? api.get<TPago[]>(`/expedientes/${expediente.id}/pagos`) : Promise.resolve([])), [expediente?.id]);
  const [f, setF] = useState({ numeroOperacion: '', fechaPago: '' });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (cargando) return <Cargando />;
  if (!expediente) return <SinTramite />;
  const tasa = TASA[expediente.categoria];
  const pendiente = pagos.datos?.some((p) => p.estado === 'PENDIENTE' || p.estado === 'VERIFICADO');
  const puedeRegistrar = expediente.etapa === 'PAGO' && !pendiente;

  const registrar = async (e: FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await api.post(`/expedientes/${expediente.id}/pagos`, { ...f, monto: tasa });
      setF({ numeroOperacion: '', fechaPago: '' });
      pagos.recargar();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-6">
      <Encabezado icono="payments" titulo="Pago de la tasa" subtitulo="Se paga en el SAT Huamanga y aquí registras tu recibo" />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          <div className="tarjeta bg-gradient-to-br from-marca-oscuro to-marca text-white">
            <p className="text-sm text-blue-100">Tasa licencia {expediente.categoria}</p>
            <p className="text-4xl font-extrabold">{soles(tasa)}</p>
            <p className="mt-3 flex items-center gap-2 text-sm text-blue-100"><Icono nombre="location_on" className="text-lg" />Módulo 11 del MAC Huamanga (SAT)</p>
          </div>
          {expediente.etapa === 'DOCUMENTOS' && <Aviso tipo="alerta">Primero el gestor debe aprobar tus documentos.</Aviso>}
          {puedeRegistrar && (
            <form onSubmit={registrar} className="tarjeta space-y-4">
              <h2 className="font-bold text-marca-oscuro">Registrar mi recibo</h2>
              <div>
                <label className="etiqueta" htmlFor="op">Número de operación</label>
                <input id="op" className="campo" value={f.numeroOperacion} minLength={4} maxLength={30} onChange={(e) => setF({ ...f, numeroOperacion: e.target.value })} required />
              </div>
              <div>
                <label className="etiqueta" htmlFor="fp">Fecha de pago</label>
                <input id="fp" type="date" className="campo" value={f.fechaPago} onChange={(e) => setF({ ...f, fechaPago: e.target.value })} required />
              </div>
              {error && <Aviso tipo="error">{error}</Aviso>}
              <button className="btn-acento w-full" disabled={enviando}>{enviando ? 'Registrando…' : `Registrar pago de ${soles(tasa)}`}</button>
            </form>
          )}
        </div>
        <div className="tarjeta lg:col-span-3">
          <h2 className="mb-3 font-bold text-marca-oscuro">Mis pagos</h2>
          {pagos.cargando ? <Cargando /> : !pagos.datos?.length ? <Vacio titulo="Sin pagos registrados" icono="receipt_long" /> : (
            <ul className="divide-y divide-slate-100">
              {pagos.datos.map((p) => (
                <li key={p.id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">Operación {p.numeroOperacion}</p>
                      <p className="text-sm text-slate-500">{fecha(p.fechaPago)} · {soles(Number(p.monto))}</p>
                    </div>
                    <ChipEstado estado={p.estado} />
                  </div>
                  {p.observacion && <p className="mt-2 text-sm text-red-700">{p.observacion}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
