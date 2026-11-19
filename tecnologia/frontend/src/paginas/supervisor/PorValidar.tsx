import { useState } from 'react';
import { api } from '../../api/cliente';
import type { Evaluacion } from '../../api/tipos';
import { mensajeError, useDatos } from '../../componentes/useDatos';
import { Aviso, Cargando, Chip, Encabezado, Icono, Vacio } from '../../componentes/ui';

/** RF09 y DA04: al validar, el resultado queda bloqueado y el expediente avanza si aprobó. */
export function PorValidar() {
  const { datos, cargando, recargar } = useDatos(() => api.get<Evaluacion[]>('/evaluaciones/por-validar'));
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const validar = async (ev: Evaluacion) => {
    setMensaje(null);
    try {
      await api.post(`/evaluaciones/${ev.id}/validacion`);
      setMensaje({ tipo: 'ok', texto: 'Resultado validado y bloqueado. Ya no puede modificarse.' });
      recargar();
    } catch (e) {
      setMensaje({ tipo: 'error', texto: mensajeError(e) });
    }
  };

  return (
    <div className="space-y-6">
      <Encabezado titulo="Resultados por validar" subtitulo="Una vez validado, el resultado no se puede modificar" />
      {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}
      {cargando ? <Cargando /> : !datos?.length ? <div className="tarjeta"><Vacio titulo="No hay resultados pendientes" icono="task_alt" /></div> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {datos.map((ev) => (
            <div key={ev.id} className="tarjeta">
              <div className="flex items-center justify-between">
                <Chip color="azul">{ev.tipo === 'MANEJO' ? 'Manejo' : 'Conocimientos'}</Chip>
                <span className="text-xs text-slate-500">Expediente #{ev.expedienteId}</span>
              </div>
              <p className={`mt-4 text-4xl font-extrabold ${ev.resultadoActual?.aprobado ? 'text-emerald-700' : 'text-red-600'}`}>{ev.resultadoActual?.puntaje}<span className="text-lg text-slate-500">/20</span></p>
              <p className="text-sm font-semibold">{ev.resultadoActual?.aprobado ? 'Aprobado' : 'Desaprobado'} · intento {ev.intentos} de 3</p>
              {ev.resultadoActual?.observaciones && <p className="mt-1 text-sm text-slate-500">{ev.resultadoActual.observaciones}</p>}
              <button className="btn-primario mt-4 w-full" onClick={() => validar(ev)}><Icono nombre="lock" className="text-lg" />Validar y bloquear</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
