import { useState, type FormEvent } from 'react';
import { api } from '../../api/cliente';
import type { Evaluacion, Expediente } from '../../api/tipos';
import { TablaExpedientes } from '../../componentes/TablaExpedientes';
import { mensajeError, useDatos } from '../../componentes/useDatos';
import { Pendientes } from '../../componentes/Pendientes';
import { Aviso, Cargando, ChipEstado, Encabezado, Icono, Mosaico, Pestanas, Vacio } from '../../componentes/ui';

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
      <div className="flex items-center justify-between gap-3">
        <Mosaico icono={tipo === 'MANEJO' ? 'two_wheeler' : 'quiz'} color={tipo === 'MANEJO' ? 'naranja' : 'violeta'} />
        <div className="min-w-0 flex-1">
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

/** Ilustración del panel derecho mientras no se elige a nadie. */
function Ilustracion() {
  return (
    <svg viewBox="0 0 200 150" className="mx-auto h-36 w-auto" aria-hidden>
      <ellipse cx="100" cy="138" rx="78" ry="8" fill="#E8EFFF" />
      <rect x="52" y="22" width="96" height="112" rx="12" fill="#FFFFFF" stroke="#C7D7FE" strokeWidth="3" />
      <rect x="78" y="14" width="44" height="18" rx="6" fill="#1E4FD8" />
      <rect x="66" y="50" width="12" height="12" rx="3" fill="#D1FAE5" /><path d="M69 56 l3 3 l5 -6" stroke="#059669" strokeWidth="2" fill="none" strokeLinecap="round" />
      <rect x="84" y="53" width="48" height="6" rx="3" fill="#E2E8F0" />
      <rect x="66" y="72" width="12" height="12" rx="3" fill="#D1FAE5" /><path d="M69 78 l3 3 l5 -6" stroke="#059669" strokeWidth="2" fill="none" strokeLinecap="round" />
      <rect x="84" y="75" width="40" height="6" rx="3" fill="#E2E8F0" />
      <rect x="66" y="94" width="12" height="12" rx="3" fill="#FFF1E4" />
      <rect x="84" y="97" width="44" height="6" rx="3" fill="#E2E8F0" />
      <g transform="rotate(35 150 92)"><rect x="144" y="52" width="12" height="62" rx="3" fill="#FF7A00" /><path d="M144 114 l6 12 l6 -12z" fill="#FDE68A" /><rect x="144" y="52" width="12" height="9" rx="3" fill="#CC4E00" /></g>
      <circle cx="32" cy="40" r="5" fill="#C7D7FE" /><circle cx="172" cy="30" r="4" fill="#FED7AA" /><circle cx="24" cy="100" r="3" fill="#FED7AA" />
    </svg>
  );
}

type Filtro = 'TODOS' | Tipo;

/** RF08 y RF09: el evaluador registra o corrige resultados antes de la validación. */
export function Examenes() {
  const conocimientos = useDatos(() => api.get<Pagina>('/expedientes?etapa=EXAMEN_CONOCIMIENTOS&tamano=50'));
  const manejo = useDatos(() => api.get<Pagina>('/expedientes?etapa=EXAMEN_MANEJO&tamano=50'));
  const [elegido, setElegido] = useState<Expediente | null>(null);
  const [filtro, setFiltro] = useState<Filtro>('TODOS');
  const deConocimientos = conocimientos.datos?.datos ?? [];
  const deManejo = manejo.datos?.datos ?? [];
  const lista = filtro === 'CONOCIMIENTOS' ? deConocimientos : filtro === 'MANEJO' ? deManejo : [...deConocimientos, ...deManejo];
  const recargar = () => { conocimientos.recargar(); manejo.recargar(); };

  return (
    <div className="space-y-6">
      <Encabezado icono="quiz" titulo="Exámenes por calificar" subtitulo="Postulantes con cita de conocimientos o de manejo" />
      <Pendientes />
      {conocimientos.cargando || manejo.cargando ? <Cargando /> : !deConocimientos.length && !deManejo.length ? <Vacio titulo="No hay postulantes en examen" texto="Cuando un postulante reserve su cita aparecerá aquí." icono="quiz" /> : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-4">
            <Pestanas<Filtro>
              opciones={[
                { clave: 'TODOS', nombre: 'Todos', cantidad: deConocimientos.length + deManejo.length },
                { clave: 'CONOCIMIENTOS', nombre: 'Conocimientos', cantidad: deConocimientos.length },
                { clave: 'MANEJO', nombre: 'Manejo', cantidad: deManejo.length },
              ]}
              valor={filtro}
              alCambiar={setFiltro}
            />
            {lista.length ? (
              <TablaExpedientes compacto expedientes={lista} elegido={elegido?.id} accion={(e) => (
                <button className={elegido?.id === e.id ? 'btn-primario' : 'btn-suave'} onClick={() => setElegido(e)}>Calificar <Icono nombre="edit_note" className="text-lg" /></button>
              )} />
            ) : <Vacio titulo="Nadie en este examen" icono="quiz" />}
          </div>
          <div className="xl:sticky xl:top-6 xl:self-start">
            {elegido ? <Calificar key={elegido.id} expediente={elegido} alTerminar={recargar} /> : (
              <div className="tarjeta py-10 text-center">
                <Ilustracion />
                <p className="mt-4 text-lg font-bold text-marca-oscuro">Elige un postulante</p>
                <p className="mx-auto mt-1 max-w-xs text-sm text-slate-500">Pulsa «Calificar» en la lista para registrar su nota. El supervisor la valida después.</p>
                <ul className="mx-auto mt-5 max-w-xs space-y-2 text-left text-sm text-slate-600">
                  <li className="flex items-center gap-2"><Icono nombre="check_circle" className="text-emerald-600" />Aprueba con 14 de 20</li>
                  <li className="flex items-center gap-2"><Icono nombre="check_circle" className="text-emerald-600" />Hasta 3 intentos por examen</li>
                  <li className="flex items-center gap-2"><Icono nombre="lock" className="text-marca" />Validado, ya no se puede corregir</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
