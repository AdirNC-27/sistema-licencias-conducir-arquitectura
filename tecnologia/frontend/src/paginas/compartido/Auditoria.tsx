import { useState } from 'react';
import { api } from '../../api/cliente';
import { fechaHora } from '../../api/textos';
import { useDatos } from '../../componentes/useDatos';
import { Cargando, Chip, Encabezado, Vacio } from '../../componentes/ui';

interface Registro { id: number; usuarioId: number; accion: string; entidad: string; entidadId: number; valorAnterior: unknown; valorNuevo: unknown; motivo: string | null; fecha: string }
const ENTIDADES = ['', 'documento', 'pago', 'evaluacion', 'expediente', 'usuario'];
const texto = (v: unknown) => (v == null ? '—' : typeof v === 'object' ? Object.entries(v as object).map(([k, x]) => `${k}: ${x}`).join(', ') : String(v));

/** RF17: bitácora de solo lectura. */
export function Auditoria() {
  const [entidad, setEntidad] = useState('');
  const { datos, cargando } = useDatos(() => api.get<Registro[]>(`/auditoria${entidad ? `?entidad=${entidad}` : ''}`), [entidad]);
  return (
    <div className="space-y-6">
      <Encabezado titulo="Auditoría" subtitulo="Quién hizo qué, cuándo, y el valor anterior y nuevo. Solo lectura." accion={
        <select aria-label="Entidad" className="campo w-auto" value={entidad} onChange={(e) => setEntidad(e.target.value)}>
          {ENTIDADES.map((x) => <option key={x} value={x}>{x ? x.charAt(0).toUpperCase() + x.slice(1) : 'Todas las entidades'}</option>)}
        </select>
      } />
      {cargando ? <Cargando /> : !datos?.length ? <div className="tarjeta"><Vacio titulo="Sin registros" icono="history" /></div> : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Usuario</th><th className="px-4 py-3">Acción</th><th className="px-4 py-3">Entidad</th><th className="px-4 py-3">Anterior</th><th className="px-4 py-3">Nuevo</th><th className="px-4 py-3">Motivo</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {datos.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">{fechaHora(r.fecha)}</td>
                  <td className="px-4 py-3">#{r.usuarioId}</td>
                  <td className="px-4 py-3"><Chip color="azul">{r.accion}</Chip></td>
                  <td className="px-4 py-3">{r.entidad} #{r.entidadId}</td>
                  <td className="px-4 py-3 text-slate-500">{texto(r.valorAnterior)}</td>
                  <td className="px-4 py-3">{texto(r.valorNuevo)}</td>
                  <td className="px-4 py-3 text-slate-500">{r.motivo ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
