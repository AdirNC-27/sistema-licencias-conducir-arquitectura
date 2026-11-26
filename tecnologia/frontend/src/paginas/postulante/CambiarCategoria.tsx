import { useEffect, useRef, useState } from 'react';
import { api } from '../../api/cliente';
import type { Categoria, Expediente } from '../../api/tipos';
import { mensajeError } from '../../componentes/useDatos';
import { Aviso, Icono } from '../../componentes/ui';
import { CATEGORIAS } from './categorias';

/**
 * El postulante corrige la categoría elegida por error (II-B ↔ II-C). Solo se ofrece en la etapa
 * de documentos: después ya hay pago y la tasa depende de la categoría. El cambio queda en la auditoría.
 */
export function CambiarCategoria({ expediente, alCambiar, compacto = false }: { expediente: Expediente; alCambiar: () => void; compacto?: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const otra: Categoria = expediente.categoria === 'II-C' ? 'II-B' : 'II-C';
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto]);

  if (expediente.etapa !== 'DOCUMENTOS') return null;
  const destino = CATEGORIAS.find((x) => x.c === otra)!;

  const confirmar = async () => {
    setEnviando(true);
    setError(null);
    try {
      await api.patch(`/expedientes/${expediente.id}/categoria`, { categoria: otra, motivo: motivo.trim() });
      setAbierto(false);
      setMotivo('');
      alCambiar();
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <button type="button" className={compacto ? 'btn-suave' : 'inline-flex items-center gap-1.5 text-sm font-semibold text-marca hover:underline'} onClick={() => setAbierto(true)}>
        <Icono nombre="swap" className="text-base" />
        ¿Te equivocaste? Cambiar a {destino.t.toLowerCase()} ({otra})
      </button>
      <dialog
        ref={dialogo}
        onClose={() => setAbierto(false)}
        aria-labelledby="t-cambiar-categoria"
        className="w-[min(32rem,calc(100vw-2rem))] rounded-3xl p-0 shadow-2xl backdrop:bg-slate-900/50"
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 id="t-cambiar-categoria" className="text-lg font-extrabold text-marca-oscuro">Cambiar la categoría de tu trámite</h2>
            <button type="button" aria-label="Cerrar" className="grid h-8 w-8 place-items-center rounded-full hover:bg-slate-100" onClick={() => setAbierto(false)}>
              <Icono nombre="close" />
            </button>
          </div>
          <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            {[CATEGORIAS.find((x) => x.c === expediente.categoria)!, destino].map((x, i) => (
              <div key={x.c} className={`flex flex-col items-center rounded-2xl p-3 text-center ring-2 ${i === 1 ? 'bg-marca-claro/60 ring-marca' : 'bg-white ring-slate-200'}`} style={{ order: i * 2 }}>
                <img src={x.imagen} alt={x.alt} className="h-16 w-24 object-contain" />
                <p className="mt-1 font-bold text-marca-oscuro">{x.t} · {x.c}</p>
                <p className="text-xs text-slate-500">{i === 0 ? 'Actual' : 'Nueva'} · {x.tasa}</p>
              </div>
            ))}
            <Icono nombre="arrow_forward" className="order-1 text-2xl text-marca" />
          </div>
          <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
            <li className="flex gap-2"><Icono nombre="check_circle" className="mt-0.5 shrink-0 text-emerald-600" />Tu número de expediente y los documentos que ya adjuntaste se conservan.</li>
            <li className="flex gap-2"><Icono nombre="info" className="mt-0.5 shrink-0 text-marca" />
              {otra === 'II-C' ? 'Para mototaxi se pide además la constancia COFIPRO.' : 'Para moto lineal ya no necesitas la constancia COFIPRO.'} La tasa pasa a {destino.tasa}.
            </li>
            <li className="flex gap-2"><Icono nombre="lock" className="mt-0.5 shrink-0 text-slate-500" />Solo puedes cambiarla mientras estés en la etapa de documentos. El cambio queda registrado.</li>
          </ul>
          <label className="mt-4 block">
            <span className="etiqueta">¿Por qué la cambias? (mínimo 10 caracteres)</span>
            <textarea className="campo min-h-20" maxLength={250} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ejemplo: elegí mototaxi por error, quiero la licencia para moto lineal" />
          </label>
          {error && <div className="mt-3"><Aviso tipo="error">{error}</Aviso></div>}
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button type="button" className="btn-suave" onClick={() => setAbierto(false)}>Cancelar</button>
            <button type="button" className="btn-primario" disabled={motivo.trim().length < 10 || enviando} onClick={confirmar}>
              <Icono nombre="swap" className="text-lg" />{enviando ? 'Cambiando…' : `Cambiar a ${otra}`}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
