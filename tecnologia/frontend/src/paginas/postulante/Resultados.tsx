import { api } from '../../api/cliente';
import type { Evaluacion } from '../../api/tipos';
import { useDatos } from '../../componentes/useDatos';
import { Aviso, Cargando, ChipEstado, Encabezado, Vacio } from '../../componentes/ui';
import { SinTramite } from './SinTramite';
import { useMiExpediente } from './useMiExpediente';

/** RF19: el postulante ve sus resultados validados y los intentos que le quedan. */
export function Resultados() {
  const { expediente, cargando } = useMiExpediente();
  const evaluaciones = useDatos(() => (expediente ? api.get<Evaluacion[]>(`/expedientes/${expediente.id}/evaluaciones`) : Promise.resolve([])), [expediente?.id]);
  if (cargando || evaluaciones.cargando) return <Cargando />;
  if (!expediente) return <SinTramite />;

  return (
    <div className="space-y-6">
      <Encabezado titulo="Mis resultados" subtitulo="Solo se muestran los resultados validados por el supervisor" />
      {expediente.etapa === 'EMITIDA' && <Aviso tipo="ok">¡Tu licencia fue emitida! Acércate a la Subgerencia de Tránsito para recogerla.</Aviso>}
      {!evaluaciones.datos?.length ? <div className="tarjeta"><Vacio titulo="Aún no hay resultados" texto="Aparecerán después de tu examen." icono="quiz" /></div> : (
        <div className="grid gap-6 md:grid-cols-2">
          {evaluaciones.datos.map((ev) => (
            <div key={ev.id} className="tarjeta">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-marca-oscuro">Examen de {ev.tipo === 'MANEJO' ? 'manejo' : 'conocimientos'}</h2>
                <ChipEstado estado={ev.estado} />
              </div>
              <div className="mt-4 flex gap-2">
                {[1, 2, 3].map((n) => {
                  const intento = ev.historial.find((h) => h.numero === n);
                  return (
                    <div key={n} className={`flex-1 rounded-xl p-3 text-center ${!intento ? 'bg-slate-50 text-slate-500' : intento.aprobado ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      <p className="text-xs font-semibold">Intento {n}</p>
                      <p className="text-xl font-extrabold">{intento ? intento.puntaje : '—'}</p>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-sm text-slate-600">Intentos usados: <b>{ev.intentos} de 3</b> · Te quedan {ev.intentosRestantes}</p>
              {ev.resultadoActual?.observaciones && <p className="mt-2 text-sm text-slate-500">{ev.resultadoActual.observaciones}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
