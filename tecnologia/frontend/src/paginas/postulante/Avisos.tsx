import { api } from '../../api/cliente';
import { fechaHora } from '../../api/textos';
import { useDatos } from '../../componentes/useDatos';
import { Cargando, Chip, Encabezado, Icono, Vacio } from '../../componentes/ui';

interface Aviso { id: number; asunto: string; texto: string; enviadoPorCorreo: boolean; creadoEn: string }

/** RF13: avisos de cambio de etapa y recordatorios de cita. */
export function Avisos() {
  const { datos, cargando } = useDatos(() => api.get<Aviso[]>('/notificaciones/mias'));
  return (
    <div className="space-y-6">
      <Encabezado icono="notifications" titulo="Avisos" subtitulo="También te llegan a tu correo" />
      {cargando ? <Cargando /> : !datos?.length ? <div className="tarjeta"><Vacio titulo="Sin avisos todavía" icono="notifications" /></div> : (
        <ul className="space-y-3">
          {datos.map((a) => (
            <li key={a.id} className="tarjeta flex gap-4 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-acento-claro text-acento"><Icono nombre="notifications" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-800">{a.asunto}</p>
                  <span className="text-xs text-slate-500">{fechaHora(a.creadoEn)}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{a.texto}</p>
                {a.enviadoPorCorreo && <div className="mt-2"><Chip color="verde"><Icono nombre="mail" className="text-sm" />Enviado por correo</Chip></div>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
