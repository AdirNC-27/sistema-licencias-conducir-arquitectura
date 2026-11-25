import { useState, type FormEvent } from 'react';
import { api } from '../../api/cliente';
import type { Audiencia, ContenidoAsistente, TemaContenido } from '../../api/tipos';
import { mensajeError, useDatos } from '../../componentes/useDatos';
import { Aviso, Cargando, Chip, Encabezado, Icono } from '../../componentes/ui';

const TEMAS: Record<TemaContenido, string> = {
  REQUISITOS: 'Requisitos',
  DOCUMENTOS: 'Documentos',
  PAGOS: 'Pagos',
  CITAS: 'Citas',
  EVALUACIONES: 'Exámenes',
  TRAMITE: 'Trámite',
};

type Formulario = Omit<ContenidoAsistente, 'id'> & { id?: number };
const AUDIENCIA: Record<Audiencia, string> = { POSTULANTE: 'Para postulantes', PERSONAL: 'Para el personal' };
const VACIO: Formulario = { tema: 'TRAMITE', audiencia: 'POSTULANTE', pregunta: '', respuesta: '', palabrasClave: '', activo: true };

/** HU25: el administrador mantiene el contenido aprobado; el asistente solo responde con esto (RF15). */
export function Contenidos() {
  const contenidos = useDatos(() => api.get<ContenidoAsistente[]>('/asistente/contenidos'));
  const [form, setForm] = useState<Formulario | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [filtro, setFiltro] = useState<Audiencia>('POSTULANTE');
  const visibles = contenidos.datos?.filter((c) => c.audiencia === filtro);

  const guardar = async (c: Formulario, texto: string) => {
    setMensaje(null);
    try {
      const { id, ...datos } = c;
      if (id) await api.put(`/asistente/contenidos/${id}`, datos);
      else await api.post('/asistente/contenidos', datos);
      setMensaje({ tipo: 'ok', texto });
      setForm(null);
      contenidos.recargar();
    } catch (e) {
      setMensaje({ tipo: 'error', texto: mensajeError(e) });
    }
  };

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (form) void guardar(form, form.id ? 'Contenido actualizado' : 'Contenido agregado');
  };

  return (
    <div className="space-y-6">
      <Encabezado
        titulo="Contenido del asistente"
        subtitulo="La IA de orientación solo responde con este contenido: a los postulantes (lo que no esté aquí se deriva al gestor) y al personal (procedimientos internos)."
        accion={<button className="btn-primario" onClick={() => setForm({ ...VACIO, audiencia: filtro })}><Icono nombre="assignment_add" className="text-lg" />Agregar</button>}
      />
      {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}

      {form && (
        <form onSubmit={enviar} className="tarjeta grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="tema" className="etiqueta">Tema</label>
            <select id="tema" className="campo" value={form.tema} onChange={(e) => setForm({ ...form, tema: e.target.value as TemaContenido })}>
              {Object.entries(TEMAS).map(([clave, nombre]) => <option key={clave} value={clave}>{nombre}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="audiencia" className="etiqueta">Responde a</label>
            <select id="audiencia" className="campo" value={form.audiencia} onChange={(e) => setForm({ ...form, audiencia: e.target.value as Audiencia })}>
              {Object.entries(AUDIENCIA).map(([clave, nombre]) => <option key={clave} value={clave}>{nombre}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="palabras" className="etiqueta">Otras formas de preguntarlo (separadas por comas)</label>
            <input id="palabras" className="campo" maxLength={300} value={form.palabrasClave} onChange={(e) => setForm({ ...form, palabrasClave: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="pregunta-contenido" className="etiqueta">Pregunta</label>
            <input id="pregunta-contenido" className="campo" maxLength={200} value={form.pregunta} onChange={(e) => setForm({ ...form, pregunta: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="respuesta-contenido" className="etiqueta">Respuesta aprobada</label>
            <textarea id="respuesta-contenido" className="campo" rows={3} maxLength={1000} value={form.respuesta} onChange={(e) => setForm({ ...form, respuesta: e.target.value })} />
          </div>
          <div className="flex gap-2 md:col-span-2">
            <button className="btn-primario" disabled={form.pregunta.trim().length < 5 || form.respuesta.trim().length < 10}>Guardar</button>
            <button type="button" className="btn-suave" onClick={() => setForm(null)}>Cancelar</button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por audiencia">
        {(Object.keys(AUDIENCIA) as Audiencia[]).map((a) => (
          <button key={a} type="button" aria-pressed={filtro === a} onClick={() => setFiltro(a)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ring-1 ${filtro === a ? 'bg-marca text-white ring-marca' : 'bg-white text-slate-600 ring-slate-200'}`}>
            {AUDIENCIA[a]} ({contenidos.datos?.filter((c) => c.audiencia === a).length ?? 0})
          </button>
        ))}
      </div>

      {contenidos.cargando ? <Cargando /> : contenidos.error ? <Aviso tipo="error">{contenidos.error}</Aviso> : (
        <ul className="space-y-3">
          {visibles?.map((c) => (
            <li key={c.id} className={`tarjeta ${c.activo ? '' : 'opacity-70'}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap gap-2">
                    <Chip color="azul">{TEMAS[c.tema]}</Chip>
                    {!c.activo && <Chip color="gris">Inactivo</Chip>}
                  </div>
                  <p className="font-semibold text-slate-800">{c.pregunta}</p>
                  <p className="mt-1 text-sm text-slate-600">{c.respuesta}</p>
                </div>
                <div className="flex gap-2">
                  <button className="btn-suave" aria-label={`Editar: ${c.pregunta}`} onClick={() => setForm({ ...c })}><Icono nombre="edit_note" className="text-lg" />Editar</button>
                  <button className={c.activo ? 'btn-peligro' : 'btn-primario'} aria-label={`${c.activo ? 'Desactivar' : 'Activar'}: ${c.pregunta}`} onClick={() => guardar({ ...c, activo: !c.activo }, c.activo ? 'Contenido desactivado' : 'Contenido activado')}>
                    {c.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
