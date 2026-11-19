import { useState } from 'react';
import { api } from '../../api/cliente';
import type { Expediente } from '../../api/tipos';
import { TablaExpedientes } from '../../componentes/TablaExpedientes';
import { mensajeError, useDatos } from '../../componentes/useDatos';
import { Aviso, Cargando, Encabezado, Icono, Vacio } from '../../componentes/ui';

/** RF12: el supervisor autoriza la emisión de los expedientes conformes. */
export function Emision() {
  const { datos, cargando, recargar } = useDatos(() => api.get<{ datos: Expediente[] }>('/expedientes?etapa=EMISION&tamano=50'));
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const autorizar = async (e: Expediente) => {
    setMensaje(null);
    try {
      await api.patch(`/expedientes/${e.id}/emision`);
      setMensaje({ tipo: 'ok', texto: `Emisión autorizada para ${e.numero}. Se notificó al postulante.` });
      recargar();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: mensajeError(err) });
    }
  };
  return (
    <div className="space-y-6">
      <Encabezado titulo="Autorizar emisión" subtitulo="Expedientes con ambos exámenes aprobados y validados" />
      {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}
      {cargando ? <Cargando /> : !datos?.datos.length ? <div className="tarjeta"><Vacio titulo="No hay expedientes por emitir" icono="badge" /></div> : (
        <TablaExpedientes expedientes={datos.datos} accion={(e) => <button className="btn-acento" onClick={() => autorizar(e)}><Icono nombre="verified" className="text-lg" />Autorizar</button>} />
      )}
    </div>
  );
}
