import type { ReactNode } from 'react';
import { nombreEtapa } from '../api/textos';
import type { Expediente } from '../api/tipos';
import { Barra, Chip } from './ui';
import { useNombres } from './useNombres';

/** Tabla reutilizada por las bandejas del personal; en móvil se muestra como tarjetas. */
export function TablaExpedientes({ expedientes, accion }: { expedientes: Expediente[]; accion: (e: Expediente) => ReactNode }) {
  const nombres = useNombres(expedientes);
  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr><th className="px-4 py-3">Expediente</th><th className="px-4 py-3">Postulante</th><th className="px-4 py-3">Cat.</th><th className="px-4 py-3">Etapa</th><th className="px-4 py-3">Plazo</th><th className="px-4 py-3" /></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expedientes.map((e) => {
              const p = nombres.get(e.postulanteId);
              return (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-marca">{e.numero}</td>
                  <td className="px-4 py-3"><p className="font-medium capitalize">{p?.nombre.toLowerCase() ?? '…'}</p><p className="text-xs text-slate-500">DNI {p?.dni ?? ''}</p></td>
                  <td className="px-4 py-3">{e.categoria}</td>
                  <td className="px-4 py-3"><Chip color="azul">{nombreEtapa(e.etapa)}</Chip></td>
                  <td className="w-40 px-4 py-3">
                    <Barra porcentaje={e.plazo.porcentaje} color={e.plazo.vencido ? 'bg-red-500' : e.plazo.porcentaje >= 70 ? 'bg-amber-500' : 'bg-marca'} />
                    <p className="mt-1 text-xs text-slate-500">Día {e.plazo.diasTranscurridos}/10</p>
                  </td>
                  <td className="px-4 py-3 text-right">{accion(e)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ul className="space-y-3 md:hidden">
        {expedientes.map((e) => {
          const p = nombres.get(e.postulanteId);
          return (
            <li key={e.id} className="tarjeta p-4">
              <div className="flex items-center justify-between"><p className="font-bold text-marca">{e.numero}</p><Chip color="azul">{nombreEtapa(e.etapa)}</Chip></div>
              <p className="mt-1 font-medium capitalize">{p?.nombre.toLowerCase() ?? '…'}</p>
              <p className="mb-3 text-xs text-slate-500">DNI {p?.dni} · {e.categoria} · Día {e.plazo.diasTranscurridos}/10</p>
              {accion(e)}
            </li>
          );
        })}
      </ul>
    </>
  );
}
