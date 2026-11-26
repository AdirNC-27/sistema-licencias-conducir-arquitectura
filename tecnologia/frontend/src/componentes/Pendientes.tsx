import { Link } from 'react-router-dom';
import { api } from '../api/cliente';
import type { Pendiente } from '../api/tipos';
import { useDatos } from './useDatos';
import { Icono } from './ui';

/**
 * Pendientes del rol o recordatorios del postulante, al entrar a su pantalla principal.
 * Los calcula la API con los datos del sistema; aquí solo se muestran con un enlace para atenderlos.
 */
export function Pendientes({ titulo = 'Tus pendientes', vacio }: { titulo?: string; vacio?: string }) {
  const { datos } = useDatos(() => api.get<Pendiente[]>('/asistente/pendientes'));
  if (!datos) return null;
  if (datos.length === 0) {
    return vacio ? <p className="flex items-center gap-2 text-sm text-emerald-700"><Icono nombre="check_circle" className="text-lg" />{vacio}</p> : null;
  }
  return (
    <section className="tarjeta" aria-label={titulo}>
      <h2 className="mb-3 flex items-center gap-2 font-bold text-marca-oscuro"><Icono nombre="pendientes" className="text-lg" />{titulo}</h2>
      <ul className="grid gap-2 md:grid-cols-2">
        {datos.map((p) => (
          <li key={p.codigo}>
            <Link
              to={p.ruta}
              className={`flex h-full items-start gap-3 rounded-xl px-3.5 py-3 text-sm transition hover:brightness-95 ${p.urgente ? 'bg-amber-50 text-amber-900 ring-1 ring-amber-200' : 'bg-fondo text-slate-700'}`}
            >
              <Icono nombre={p.urgente ? 'alerta' : 'chevron_right'} className={`mt-0.5 shrink-0 text-base ${p.urgente ? 'text-amber-600' : 'text-marca'}`} />
              <span>{p.texto}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
