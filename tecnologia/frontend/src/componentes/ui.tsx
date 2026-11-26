import type { ReactNode } from 'react';
import { ICONOS } from './iconos';

const COLORES: Record<string, string> = {
  verde: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  ambar: 'bg-amber-50 text-amber-700 ring-amber-200',
  rojo: 'bg-red-50 text-red-700 ring-red-200',
  azul: 'bg-blue-50 text-marca ring-blue-200',
  gris: 'bg-slate-100 text-slate-600 ring-slate-200',
  naranja: 'bg-acento-claro text-orange-700 ring-orange-200',
};

const COLOR_ESTADO: Record<string, string> = {
  APROBADO: 'verde', VERIFICADO: 'verde', VALIDADO: 'verde', EMITIDA: 'verde',
  PENDIENTE: 'ambar', REGISTRADO: 'azul',
  OBSERVADO: 'rojo', RECHAZADO: 'rojo', AGOTADO: 'rojo',
};

export function Chip({ children, color = 'gris' }: { children: ReactNode; color?: string }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${COLORES[color]}`}>{children}</span>;
}

export const ChipEstado = ({ estado }: { estado: string }) => <Chip color={COLOR_ESTADO[estado] ?? 'gris'}>{estado.charAt(0) + estado.slice(1).toLowerCase()}</Chip>;

/** Ícono SVG del tamaño del texto: se escala con las clases text-xl, text-2xl, etc. */
export function Icono({ nombre, className = '' }: { nombre: string; className?: string }) {
  const Svg = ICONOS[nombre] ?? ICONOS.check_circle;
  return <Svg width="1em" height="1em" aria-hidden className={`inline-block shrink-0 ${className}`} />;
}

/** Ícono en un recuadro de color: encabezados, indicadores y tarjetas. */
export function Mosaico({ icono, color = 'azul', className = 'h-12 w-12 text-2xl' }: { icono: string; color?: ColorMosaico; className?: string }) {
  return <span className={`grid shrink-0 place-items-center rounded-2xl ${MOSAICOS[color]} ${className}`}><Icono nombre={icono} /></span>;
}

export type ColorMosaico = keyof typeof MOSAICOS;
const MOSAICOS = {
  azul: 'bg-gradient-to-br from-blue-500 to-marca-oscuro text-white shadow-md shadow-blue-200',
  verde: 'bg-emerald-100 text-emerald-700',
  ambar: 'bg-amber-100 text-amber-700',
  rojo: 'bg-red-100 text-red-600',
  violeta: 'bg-violet-100 text-violet-700',
  naranja: 'bg-acento-claro text-acento-fuerte',
  celeste: 'bg-marca-claro text-marca',
  gris: 'bg-slate-100 text-slate-500',
};

export function Encabezado({ titulo, subtitulo, accion, icono }: { titulo: string; subtitulo?: string; accion?: ReactNode; icono?: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-4">
        {icono && <Mosaico icono={icono} className="h-14 w-14 text-[1.7rem]" />}
        <div className="min-w-0">
          <h1 className="titulo">{titulo}</h1>
          {subtitulo && <p className="subtitulo">{subtitulo}</p>}
        </div>
      </div>
      {accion}
    </div>
  );
}

/** Indicador grande: número, etiqueta e ícono (estadísticas de cada pantalla). */
export function Indicador({ valor, etiqueta, icono, color = 'celeste' }: { valor: ReactNode; etiqueta: string; icono: string; color?: ColorMosaico }) {
  return (
    <div className="tarjeta flex items-center gap-4 p-4">
      <Mosaico icono={icono} color={color} />
      <div className="min-w-0">
        <p className="text-2xl font-extrabold leading-none text-marca-oscuro">{valor}</p>
        <p className="mt-1 text-sm text-slate-500">{etiqueta}</p>
      </div>
    </div>
  );
}

/** Pestañas de filtro con contador. */
export function Pestanas<T extends string>({ opciones, valor, alCambiar }: { opciones: { clave: T; nombre: string; cantidad?: number }[]; valor: T; alCambiar: (v: T) => void }) {
  return (
    <div role="tablist" className="flex flex-wrap gap-1 rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-slate-200/70">
      {opciones.map((o) => {
        const activa = o.clave === valor;
        return (
          <button key={o.clave} role="tab" aria-selected={activa} onClick={() => alCambiar(o.clave)}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${activa ? 'bg-marca text-white shadow' : 'text-slate-600 hover:bg-fondo'}`}>
            {o.nombre}
            {o.cantidad !== undefined && <span className={`rounded-full px-2 py-0.5 text-xs ${activa ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>{o.cantidad}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Círculo con las iniciales de una persona. */
export function Avatar({ nombre, className = 'h-9 w-9 text-xs' }: { nombre?: string; className?: string }) {
  const iniciales = (nombre ?? '').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  return <span aria-hidden className={`grid shrink-0 place-items-center rounded-full bg-marca-claro font-bold text-marca ring-2 ring-white ${className}`}>{iniciales || <Icono nombre="person" />}</span>;
}

export function Aviso({ tipo = 'info', children }: { tipo?: 'info' | 'error' | 'ok' | 'alerta'; children: ReactNode }) {
  const estilos = {
    info: 'bg-blue-50 text-marca-oscuro ring-blue-200',
    error: 'bg-red-50 text-red-800 ring-red-200',
    ok: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    alerta: 'bg-amber-50 text-amber-900 ring-amber-200',
  }[tipo];
  return <div role={tipo === 'error' ? 'alert' : 'status'} className={`rounded-xl px-4 py-3 text-sm ring-1 ${estilos}`}>{children}</div>;
}

export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <div className="flex items-center gap-3 py-10 text-sm text-slate-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-marca border-t-transparent" />
      {texto}
    </div>
  );
}

export function Vacio({ titulo, texto, icono = 'inbox' }: { titulo: string; texto?: string; icono?: string }) {
  return (
    <div className="tarjeta flex flex-col items-center py-12 text-center">
      <Icono nombre={icono} className="mb-3 text-5xl text-slate-300" />
      <p className="font-semibold text-slate-700">{titulo}</p>
      {texto && <p className="mt-1 max-w-sm text-sm text-slate-500">{texto}</p>}
    </div>
  );
}

export function Barra({ porcentaje, color = 'bg-marca' }: { porcentaje: number; color?: string }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.min(100, Math.max(0, porcentaje))}%` }} />
    </div>
  );
}
