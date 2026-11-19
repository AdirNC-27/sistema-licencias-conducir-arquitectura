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

export function Encabezado({ titulo, subtitulo, accion }: { titulo: string; subtitulo?: string; accion?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="titulo">{titulo}</h1>
        {subtitulo && <p className="subtitulo">{subtitulo}</p>}
      </div>
      {accion}
    </div>
  );
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
