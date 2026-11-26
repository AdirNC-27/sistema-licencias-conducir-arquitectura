import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/cliente';
import { ETAPAS, fecha, nombreEtapa } from '../../api/textos';
import type { Categoria, Etapa } from '../../api/tipos';
import { mensajeError } from '../../componentes/useDatos';
import { Pendientes } from '../../componentes/Pendientes';
import { Aviso, Barra, Cargando, Chip, Icono } from '../../componentes/ui';
import { useSesion } from '../../sesion/sesion';
import { useMiExpediente } from './useMiExpediente';
import motoIIB from '../../assets/moto-iib.webp';
import mototaxiIIC from '../../assets/mototaxi-iic.webp';

const ACCION: Record<Etapa, { texto: string; ruta: string; detalle: string }> = {
  DOCUMENTOS: { texto: 'Subir mis documentos', ruta: '/postulante/documentos', detalle: 'Adjunta los requisitos del TUPA; el gestor los revisará.' },
  PAGO: { texto: 'Registrar mi pago', ruta: '/postulante/pago', detalle: 'Paga en el SAT Huamanga (módulo 11 del MAC) y registra tu recibo.' },
  CITA: { texto: 'Elegir mi cita', ruta: '/postulante/cita', detalle: 'Elige el día de tu examen de conocimientos (lunes a miércoles).' },
  EXAMEN_CONOCIMIENTOS: { texto: 'Ver mi cita y resultados', ruta: '/postulante/resultados', detalle: 'Rinde tu examen. Tienes 3 intentos sin pagar de nuevo.' },
  EXAMEN_MANEJO: { texto: 'Elegir cita de manejo', ruta: '/postulante/cita', detalle: 'Aprobaste conocimientos. Elige tu examen de manejo (martes a viernes).' },
  EMISION: { texto: 'Ver mis resultados', ruta: '/postulante/resultados', detalle: 'Aprobaste los dos exámenes. La Subgerencia autorizará tu licencia.' },
  EMITIDA: { texto: 'Ver mi trámite', ruta: '/postulante/resultados', detalle: 'Tu licencia fue emitida. Acércate a recogerla.' },
};

const CATEGORIAS = [
  { c: 'II-B', imagen: motoIIB, alt: 'Moto lineal azul', t: 'Moto', d: 'Uso particular', tasa: 'S/ 69.90' },
  { c: 'II-C', imagen: mototaxiIIC, alt: 'Mototaxi roja', t: 'Mototaxi', d: 'Servicio público', tasa: 'S/ 69.40' },
] as const;

