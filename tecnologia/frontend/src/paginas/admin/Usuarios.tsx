import { useState } from 'react';
import { api } from '../../api/cliente';
import { NOMBRE_ROL } from '../../api/textos';
import type { Rol } from '../../api/tipos';
import { mensajeError, useDatos } from '../../componentes/useDatos';
import { Pendientes } from '../../componentes/Pendientes';
import { Aviso, Avatar, Cargando, Chip, Encabezado, Icono, Indicador, Pestanas } from '../../componentes/ui';

interface Cuenta { id: number; usuario: string; nombre: string; rol: Rol; activo: boolean }
const ROLES_PERSONAL: Rol[] = ['GESTOR', 'EVALUADOR', 'SUPERVISOR', 'ADMINISTRADOR'];
const ICONO_ROL: Record<Rol, string> = { POSTULANTE: 'person', GESTOR: 'inbox', EVALUADOR: 'quiz', SUPERVISOR: 'verified', ADMINISTRADOR: 'roles' };
type Filtro = 'TODOS' | 'PERSONAL' | 'POSTULANTE';

/** RF16: el administrador asigna roles al personal (auditable). */
export function Usuarios() {
  const { datos, cargando, recargar } = useDatos(() => api.get<Cuenta[]>('/usuarios'));
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [buscar, setBuscar] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('TODOS');
  const todas = datos ?? [];
  const personal = todas.filter((c) => c.rol !== 'POSTULANTE');
  const texto = buscar.trim().toLowerCase();
  const visibles = todas
    .filter((c) => filtro === 'TODOS' || (filtro === 'POSTULANTE' ? c.rol === 'POSTULANTE' : c.rol !== 'POSTULANTE'))
    .filter((c) => !texto || c.usuario.toLowerCase().includes(texto) || c.nombre.toLowerCase().includes(texto));
  const cambiar = async (c: Cuenta, rol: Rol) => {
    setMensaje(null);
    try {
      await api.patch(`/usuarios/${c.id}/rol`, { rol });
      setMensaje({ tipo: 'ok', texto: `${c.usuario} ahora es ${NOMBRE_ROL[rol]}.` });
      recargar();
    } catch (e) {
      setMensaje({ tipo: 'error', texto: mensajeError(e) });
    }
  };
  return (
    <div className="space-y-6">
      <Encabezado icono="group" titulo="Usuarios y roles" subtitulo="Cada cambio de rol queda en la auditoría" />
      {datos && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Indicador valor={todas.length} etiqueta="Usuarios registrados" icono="group" />
          <Indicador valor={personal.length} etiqueta="Personal municipal" icono="roles" color="violeta" />
          <Indicador valor={todas.filter((c) => c.activo).length} etiqueta="Activos" icono="user_check" color="verde" />
          <Indicador valor={todas.filter((c) => !c.activo).length} etiqueta="Inactivos" icono="user_x" color="gris" />
        </div>
      )}
      <Pendientes />
      {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}
      {cargando ? <Cargando /> : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Pestanas<Filtro>
              opciones={[
                { clave: 'TODOS', nombre: 'Todos', cantidad: todas.length },
                { clave: 'PERSONAL', nombre: 'Personal', cantidad: personal.length },
                { clave: 'POSTULANTE', nombre: 'Postulantes', cantidad: todas.length - personal.length },
              ]}
              valor={filtro}
              alCambiar={setFiltro}
            />
            <label className="relative ml-auto w-full sm:w-72">
              <span className="sr-only">Buscar usuario</span>
              <Icono nombre="search" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-slate-400" />
              <input type="search" className="campo pl-10" placeholder="Buscar por nombre o usuario" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
            </label>
          </div>
          <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Nombre</th><th className="px-4 py-3">Usuario</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Rol</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {visibles.map((c) => (
                  <tr key={c.id} className="hover:bg-fondo">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3"><Avatar nombre={c.nombre} /><span className="font-semibold capitalize text-slate-800">{c.nombre.toLowerCase()}</span></div>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">{c.usuario}</td>
                    <td className="px-4 py-3"><Chip color={c.activo ? 'verde' : 'gris'}><span className={`h-1.5 w-1.5 rounded-full ${c.activo ? 'bg-emerald-500' : 'bg-slate-400'}`} />{c.activo ? 'Activo' : 'Inactivo'}</Chip></td>
                    <td className="px-4 py-3">
                      {c.rol === 'POSTULANTE' ? <span className="inline-flex items-center gap-1.5 text-slate-500"><Icono nombre="person" />Postulante</span> : (
                        <div className="flex items-center gap-2">
                          <Icono nombre={ICONO_ROL[c.rol]} className="text-lg text-marca" />
                          <select aria-label={`Rol de ${c.usuario}`} className="campo w-auto py-1.5" value={c.rol} onChange={(e) => cambiar(c, e.target.value as Rol)}>
                            {ROLES_PERSONAL.map((r) => <option key={r} value={r}>{NOMBRE_ROL[r]}</option>)}
                          </select>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {!visibles.length && <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-500">No hay usuarios que coincidan con la búsqueda.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
