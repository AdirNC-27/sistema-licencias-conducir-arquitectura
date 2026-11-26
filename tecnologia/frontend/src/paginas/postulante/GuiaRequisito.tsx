import { useState } from 'react';
import { api } from '../../api/cliente';
import type { Expediente, PostulanteResumen } from '../../api/tipos';
import { mensajeError } from '../../componentes/useDatos';
import { Aviso, Icono } from '../../componentes/ui';

/**
 * Guía de cada requisito: qué es, dónde se obtiene y en qué orden. Datos verificados el 26/11/2026 en
 * resoluciones de la DRTC Ayacucho y listados del MTC (ver docs/06-validacion-calidad/guia-requisitos.md).
 */
interface Lugar { nombre: string; direccion: string; horario?: string; fuente: string }

const mapa = (direccion: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${direccion}, Huamanga, Ayacucho`)}`;

const CLINICAS: Lugar[] = [
  { nombre: 'Centro Médico Sagrado Niño Jesús', direccion: 'Jr. José Santos Chocano 362, Jesús Nazareno', horario: 'Lunes a sábado, 8:00 a 20:00', fuente: 'RDR N.° 269-2025-GRA/GG-GRI-DRTCA (05/09/2025)' },
  { nombre: 'Centro Médico Psicosomático Wari', direccion: 'Jr. Mariano Melgar 475, Jesús Nazareno', horario: 'Lunes a sábado, 8:00 a 18:00', fuente: 'RDR N.° 185-2025-GRA/GG-GRI-DRTCA (19/06/2025)' },
  { nombre: 'Centro Médico Medic (Policlínico Brevetes Medic)', direccion: 'Jr. José Santos Chocano 400, Jesús Nazareno', horario: 'Lunes a sábado, 8:00 a 20:00', fuente: 'RDR N.° 050-2022-GRA/GG-GRI-DRTCA' },
];

const ESCUELAS: Lugar[] = [
  { nombre: 'Escuela de Conductores Integrales Libertadores Ayacucho', direccion: 'Jr. Mariano Melgar 502, Urb. Simón Bolívar', fuente: 'Listado del MTC' },
  { nombre: 'Escuela de Conductores Integrales Mariscal Cáceres', direccion: 'Jr. Mariano Melgar 475-B', fuente: 'Listado del MTC' },
  { nombre: 'San Cristóbal VIP', direccion: 'Jr. José Santos Chocano 390', fuente: 'Listado del MTC' },
];

function ListaLugares({ lugares, icono }: { lugares: Lugar[]; icono: string }) {
  return (
    <ul className="mt-2 grid gap-2 sm:grid-cols-2">
      {lugares.map((l) => (
        <li key={l.nombre} className="flex gap-3 rounded-xl bg-white p-3 ring-1 ring-slate-200">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-marca-claro text-marca"><Icono nombre={icono} className="text-lg" /></span>
          <div className="min-w-0 text-sm">
            <p className="font-semibold text-slate-800">{l.nombre}</p>
            <p className="text-slate-600">{l.direccion}</p>
            {l.horario && <p className="text-xs text-slate-500">{l.horario}</p>}
            <a href={mapa(l.direccion)} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-marca hover:underline">
              <Icono nombre="map" />Ver en el mapa
            </a>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Ejemplo de fotografía tamaño carné: de frente, fondo blanco, con terno. Ilustración propia. */
function EjemploFoto() {
  return (
    <svg viewBox="0 0 120 150" className="h-36 w-auto shrink-0 rounded-md shadow ring-1 ring-slate-300" role="img" aria-label="Ejemplo de fotografía tamaño carné: de frente, fondo blanco y con terno">
      <rect width="120" height="150" fill="#ffffff" />
      <path d="M14 150 Q18 112 60 104 Q102 112 106 150Z" fill="#1f2937" />
      <path d="M48 106 L60 128 L72 106 Z" fill="#ffffff" />
      <path d="M56 112 L60 128 L64 112 L60 108Z" fill="#1e40af" />
      <rect x="51" y="86" width="18" height="20" rx="6" fill="#e0b48f" />
      <ellipse cx="60" cy="66" rx="23" ry="27" fill="#eac19c" />
      <path d="M36 62 Q38 36 60 36 Q82 36 84 62 Q78 48 60 47 Q42 48 36 62Z" fill="#2b1d16" />
      <circle cx="51" cy="66" r="2.3" fill="#1e293b" />
      <circle cx="69" cy="66" r="2.3" fill="#1e293b" />
      <path d="M53 79 Q60 83 67 79" stroke="#9a4a36" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function SolicitudConDatos({ expediente }: { expediente: Expediente }) {
  const [error, setError] = useState<string | null>(null);
  const [generando, setGenerando] = useState(false);
  const descargar = async () => {
    setGenerando(true);
    setError(null);
    try {
      const postulante = await api.get<PostulanteResumen>(`/postulantes/${expediente.postulanteId}`);
      const { descargarSolicitud } = await import('./solicitudPdf');
      await descargarSolicitud(expediente, postulante);
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setGenerando(false);
    }
  };
  return (
    <div className="rounded-xl bg-white p-3 ring-1 ring-blue-200">
      <button type="button" className="btn-primario" onClick={descargar} disabled={generando}>
        <Icono nombre="download" className="text-lg" />{generando ? 'Generando…' : 'Descargar mi solicitud con mis datos (PDF)'}
      </button>
      <ol className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
        {[['print', 'Imprímela'], ['sign', 'Completa tu domicilio, firma y pon tu huella'], ['camera', 'Escanéala o tómale una foto nítida'], ['upload', 'Adjúntala aquí']].map(([i, t], n) => (
          <li key={t} className="flex items-start gap-2"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-marca text-xs font-bold text-white">{n + 1}</span><span className="flex items-center gap-1"><Icono nombre={i} className="shrink-0 text-marca" />{t}</span></li>
        ))}
      </ol>
      {error && <div className="mt-2"><Aviso tipo="error">{error}</Aviso></div>}
      <p className="mt-2 text-xs text-slate-500">Modelo referencial con los requisitos del TUPA (PA6190033B). Si en ventanilla te entregan el formulario oficial, también puedes adjuntar ese.</p>
    </div>
  );
}

/** Contenido de «¿Cómo lo obtengo?» según el tipo de documento. */
function Contenido({ tipo, expediente }: { tipo: string; expediente: Expediente }) {
  switch (tipo) {
    case 'DECLARACION_JURADA':
      return (
        <div className="space-y-3">
          <p>Es un solo documento: tu <b>solicitud</b> dirigida al alcalde y tu <b>declaración jurada</b> de tener 18 años o más y no estar privado del derecho a conducir{expediente.categoria === 'II-C' ? ', y de no tener multas pendientes (mototaxi)' : ''}. El sistema la genera con tus datos.</p>
          <SolicitudConDatos expediente={expediente} />
        </div>
      );
    case 'CERTIFICADO_MEDICO':
      return (
        <div className="space-y-3">
          <p>Es el <b>examen psicosomático</b> (vista, oído, coordinación y evaluación psicológica) en una clínica autorizada por el MTC. La clínica registra el resultado en el Sistema Nacional de Conductores (SNC): el gestor lo verifica ahí. <b>Vale 6 meses</b>; si vence antes de terminar el trámite, hay que sacar otro.</p>
          <ul className="grid gap-1 sm:grid-cols-3">
            <li className="flex items-center gap-2"><Icono nombre="badge" className="text-marca" />Lleva tu DNI</li>
            <li className="flex items-center gap-2"><Icono nombre="payments" className="text-marca" />Precio libre: referencia S/ 100 a S/ 200</li>
            <li className="flex items-center gap-2"><Icono nombre="clock" className="text-marca" />Vigencia: 6 meses</li>
          </ul>
          <p className="font-semibold text-marca-oscuro">Clínicas autorizadas en Huamanga</p>
          <ListaLugares lugares={CLINICAS} icono="hospital" />
          <p className="text-xs text-slate-500">Autorizaciones de la Dirección Regional de Transportes de Ayacucho (2022 a 2025). Antes de ir, confirma la clínica en la consulta oficial del MTC: rec.mtc.gob.pe → Centros médicos autorizados. Cada clínica fija su precio; la municipalidad no interviene.</p>
        </div>
      );
    case 'FOTOGRAFIA':
      return (
        <div className="flex flex-col gap-4 sm:flex-row">
          <EjemploFoto />
          <div className="space-y-2">
            <p>El TUPA pide <b>2 fotografías tamaño carné, a color y con terno</b>. Sácalas en un estudio fotográfico:</p>
            <ul className="space-y-1">
              {['De frente, mirando a la cámara y con el rostro descubierto', 'Fondo blanco y buena luz, sin sombras', 'Sin gorra ni lentes oscuros', 'Recientes: que te reconozcan con facilidad'].map((t) => (
                <li key={t} className="flex gap-2"><Icono nombre="check_circle" className="mt-0.5 shrink-0 text-emerald-600" />{t}</li>
              ))}
            </ul>
            <p className="text-xs text-slate-500">Aquí adjuntas una foto o escaneo nítido de tus fotografías. Las originales las entregas cuando recojas tu licencia.</p>
          </div>
        </div>
      );
    case 'CONSTANCIA_COFIPRO':
      return (
        <div className="space-y-3">
          <p>Solo para <b>mototaxi (II-C)</b>. COFIPRO es el <b>curso de formación de conductores</b> que dicta una escuela de conductores autorizada por el MTC: normas de tránsito, mecánica básica y práctica de manejo (como referencia, unas 15 horas de teoría y 8 de práctica). Al aprobar, la escuela te da la constancia y la <b>registra en el SNC</b>; sin ese registro no es válida.</p>
          <ul className="grid gap-1 sm:grid-cols-3">
            <li className="flex items-center gap-2"><Icono nombre="badge" className="text-marca" />Lleva tu DNI</li>
            <li className="flex items-center gap-2"><Icono nombre="calendar_month" className="text-marca" />Horarios y fechas: los fija cada escuela</li>
            <li className="flex items-center gap-2"><Icono nombre="payments" className="text-marca" />Costo: lo fija cada escuela</li>
          </ul>
          <p className="font-semibold text-marca-oscuro">Escuelas de conductores en Huamanga</p>
          <ListaLugares lugares={ESCUELAS} icono="school" />
          <p className="text-xs text-slate-500">Según el listado de escuelas autorizadas del MTC. Pregunta en la escuela por el próximo grupo de COFIPRO para mototaxi y confirma que esté vigente en el portal del MTC.</p>
        </div>
      );
    default:
      return null;
  }
}

export function GuiaRequisito({ tipo, expediente, abiertoAlInicio = false }: { tipo: string; expediente: Expediente; abiertoAlInicio?: boolean }) {
  return (
    <details className="group mt-3 rounded-xl bg-marca-claro/40 ring-1 ring-blue-100" open={abiertoAlInicio}>
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm font-semibold text-marca [&::-webkit-details-marker]:hidden">
        <Icono nombre="info" className="text-base" />
        {tipo === 'DECLARACION_JURADA' ? '¿Cómo la obtengo? Descárgala con tus datos' : '¿Cómo lo obtengo?'}
        <Icono nombre="expand" className="ml-auto text-base transition group-open:rotate-180" />
      </summary>
      <div className="border-t border-blue-100 px-3 pb-3 pt-2 text-sm leading-relaxed text-slate-700">
        <Contenido tipo={tipo} expediente={expediente} />
      </div>
    </details>
  );
}

/** Orden recomendado: lo que tarda más va primero. */
export function PorDondeEmpiezo({ categoria }: { categoria: string }) {
  const pasos = [
    ['hospital', 'Certificado médico', 'En una clínica autorizada. Se registra en el SNC.'],
    ...(categoria === 'II-C' ? [['school', 'Curso COFIPRO', 'En una escuela de conductores. Toma varios días.']] : []),
    ['camera', 'Fotografías', '2 a color, tamaño carné, con terno.'],
    ['sign', 'Solicitud y declaración jurada', 'Descárgala con tus datos, fírmala y adjúntala.'],
  ];
  return (
    <div className="tarjeta">
      <h2 className="mb-3 flex items-center gap-2 font-bold text-marca-oscuro"><Icono nombre="pendientes" className="text-lg" />¿Por dónde empiezo?</h2>
      <ol className="space-y-3">
        {pasos.map(([icono, titulo, texto], i) => (
          <li key={titulo} className="flex gap-3">
            <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full bg-marca text-sm font-bold text-white">{i + 1}</span>
            <div className="text-sm">
              <p className="flex items-center gap-1.5 font-semibold text-slate-800"><Icono nombre={icono} className="text-marca" />{titulo}</p>
              <p className="text-slate-600">{texto}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