function CrearTramite({ alCrear }: { alCrear: () => void }) {
  const [categoria, setCategoria] = useState<Categoria>('II-B');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const crear = async () => {
    setEnviando(true);
    try {
      await api.post('/expedientes', { tipoTramite: 'EMISION', categoria });
      alCrear();
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setEnviando(false);
    }
  };
  return (
    <div className="tarjeta bg-white/90 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-marca text-white shadow-md"><Icono nombre="badge" className="text-xl" /></span>
        <div>
          <h2 className="text-xl font-extrabold text-marca-oscuro">Inicia tu trámite de emisión</h2>
          <p className="subtitulo">Elige la categoría de tu licencia.</p>
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2" role="radiogroup" aria-label="Categoría de la licencia">
        {CATEGORIAS.map(({ c, imagen, alt, t, d, tasa }) => {
          const elegida = categoria === c;
          return (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={elegida}
              onClick={() => setCategoria(c)}
              className={`group flex items-center gap-4 rounded-2xl p-4 text-left ring-2 transition hover:-translate-y-0.5 hover:shadow-lg ${elegida ? 'bg-marca-claro/70 shadow-md ring-marca' : 'bg-white ring-slate-200 hover:ring-blue-200'}`}
            >
              <img src={imagen} alt={alt} className="h-24 w-32 shrink-0 object-contain drop-shadow-md transition group-hover:scale-105 sm:h-28 sm:w-40" />
              <span className="h-20 w-px shrink-0 bg-slate-200" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-extrabold text-marca-oscuro">{t} · {c}</span>
                <span className="block text-sm text-slate-600">{d}</span>
                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-marca-claro px-3 py-1 text-sm font-bold text-marca-oscuro"><Icono nombre="payments" className="text-base" />{tasa}</span>
              </span>
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 ${elegida ? 'border-marca bg-marca text-white' : 'border-slate-300 bg-white'}`} aria-hidden="true">
                {elegida && <Icono nombre="check" className="text-lg" />}
              </span>
            </button>
          );
        })}
      </div>
      {error && <div className="mt-4"><Aviso tipo="error">{error}</Aviso></div>}
      <button className="btn-acento mt-6 px-7 py-3 text-base shadow-lg shadow-orange-600/25" onClick={crear} disabled={enviando}>
        {enviando ? 'Creando…' : 'Iniciar trámite'}<Icono nombre="arrow_forward" className="text-lg" />
      </button>
    </div>
  );
}

export function Inicio() {
  const { usuario } = useSesion();
  const { expediente, cargando, error, recargar } = useMiExpediente();
  if (cargando) return <Cargando />;
  const nombre = usuario?.nombre.split(' ')[0] ?? '';
  const indice = expediente ? ETAPAS.findIndex((e) => e.clave === expediente.etapa) : -1;
  const accion = expediente ? ACCION[expediente.etapa] : null;

  return (
    <div className="space-y-6">
      <div>
        <p className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200"><Icono nombre="verified" className="text-base" />Postulante habilitado</p>
        <h1 className="titulo mt-2 text-3xl capitalize sm:text-4xl">¡Hola, {nombre.toLowerCase()}! <span aria-hidden="true">👋</span></h1>
        <p className="subtitulo">Aquí ves en qué etapa está tu trámite y qué te falta.</p>
      </div>
      {error && <Aviso tipo="error">{error}</Aviso>}
      {expediente && <Pendientes titulo="Lo que te toca ahora" lista />}
      {!expediente && !error && <CrearTramite alCrear={recargar} />}
      {expediente && accion && (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <div className="tarjeta">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Expediente digital</p>
                  <p className="text-2xl font-extrabold text-marca">{expediente.numero}</p>
                </div>
                <Chip color={expediente.etapa === 'EMITIDA' ? 'verde' : 'azul'}>{nombreEtapa(expediente.etapa)}</Chip>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-slate-500">Categoría</p><p className="font-semibold">{expediente.categoria === 'II-C' ? 'II-C · Mototaxi' : 'II-B · Moto'}</p></div>
                <div><p className="text-slate-500">Iniciado</p><p className="font-semibold">{fecha(expediente.creadoEn)}</p></div>
              </div>
              <div className="mt-5 rounded-xl bg-fondo p-4">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-semibold text-slate-700">Plazo legal (10 días hábiles)</span>
                  <span className={`font-bold ${expediente.plazo.vencido ? 'text-red-600' : 'text-marca'}`}>Día {expediente.plazo.diasTranscurridos} de 10</span>
                </div>
                <Barra porcentaje={expediente.plazo.porcentaje} color={expediente.plazo.vencido ? 'bg-red-500' : 'bg-gradient-to-r from-marca to-blue-400'} />
                <p className="mt-2 text-xs text-slate-600">{expediente.plazo.vencido ? 'Plazo superado' : `Quedan ${expediente.plazo.diasRestantes} días hábiles`}</p>
              </div>
            </div>
            <div className="tarjeta border-l-4 border-acento">
              <Chip color="naranja">Tu próxima acción</Chip>
              <h2 className="mt-3 text-xl font-bold text-marca-oscuro">{accion.texto}</h2>
              <p className="mt-1 text-sm text-slate-600">{accion.detalle}</p>
              <Link to={accion.ruta} className="btn-acento mt-4">{accion.texto} <Icono nombre="arrow_forward" className="text-lg" /></Link>
            </div>
          </div>
          <div className="tarjeta lg:col-span-2">
            <h2 className="mb-4 font-bold text-marca-oscuro">Ruta del trámite</h2>
            <ol className="space-y-1">
              {ETAPAS.map((e, i) => {
                const hecha = i < indice || expediente.etapa === 'EMITIDA';
                const actual = i === indice && expediente.etapa !== 'EMITIDA';
                return (
                  <li key={e.clave} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${actual ? 'bg-acento-claro ring-1 ring-orange-200' : ''}`}>
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${hecha ? 'bg-emerald-500 text-white' : actual ? 'bg-acento text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {hecha ? <Icono nombre="check" className="text-lg" /> : i + 1}
                    </span>
                    <span className={`text-sm ${actual ? 'font-bold text-orange-800' : hecha ? 'font-medium text-slate-700' : 'text-slate-500'}`}>{e.nombre}</span>
                    {actual && <span className="ml-auto text-xs font-semibold text-orange-700">Etapa actual</span>}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
