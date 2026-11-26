import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../api/cliente';
import { ETAPAS } from '../../api/textos';
import type { Expediente, ObservacionExpediente } from '../../api/tipos';
import { Pendientes } from '../../componentes/Pendientes';
import { TablaExpedientes } from '../../componentes/TablaExpedientes';
import { useDatos } from '../../componentes/useDatos';
import { Aviso, Cargando, Encabezado, Icono, Vacio } from '../../componentes/ui';

interface Pagina { total: number; pagina: number; tamano: number; datos: Expediente[] }

/** Bandeja del gestor: expedientes filtrados por etapa y categoría, paginados en el servidor. */
export function Bandeja() {
  // La etapa va en la dirección: los pendientes enlazan directo a «?etapa=PAGO», etc.
  const [parametros, setParametros] = useSearchParams();
  const etapa = parametros.get('etapa') ?? 'DOCUMENTOS';
  const setEtapa = (e: string) => setParametros({ etapa: e }, { replace: true });
  const [categoria, setCategoria] = useState('');
  const [pagina, setPagina] = useState(1);
  const consulta = new URLSearchParams({ pagina: String(pagina), tamano: '15', ...(etapa && { etapa }), ...(categoria && { categoria }) });
  const { datos, cargando, error } = useDatos(() => api.get<Pagina>(`/expedientes?${consulta}`), [etapa, categoria, pagina]);
  const paginas = datos ? Math.max(1, Math.ceil(datos.total / datos.tamano)) : 1;
  const devueltos = useDatos(() => api.get<ObservacionExpediente[]>('/observaciones/abiertas'));

  return (
    <div className="space-y-6">
      <Encabezado titulo="Bandeja de expedientes" subtitulo="Revisa documentos y pagos, y deja constancia de lo verificado en el SNC y el récord del conductor." />
      <Pendientes />
      {!!devueltos.datos?.length && (
        <div className="tarjeta ring-2 ring-amber-300">
          <h2 className="mb-2 flex items-center gap-2 font-bold text-amber-900"><Icono nombre="undo" className="text-lg" />Devueltos por el supervisor ({devueltos.datos.length})</h2>
          <ul className="divide-y divide-slate-100">
            {devueltos.datos.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div className="min-w-0">
                  <p className="font-semibold text-marca">{o.numeroExpediente}</p>
                  <p className="truncate text-sm text-slate-600">{o.motivo}</p>
                </div>
                <Link to={`/gestor/expedientes/${o.expedienteId}`} className="btn-suave">Atender <Icono nombre="chevron_right" className="text-lg" /></Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {[{ clave: '', corto: 'Todas' }, ...ETAPAS].map((e) => (
          <button key={e.clave} onClick={() => { setEtapa(e.clave); setPagina(1); }}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ring-1 ${etapa === e.clave ? 'bg-marca text-white ring-marca' : 'bg-white text-slate-600 ring-slate-200'}`}>{e.corto}</button>
        ))}
        <select aria-label="Categoría" className="campo ml-auto w-auto py-1.5" value={categoria} onChange={(e) => { setCategoria(e.target.value); setPagina(1); }}>
          <option value="">II-B y II-C</option><option value="II-B">II-B · Moto</option><option value="II-C">II-C · Mototaxi</option>
        </select>
      </div>
      {error && <Aviso tipo="error">{error}</Aviso>}
      {cargando ? <Cargando /> : !datos?.datos.length ? <div className="tarjeta"><Vacio titulo="No hay expedientes en esta etapa" /></div> : (
        <>
          <TablaExpedientes expedientes={datos.datos} accion={(e) => <Link to={`/gestor/expedientes/${e.id}`} className="btn-suave">Revisar <Icono nombre="chevron_right" className="text-lg" /></Link>} />
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>{datos.total} expedientes</span>
            <div className="flex items-center gap-2">
              <button className="btn-suave" disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>Anterior</button>
              <span>{pagina} / {paginas}</span>
              <button className="btn-suave" disabled={pagina >= paginas} onClick={() => setPagina(pagina + 1)}>Siguiente</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
