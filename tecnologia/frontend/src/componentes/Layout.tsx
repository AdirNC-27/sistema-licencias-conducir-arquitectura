import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { NOMBRE_ROL } from '../api/textos';
import type { Rol } from '../api/tipos';
import { useSesion } from '../sesion/sesion';
import { ChatLucia } from './lucia/ChatLucia';
import { Icono } from './ui';

interface Opcion {
  ruta: string;
  texto: string;
  icono: string;
  movil?: boolean; // aparece en la barra inferior del celular
}

/** Cada rol ve solo su menú (DA01). */
export const MENU: Record<Rol, Opcion[]> = {
  POSTULANTE: [
    { ruta: '/postulante', texto: 'Inicio', icono: 'home', movil: true },
    { ruta: '/postulante/documentos', texto: 'Requisitos y documentos', icono: 'description', movil: true },
    { ruta: '/postulante/pago', texto: 'Pago', icono: 'payments' },
    { ruta: '/postulante/cita', texto: 'Elegir cita', icono: 'event', movil: true },
    { ruta: '/postulante/resultados', texto: 'Mis resultados', icono: 'fact_check' },
    { ruta: '/postulante/avisos', texto: 'Avisos', icono: 'notifications', movil: true },
  ],
  GESTOR: [
    { ruta: '/gestor', texto: 'Bandeja de expedientes', icono: 'inbox' },
    { ruta: '/gestor/consultas', texto: 'Consultas del asistente', icono: 'forum' },
  ],
  EVALUADOR: [{ ruta: '/evaluador', texto: 'Exámenes por calificar', icono: 'quiz' }],
  SUPERVISOR: [
    { ruta: '/supervisor', texto: 'Resultados por validar', icono: 'verified' },
    { ruta: '/supervisor/emision', texto: 'Autorizar emisión', icono: 'badge' },
    { ruta: '/supervisor/auditoria', texto: 'Auditoría', icono: 'history' },
  ],
  ADMINISTRADOR: [
    { ruta: '/admin', texto: 'Usuarios y roles', icono: 'group' },
    { ruta: '/admin/cupos', texto: 'Días y cupos', icono: 'calendar_month' },
    { ruta: '/admin/contenidos', texto: 'Contenido del asistente', icono: 'menu_book' },
    { ruta: '/admin/auditoria', texto: 'Auditoría', icono: 'history' },
  ],
};

export function Layout() {
  const { usuario, salir } = useSesion();
  const navegar = useNavigate();
  const [abierto, setAbierto] = useState(false);
  if (!usuario) return null;
  const opciones = MENU[usuario.rol];
  const esPostulante = usuario.rol === 'POSTULANTE';
  const cerrar = () => {
    salir();
    navegar('/login');
  };
  const enlace = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${isActive ? 'bg-white/15 text-white' : 'text-blue-100 hover:bg-white/10'}`;

  return (
    <div className="min-h-screen lg:pl-64">
      {/* Menú lateral: siempre visible en laptop; en celular se abre con ☰ (personal) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-gradient-to-b from-marca-oscuro to-marca p-4 text-white transition-transform lg:translate-x-0 ${abierto ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="mb-8 flex items-center gap-3 px-1">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15">
            <Icono nombre="account_balance" />
          </div>
          <div className="leading-tight">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-200">MPH Huamanga</p>
            <p className="font-bold">Licencias Clase B</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {opciones.map((o) => (
            <NavLink key={o.ruta} to={o.ruta} end className={enlace} onClick={() => setAbierto(false)}>
              <Icono nombre={o.icono} className="text-xl" />
              {o.texto}
            </NavLink>
          ))}
        </nav>
        <div className="rounded-xl bg-white/10 p-3 text-sm">
          <p className="truncate font-semibold">{usuario.nombre}</p>
          <p className="text-xs text-blue-200">{NOMBRE_ROL[usuario.rol]}</p>
          <button onClick={cerrar} className="mt-3 flex items-center gap-2 text-xs font-semibold text-orange-200 hover:text-white">
            <Icono nombre="logout" className="text-base" /> Cerrar sesión
          </button>
        </div>
      </aside>
      {abierto && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setAbierto(false)} />}

      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        {!esPostulante && (
          <button aria-label="Abrir menú" onClick={() => setAbierto(true)} className="grid h-10 w-10 place-items-center rounded-xl bg-acento text-white">
            <Icono nombre="menu" />
          </button>
        )}
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-xs font-semibold uppercase tracking-wide text-marca">MPH Huamanga · Clase B</p>
          <p className="truncate text-sm font-bold text-marca-oscuro">{usuario.nombre}</p>
        </div>
        <button onClick={cerrar} aria-label="Cerrar sesión" className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600">
          <Icono nombre="logout" />
        </button>
      </header>

      <main className={`mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10 ${esPostulante ? 'pb-28 lg:pb-10' : ''}`}>
        <Outlet />
      </main>

      {/* Barra inferior tipo app para el postulante en celular */}
      {esPostulante && (
        <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
          {opciones.filter((o) => o.movil).map((o) => (
            <NavLink key={o.ruta} to={o.ruta} end className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${isActive ? 'text-marca' : 'text-slate-500'}`}>
              <Icono nombre={o.icono} className="text-2xl" />
              {o.texto.split(' ')[0]}
            </NavLink>
          ))}
        </nav>
      )}

      <ChatLucia />
    </div>
  );
}
