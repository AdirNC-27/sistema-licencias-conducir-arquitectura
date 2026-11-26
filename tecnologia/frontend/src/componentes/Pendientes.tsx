import { Link } from 'react-router-dom';
import { api } from '../api/cliente';
import type { Pendiente } from '../api/tipos';
import { useDatos } from './useDatos';
import { Icono, Mosaico, type ColorMosaico } from './ui';

type Color = ColorMosaico;

/** Ícono y color de cada pendiente según su código (los textos y cantidades los calcula la API). */
const ESTILO: Record<string, [string, Color]> = {
  OBSERVACIONES: ['undo', 'ambar'], DOCUMENTOS: ['description', 'celeste'], PAGOS: ['payments', 'verde'],
  VERIFICACIONES: ['shield', 'violeta'], LICENCIAS: ['badge', 'naranja'], CONSULTAS: ['chats', 'violeta'],
  PLAZO_VENCIDO: ['hourglass', 'rojo'], PLAZO_POR_VENCER: ['clock', 'ambar'],
  SIN_RESULTADO: ['edit_note', 'ambar'], CITAS_HOY: ['event_available', 'celeste'], CITAS_PROXIMAS: ['calendar_month', 'verde'],
  EN_VALIDACION: ['hourglass', 'violeta'], POR_VALIDAR: ['fact_check', 'celeste'], LISTOS: ['verified', 'verde'],
  NO_CONFORME: ['cancel', 'rojo'], OBSERVADOS: ['undo', 'ambar'], CONSULTAS_ATRASADAS: ['clock', 'rojo'], CONTENIDO: ['menu_book', 'violeta'],
};
const estilo = (codigo: string): [string, Color] => ESTILO[codigo] ?? (codigo.includes('CUPOS') ? ['event_busy', 'rojo'] : ['pendientes', 'celeste']);

/** «3 expedientes con documentos por revisar: EXP-1…» → número, etiqueta y detalle. */
function partes(p: Pendiente) {
  const [principal, ...resto] = p.texto.split(': ');
  const conNumero = principal.match(/^(\d+)\s+(.*)$/);
  return { numero: conNumero ? conNumero[1] : null, etiqueta: conNumero ? conNumero[2] : principal, detalle: resto.join(': ') };
}

/**
 * Pendientes del rol o recordatorios del postulante, al entrar a su pantalla principal.
 * Al personal se le muestran como indicadores (número grande); al postulante, como lista.
 */
export function Pendientes({ titulo = 'Tus pendientes', vacio, lista = false }: { titulo?: string; vacio?: string; lista?: boolean }) {
  const { datos } = useDatos(() => api.get<Pendiente[]>('/asistente/pendientes'));
  if (!datos) return null;
  if (datos.length === 0) {
    return vacio ? <p className="flex items-center gap-2 text-sm text-emerald-700"><Icono nombre="check_circle" className="text-lg" />{vacio}</p> : null;
  }
  if (lista) {
    return (
      <section className="tarjeta" aria-label={titulo}>
        <h2 className="mb-3 flex items-center gap-2 font-bold text-marca-oscuro"><Icono nombre="pendientes" className="text-lg" />{titulo}</h2>
        <ul className="grid gap-2 md:grid-cols-2">
          {datos.map((p) => (
            <li key={p.codigo}>
              <Link to={p.ruta} className={`flex h-full items-start gap-3 rounded-xl px-3.5 py-3 text-sm transition hover:brightness-95 ${p.urgente ? 'bg-amber-50 text-amber-900 ring-1 ring-amber-200' : 'bg-fondo text-slate-700'}`}>
                <Icono nombre={p.urgente ? 'alerta' : 'chevron_right'} className={`mt-0.5 shrink-0 text-base ${p.urgente ? 'text-amber-600' : 'text-marca'}`} />
                <span>{p.texto}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    );
  }
  return (
    <section aria-label={titulo}>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500"><Icono nombre="pendientes" className="text-base" />{titulo}</h2>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3">
        {datos.map((p) => {
          const { numero, etiqueta, detalle } = partes(p);
          const [icono, color] = estilo(p.codigo);
          return (
            <li key={p.codigo}>
              <Link to={p.ruta} title={p.texto}
                className={`group relative flex h-full items-center gap-3.5 rounded-2xl bg-white/95 p-4 shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow-md ${p.urgente ? 'ring-amber-300' : 'ring-slate-200/70'}`}>
                <Mosaico icono={icono} color={color} className="h-12 w-12 text-xl" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    {numero && <span className="text-2xl font-extrabold leading-none text-marca-oscuro">{numero}</span>}
                    {p.urgente && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-800"><Icono nombre="alerta" />Urgente</span>}
                  </div>
                  <p className="mt-1 line-clamp-3 text-[13px] leading-snug text-slate-600 first-letter:uppercase">{etiqueta}</p>
                  {detalle && <p className="mt-0.5 truncate text-xs text-slate-400">{detalle}</p>}
                </div>
                <Icono nombre="chevron_right" className="text-lg text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-marca" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
