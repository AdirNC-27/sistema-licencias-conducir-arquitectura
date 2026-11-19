import { useState } from 'react';
import { api } from '../../api/cliente';
import { NOMBRE_DOCUMENTO } from '../../api/textos';
import type { Documento, Requisito } from '../../api/tipos';
import { mensajeError, useDatos } from '../../componentes/useDatos';
import { Aviso, Cargando, ChipEstado, Encabezado, Icono } from '../../componentes/ui';
import { SinTramite } from './SinTramite';
import { useMiExpediente } from './useMiExpediente';

interface RespuestaRequisitos { tasa: number | null; plazoDiasHabiles: number; requisitos: Requisito[] }

function FilaDocumento({ requisito, documento, expedienteId, editable, alSubir }: {
  requisito: Requisito; documento?: Documento; expedienteId: number; editable: boolean; alSubir: () => void;
}) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [fechaEmision, setFechaEmision] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const tipo = requisito.documento!;
  const puedeSubir = editable && documento?.estado !== 'APROBADO' && documento?.estado !== 'PENDIENTE';

  const subir = async () => {
    if (!archivo) return;
    setEnviando(true);
    setError(null);
    const datos = new FormData();
    datos.append('tipo', tipo);
    if (fechaEmision) datos.append('fechaEmision', fechaEmision);
    datos.append('archivo', archivo);
    try {
      await api.post(`/expedientes/${expedienteId}/documentos`, datos);
      setArchivo(null);
      alSubir();
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <li className="py-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-marca-claro text-marca"><Icono nombre="description" /></span>
          <div>
            <p className="font-semibold text-slate-800">{NOMBRE_DOCUMENTO[tipo] ?? tipo}</p>
            <p className="text-sm text-slate-500">{requisito.descripcion}</p>
          </div>
        </div>
        {documento ? <ChipEstado estado={documento.estado} /> : <span className="text-xs font-semibold text-slate-500">Sin adjuntar</span>}
      </div>
      {documento?.estado === 'OBSERVADO' && documento.observacion && (
        <div className="mt-3"><Aviso tipo="alerta">Observación del gestor: {documento.observacion}. Vuelve a adjuntarlo.</Aviso></div>
      )}
      {puedeSubir && (
        <div className="mt-3 flex flex-col gap-3 rounded-xl bg-fondo p-3 sm:flex-row sm:items-end">
          <label className="flex-1">
            <span className="etiqueta">Archivo (PDF, JPG o PNG, máx. 2 MB)</span>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-marca file:px-3 file:py-2 file:text-white" onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} />
          </label>
          {tipo === 'CERTIFICADO_MEDICO' && (
            <label>
              <span className="etiqueta">Fecha de emisión</span>
              <input type="date" className="campo" value={fechaEmision} onChange={(e) => setFechaEmision(e.target.value)} />
            </label>
          )}
          <button className="btn-primario" disabled={!archivo || enviando || (tipo === 'CERTIFICADO_MEDICO' && !fechaEmision)} onClick={subir}>
            <Icono nombre="upload" className="text-lg" /> {enviando ? 'Subiendo…' : 'Adjuntar'}
          </button>
        </div>
      )}
      {error && <div className="mt-3"><Aviso tipo="error">{error}</Aviso></div>}
    </li>
  );
}

/** RF22 y RF03: requisitos del TUPA de la categoría y carga de documentos. */
export function Documentos() {
  const { expediente, cargando } = useMiExpediente();
  const requisitos = useDatos(
    () => (expediente ? api.get<RespuestaRequisitos>(`/requisitos?tramite=EMISION&categoria=${expediente.categoria}`) : Promise.resolve(null)),
    [expediente?.id],
  );
  const documentos = useDatos(() => (expediente ? api.get<Documento[]>(`/expedientes/${expediente.id}/documentos`) : Promise.resolve([])), [expediente?.id]);

  if (cargando || requisitos.cargando) return <Cargando />;
  if (!expediente) return <SinTramite />;
  const editable = expediente.etapa === 'DOCUMENTOS';
  const lista = requisitos.datos?.requisitos ?? [];
  const conDocumento = lista.filter((r) => r.documento);
  const sinDocumento = lista.filter((r) => !r.documento);

  return (
    <div className="space-y-6">
      <Encabezado titulo="Requisitos y documentos" subtitulo={`Licencia ${expediente.categoria} · según el TUPA de la MPH Huamanga`} />
      {!editable && <Aviso tipo="ok">Tus documentos ya fueron revisados. Continúa con la siguiente etapa desde el inicio.</Aviso>}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="tarjeta lg:col-span-2">
          <h2 className="font-bold text-marca-oscuro">Documentos para adjuntar</h2>
          {documentos.error && <Aviso tipo="error">{documentos.error}</Aviso>}
          <ul className="divide-y divide-slate-100">
            {conDocumento.map((r) => (
              <FilaDocumento key={r.orden} requisito={r} expedienteId={expediente.id} editable={editable}
                documento={documentos.datos?.filter((d) => d.tipo === r.documento).pop()} alSubir={documentos.recargar} />
            ))}
          </ul>
        </div>
        <div className="space-y-4">
          <div className="tarjeta">
            <h2 className="mb-3 font-bold text-marca-oscuro">Otros requisitos</h2>
            <ul className="space-y-2 text-sm text-slate-600">
              {sinDocumento.map((r) => (
                <li key={r.orden} className="flex gap-2"><Icono nombre="check_circle" className="text-lg text-emerald-500" />{r.descripcion}</li>
              ))}
            </ul>
          </div>
          <Aviso tipo="info">El gestor verifica tus antecedentes en los portales oficiales (SNC, SAT y Sanciones del MTC).</Aviso>
        </div>
      </div>
    </div>
  );
}
