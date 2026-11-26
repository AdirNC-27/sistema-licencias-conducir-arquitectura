import { useState, type FormEvent } from 'react';
import { api } from '../../api/cliente';
import type { Evaluacion, Expediente } from '../../api/tipos';
import { TablaExpedientes } from '../../componentes/TablaExpedientes';
import { mensajeError, useDatos } from '../../componentes/useDatos';
import { Pendientes } from '../../componentes/Pendientes';
import { Aviso, Cargando, ChipEstado, Encabezado, Icono, Vacio } from '../../componentes/ui';

interface Pagina { datos: Expediente[] }
type Tipo = 'CONOCIMIENTOS' | 'MANEJO';

function Calificar({ expediente, alTerminar }: { expediente: Expediente; alTerminar: () => void }) {
  const tipo: Tipo = expediente.etapa === 'EXAMEN_MANEJO' ? 'MANEJO' : 'CONOCIMIENTOS';
  const evaluaciones = useDatos(() => api.get<Evaluacion[]>(`/expedientes/${expediente.id}/evaluaciones`), [expediente.id]);
  const actual = evaluaciones.datos?.find((e) => e.tipo === tipo);
  const corrigiendo = actual?.estado === 'REGISTRADO';
  const [f, setF] = useState({ puntaje: '', faltaEliminatoria: false, observaciones: '', motivo: '' });
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setMensaje(null);
    const cuerpo = { puntaje: Number(f.puntaje), observaciones: f.observaciones || undefined, ...(tipo === 'MANEJO' && { faltaEliminatoria: f.faltaEliminatoria }) };
    try {
      if (corrigiendo) await api.patch(`/evaluaciones/${actual!.id}/resultado`, { ...cuerpo, motivo: f.motivo });
      else await api.post(`/expedientes/${expediente.id}/evaluaciones/${tipo}/resultado`, cuerpo);
      setMensaje({ tipo: 'ok', texto: corrigiendo ? 'Resultado corregido. Queda registrado en la auditoría.' : 'Resultado registrado. Pasa al supervisor para su validación.' });
      setF({ puntaje: '', faltaEliminatoria: false, observaciones: '', motivo: '' });
      evaluaciones.recargar();
      alTerminar();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: mensajeError(err) });
    }
  };

  return (
    <div className="tarjeta space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">{expediente.numero}</p>
          <h2 className="text-lg font-bold text-marca-oscuro">Examen de {tipo === 'MANEJO' ? 'manejo' : 'conocimientos'}</h2>
        </div>
        {actual && <ChipEstado estado={actual.estado} />}
      </div>
      {actual && <p className="text-sm text-slate-600">Intentos: <b>{actual.intentos}/3</b>{actual.resultadoActual && <> · Último: {actual.resultadoActual.puntaje} ({actual.resultadoActual.aprobado ? 'aprobado' : 'desaprobado'})</>}</p>}
      {actual?.bloqueada && actual.estado !== 'VALIDADO' && <Aviso tipo="alerta">Resultado bloqueado.</Aviso>}
      <form onSubmit={enviar} className="space-y-3">
        <div>
          <label className="etiqueta" htmlFor="puntaje">Nota (0 a 20) · aprueba con 14</label>
          <input id="puntaje" type="number" min={0} max={20} className="campo" value={f.puntaje} onChange={(e) => setF({ ...f, puntaje: e.target.value })} required />
        </div>
        {tipo === 'MANEJO' && (
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.faltaEliminatoria} onChange={(e) => setF({ ...f, faltaEliminatoria: e.target.checked })} />Cometió falta eliminatoria</label>
        )}
        <div>
          <label className="etiqueta" htmlFor="obs">Observaciones</label>
          <input id="obs" className="campo" value={f.observaciones} onChange={(e) => setF({ ...f, observaciones: e.target.value })} />
        </div>
        {corrigiendo && (
          <div>
            <label className="etiqueta" htmlFor="motivo">Motivo de la corrección</label>
            <input id="motivo" className="campo" value={f.motivo} onChange={(e) => setF({ ...f, motivo: e.target.value })} required />
          </div>
        )}
        {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}
        <button className="btn-acento w-full">{corrigiendo ? 'Corregir resultado' : 'Registrar resultado'}</button>
      </form>
    </div>
  );
}

/** RF08 y RF09: el evaluador registra o corrige resultados antes de la validación. */
export function Examenes() {
  const conocimientos = useDatos(() => api.get<Pagina>('/expedientes?etapa=EXAMEN_CONOCIMIENTOS&tamano=50'));
  const manejo = useDatos(() => api.get<Pagina>('/expedientes?etapa=EXAMEN_MANEJO&tamano=50'));
  const [elegido, setElegido] = useState<Expediente | null>(null);
  const lista = [...(conocimientos.datos?.datos ?? []), ...(manejo.datos?.datos ?? [])];
  const recargar = () => { conocimientos.recargar(); manejo.recargar(); };

  return (
    <div className="space-y-6">
      <Encabezado titulo="Exámenes por calificar" subtitulo="Postulantes con cita de conocimientos o de manejo" />
      <Pendientes />
      {conocimientos.cargando || manejo.cargando ? <Cargando /> : !lista.length ? <div className="tarjeta"><Vacio titulo="No hay postulantes en examen" icono="quiz" /></div> : (
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <TablaExpedientes expedientes={lista} accion={(e) => (
              <button className={elegido?.id === e.id ? 'btn-primario' : 'btn-suave'} onClick={() => setElegido(e)}>Calificar <Icono nombre="edit_note" className="text-lg" /></button>
            )} />
          </div>
          <div>{elegido ? <Calificar key={elegido.id} expediente={elegido} alTerminar={recargar} /> : <div className="tarjeta"><Vacio titulo="Elige un postulante" texto="Selecciona “Calificar” en la lista." icono="touch_app" /></div>}</div>
        </div>
      )}
    </div>
  );
}
