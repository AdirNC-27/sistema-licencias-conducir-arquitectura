import type { ReactNode } from 'react';
import { nombreEtapa } from '../api/textos';
import type { Etapa, Expediente } from '../api/tipos';
import { Avatar, Icono } from './ui';
import { useNombres } from './useNombres';

const ETAPA: Record<Etapa, [string, string]> = {
  DOCUMENTOS: ['description', 'bg-blue-50 text-marca ring-blue-200'],
  PAGO: ['payments', 'bg-emerald-50 text-emerald-700 ring-emerald-200'],
  CITA: ['event', 'bg-sky-50 text-sky-700 ring-sky-200'],
  EXAMEN_CONOCIMIENTOS: ['quiz', 'bg-violet-50 text-violet-700 ring-violet-200'],
  EXAMEN_MANEJO: ['two_wheeler', 'bg-acento-claro text-orange-700 ring-orange-200'],
  EMISION: ['shield', 'bg-amber-50 text-amber-700 ring-amber-200'],
  EMITIDA: ['badge', 'bg-emerald-50 text-emerald-700 ring-emerald-200'],
};

export function ChipEtapa({ etapa, corto = false }: { etapa: Etapa; corto?: boolean }) {
  const [icono, color] = ETAPA[etapa] ?? ['folder_open', 'bg-slate-100 text-slate-600 ring-slate-200'];
  const nombre = corto ? nombreEtapa(etapa).replace('Examen de ', '').replace(/^./, (c) => c.toUpperCase()) : nombreEtapa(etapa);
  return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${color}`}><Icono nombre={icono} className="text-sm" />{nombre}</span>;
}

function Plazo({ e }: { e: Expediente }) {
  const color = e.plazo.vencido ? 'bg-red-500' : e.plazo.porcentaje >= 70 ? 'bg-amber-500' : 'bg-emerald-500';
  const texto = e.plazo.vencido ? 'text-red-600' : e.plazo.porcentaje >= 70 ? 'text-amber-700' : 'text-slate-500';
  return (
    <div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, e.plazo.porcentaje)}%` }} />
      </div>
      <p className={`mt-1 whitespace-nowrap text-xs font-medium ${texto}`}>{e.plazo.vencido ? 'Plazo vencido' : `Día ${e.plazo.diasTranscurridos} de 10`}</p>
    </div>
  );
}

/** Tabla reutilizada por las bandejas del personal; en móvil se muestra como tarjetas. */
export function TablaExpedientes({ expedientes, accion, elegido, compacto = false }: { expedientes: Expediente[]; accion: (e: Expediente) => ReactNode; elegido?: number; compacto?: boolean }) {
  const nombres = useNombres(expedientes);
  return (
    <>
      <div className="hidden overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70 md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
            <tr>{!compacto && <th className="px-4 py-3">Expediente</th>}<th className="px-4 py-3">Postulante</th>{!compacto && <th className="px-4 py-3">Categoría</th>}<th className="px-4 py-3">Etapa</th><th className="px-4 py-3">Plazo</th><th className="px-4 py-3" /></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expedientes.map((e) => {
              const p = nombres.get(e.postulanteId);
              return (
                <tr key={e.id} className={`transition ${elegido === e.id ? 'bg-marca-claro/60' : 'hover:bg-fondo'}`}>
                  {!compacto && <td className="whitespace-nowrap px-4 py-3 font-bold text-marca">{e.numero}</td>}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar nombre={p?.nombre} />
                      <div className="min-w-0"><p className="font-semibold capitalize text-slate-800">{p?.nombre.toLowerCase() ?? '…'}</p><p className="text-xs text-slate-500">DNI {p?.dni ?? ''}{compacto && ` · ${e.categoria}`}</p>{compacto && <p className="text-xs font-semibold text-marca">{e.numero}</p>}</div>
                    </div>
                  </td>
                  {!compacto && <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 font-medium text-slate-700"><Icono nombre={e.categoria === 'II-C' ? 'electric_rickshaw' : 'two_wheeler'} className="text-lg text-slate-400" />{e.categoria}</span>
                  </td>}
                  <td className="px-4 py-3"><ChipEtapa etapa={e.etapa} corto={compacto} /></td>
                  <td className={`${compacto ? 'w-28' : 'w-36'} px-4 py-3`}><Plazo e={e} /></td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">{accion(e)}</td>
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
              <div className="flex items-center justify-between gap-2"><p className="font-bold text-marca">{e.numero}</p><ChipEtapa etapa={e.etapa} /></div>
              <div className="mt-2 flex items-center gap-3">
                <Avatar nombre={p?.nombre} />
                <div><p className="font-medium capitalize">{p?.nombre.toLowerCase() ?? '…'}</p><p className="text-xs text-slate-500">DNI {p?.dni} · {e.categoria}</p></div>
              </div>
              <div className="my-3"><Plazo e={e} /></div>
              {accion(e)}
            </li>
          );
        })}
      </ul>
    </>
  );
}
