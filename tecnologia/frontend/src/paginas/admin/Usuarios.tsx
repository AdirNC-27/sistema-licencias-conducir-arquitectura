import { useState } from 'react';
import { api } from '../../api/cliente';
import { NOMBRE_ROL } from '../../api/textos';
import type { Rol } from '../../api/tipos';
import { mensajeError, useDatos } from '../../componentes/useDatos';
import { Aviso, Cargando, Chip, Encabezado } from '../../componentes/ui';

interface Cuenta { id: number; usuario: string; nombre: string; rol: Rol; activo: boolean }
const ROLES_PERSONAL: Rol[] = ['GESTOR', 'EVALUADOR', 'SUPERVISOR', 'ADMINISTRADOR'];

/** RF16: el administrador asigna roles al personal (auditable). */
export function Usuarios() {
  const { datos, cargando, recargar } = useDatos(() => api.get<Cuenta[]>('/usuarios'));
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
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
      <Encabezado titulo="Usuarios y roles" subtitulo="Cada cambio de rol queda en la auditoría" />
      {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}
      {cargando ? <Cargando /> : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Usuario</th><th className="px-4 py-3">Nombre</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Rol</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {datos?.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-semibold">{c.usuario}</td>
                  <td className="px-4 py-3 capitalize">{c.nombre.toLowerCase()}</td>
                  <td className="px-4 py-3"><Chip color={c.activo ? 'verde' : 'gris'}>{c.activo ? 'Activo' : 'Inactivo'}</Chip></td>
                  <td className="px-4 py-3">
                    {c.rol === 'POSTULANTE' ? <span className="text-slate-500">Postulante</span> : (
                      <select aria-label={`Rol de ${c.usuario}`} className="campo w-auto py-1.5" value={c.rol} onChange={(e) => cambiar(c, e.target.value as Rol)}>
                        {ROLES_PERSONAL.map((r) => <option key={r} value={r}>{NOMBRE_ROL[r]}</option>)}
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
