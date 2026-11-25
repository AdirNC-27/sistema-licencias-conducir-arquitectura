import { Link } from 'react-router-dom';
import { api } from '../../api/cliente';
import type { Expediente } from '../../api/tipos';
import { TablaExpedientes } from '../../componentes/TablaExpedientes';
import { useDatos } from '../../componentes/useDatos';
import { Cargando, Encabezado, Icono, Vacio } from '../../componentes/ui';

/** RF11 y RF12: expedientes con ambos exámenes validados; el supervisor revisa cada uno antes de emitir. */
export function Emision() {
  const { datos, cargando } = useDatos(() => api.get<{ datos: Expediente[] }>('/expedientes?etapa=EMISION&tamano=50'));
  return (
    <div className="space-y-6">
      <Encabezado titulo="Autorizar emisión" subtitulo="Expedientes con ambos exámenes aprobados y validados. Revisa las verificaciones del gestor antes de emitir." />
      {cargando ? <Cargando /> : !datos?.datos.length ? <div className="tarjeta"><Vacio titulo="No hay expedientes por emitir" icono="badge" /></div> : (
        <TablaExpedientes
          expedientes={datos.datos}
          accion={(e) => <Link to={`/supervisor/expedientes/${e.id}`} className="btn-acento" aria-label={`Revisar ${e.numero}`}><Icono nombre="shield" className="text-lg" />Revisar</Link>}
        />
      )}
    </div>
  );
}
