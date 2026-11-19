import type { Etapa } from './tipos';

export const ETAPAS: { clave: Etapa; nombre: string; corto: string }[] = [
  { clave: 'DOCUMENTOS', nombre: 'Documentos', corto: 'Docs' },
  { clave: 'PAGO', nombre: 'Pago', corto: 'Pago' },
  { clave: 'CITA', nombre: 'Elegir cita', corto: 'Cita' },
  { clave: 'EXAMEN_CONOCIMIENTOS', nombre: 'Examen de conocimientos', corto: 'Conoc.' },
  { clave: 'EXAMEN_MANEJO', nombre: 'Examen de manejo', corto: 'Manejo' },
  { clave: 'EMISION', nombre: 'Emisión', corto: 'Emisión' },
  { clave: 'EMITIDA', nombre: 'Licencia emitida', corto: 'Emitida' },
];

export const nombreEtapa = (e: Etapa) => ETAPAS.find((x) => x.clave === e)?.nombre ?? e;

export const NOMBRE_DOCUMENTO: Record<string, string> = {
  DECLARACION_JURADA: 'Solicitud y declaración jurada',
  CERTIFICADO_MEDICO: 'Certificado médico',
  FOTOGRAFIA: 'Fotografías tamaño carné',
  CONSTANCIA_COFIPRO: 'Constancia COFIPRO',
};

export const NOMBRE_ROL: Record<string, string> = {
  POSTULANTE: 'Postulante',
  GESTOR: 'Gestor de trámites',
  EVALUADOR: 'Evaluador',
  SUPERVISOR: 'Supervisor',
  ADMINISTRADOR: 'Administrador',
};

export const fecha = (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString('es-PE', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
export const fechaHora = (iso: string) => new Date(iso).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
export const soles = (n: number) => `S/ ${n.toFixed(2)}`;
