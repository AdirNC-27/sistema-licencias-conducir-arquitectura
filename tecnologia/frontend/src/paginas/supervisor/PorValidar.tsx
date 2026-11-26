import { useState } from 'react';
import { api } from '../../api/cliente';
import type { Evaluacion } from '../../api/tipos';
import { mensajeError, useDatos } from '../../componentes/useDatos';
import { Pendientes } from '../../componentes/Pendientes';
import { Aviso, Cargando, Chip, Encabezado, Icono, Indicador, Mosaico, Vacio } from '../../componentes/ui';

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
      <Encabezado icono="fact_check" titulo="Resultados por validar" subtitulo="Una vez validado, el resultado no se puede modificar" />
      {!!datos?.length && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Indicador valor={datos.length} etiqueta="Por validar" icono="fact_check" />
          <Indicador valor={datos.filter((d) => d.resultadoActual?.aprobado).length} etiqueta="Aprobados" icono="check_circle" color="verde" />
          <Indicador valor={datos.filter((d) => !d.resultadoActual?.aprobado).length} etiqueta="Desaprobados" icono="cancel" color="rojo" />
        </div>
      )}
      <Pendientes />
      {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}
      {cargando ? <Cargando /> : !datos?.length ? <Vacio titulo="No hay resultados pendientes" texto="Cuando el evaluador registre una nota aparecerá aquí." icono="task_alt" /> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {datos.map((ev) => {
            const manejo = ev.tipo === 'MANEJO';
            const aprobado = !!ev.resultadoActual?.aprobado;
            return (
              <div key={ev.id} className="tarjeta flex flex-col">
                <div className="flex items-center gap-3">
                  <Mosaico icono={manejo ? 'two_wheeler' : 'quiz'} color={manejo ? 'naranja' : 'violeta'} className="h-11 w-11 text-xl" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-marca-oscuro">Examen de {manejo ? 'manejo' : 'conocimientos'}</p>
                    <p className="text-xs text-slate-500">Expediente #{ev.expedienteId} · intento {ev.intentos} de 3</p>
                  </div>
                </div>
                <div className={`mt-4 flex items-center justify-between rounded-2xl px-4 py-3 ${aprobado ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  <p className={`text-4xl font-extrabold ${aprobado ? 'text-emerald-700' : 'text-red-600'}`}>{ev.resultadoActual?.puntaje}<span className="text-lg font-bold text-slate-400">/20</span></p>
                  <Chip color={aprobado ? 'verde' : 'rojo'}><Icono nombre={aprobado ? 'check_circle' : 'cancel'} />{aprobado ? 'Aprobado' : 'Desaprobado'}</Chip>
                </div>
                {ev.resultadoActual?.observaciones && <p className="mt-3 text-sm text-slate-600">«{ev.resultadoActual.observaciones}»</p>}
                <button className="btn-primario mt-4 w-full" onClick={() => validar(ev)}><Icono nombre="lock" className="text-lg" />Validar y bloquear</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
