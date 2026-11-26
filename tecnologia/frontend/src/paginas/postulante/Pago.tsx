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
          {expediente.etapa === 'DOCUMENTOS' && (
            <div className="tarjeta">
              <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
                <Icono nombre="lock" className="mt-0.5 shrink-0 text-lg" />
                <p><b>Aún no pagues.</b> Primero el gestor aprueba tus documentos; te avisamos por correo y aquí se habilita el registro del recibo.</p>
              </div>
              <h2 className="mt-4 font-bold text-marca-oscuro">Cómo será el pago</h2>
              <ol className="mt-2 space-y-3 text-sm text-slate-700">
                {[
                  ['location_on', 'Paga la tasa en el SAT Huamanga', 'Módulo 11 del MAC Ayacucho (Terrapuerto Libertadores de América, 2.º nivel): lunes a viernes de 8:30 a 17:00 y sábados de 8:30 a 13:00. También en BBVA o Interbank.'],
                  ['receipt_long', 'Guarda tu recibo', 'Necesitas el número de operación y la fecha de pago.'],
                  ['edit_note', 'Regístralo aquí', 'El gestor lo verifica y se habilita la elección de tu cita.'],
                ].map(([icono, titulo, texto], i) => (
                  <li key={titulo} className="flex gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-marca text-xs font-bold text-white">{i + 1}</span>
                    <div><p className="flex items-center gap-1.5 font-semibold"><Icono nombre={icono} className="text-marca" />{titulo}</p><p className="text-slate-600">{texto}</p></div>
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-xs text-slate-500">El pago es único: incluye el examen de conocimientos y el de manejo.</p>
            </div>
          )}
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
          {pagos.cargando ? <Cargando /> : !pagos.datos?.length ? <Vacio titulo="Sin pagos registrados" texto={expediente.etapa === 'DOCUMENTOS' ? 'Aquí aparecerá tu recibo cuando lo registres, después de que aprueben tus documentos.' : 'Registra tu recibo con el formulario de la izquierda.'} icono="receipt_long" /> : (
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
