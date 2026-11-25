export type Rol = 'POSTULANTE' | 'GESTOR' | 'EVALUADOR' | 'SUPERVISOR' | 'ADMINISTRADOR';
export type Categoria = 'II-B' | 'II-C';
export type Etapa = 'DOCUMENTOS' | 'PAGO' | 'CITA' | 'EXAMEN_CONOCIMIENTOS' | 'EXAMEN_MANEJO' | 'EMISION' | 'EMITIDA';

export interface UsuarioSesion {
  id: number;
  usuario: string;
  nombre: string;
  rol: Rol;
  postulanteId: number | null;
}

export interface Plazo {
  diasTranscurridos: number;
  diasRestantes: number;
  vencido: boolean;
  porcentaje: number;
}

export interface Expediente {
  id: number;
  numero: string;
  postulanteId: number;
  tipoTramite: string;
  categoria: Categoria;
  etapa: Etapa;
  creadoEn: string;
  plazo: Plazo;
}

export interface Requisito {
  orden: number;
  descripcion: string;
  documento: string | null;
}

export interface Documento {
  id: number;
  expedienteId: number;
  tipo: string;
  estado: 'PENDIENTE' | 'APROBADO' | 'OBSERVADO';
  observacion: string | null;
}

export interface Pago {
  id: number;
  numeroOperacion: string;
  monto: number;
  fechaPago: string;
  estado: 'PENDIENTE' | 'VERIFICADO' | 'OBSERVADO' | 'RECHAZADO';
  observacion: string | null;
}

export interface Cupo {
  id: number;
  fecha: string;
  hora: string;
  tipo: 'CONOCIMIENTOS' | 'MANEJO';
  capacidad: number;
  disponibles: number;
}

export interface Cita {
  id: number;
  tipo: 'CONOCIMIENTOS' | 'MANEJO';
  fecha: string;
  hora: string;
}

export interface Evaluacion {
  id: number;
  expedienteId: number;
  tipo: 'CONOCIMIENTOS' | 'MANEJO';
  estado: 'PENDIENTE' | 'REGISTRADO' | 'VALIDADO' | 'AGOTADO';
  intentos: number;
  intentosRestantes: number;
  resultadoActual: { puntaje: number; aprobado: boolean; observaciones: string | null } | null;
  historial: { numero: number; puntaje: number; aprobado: boolean; observaciones: string | null }[];
  bloqueada: boolean;
}

export interface PostulanteResumen {
  id: number;
  dni: string;
  nombre: string;
  correo: string;
  celular: string;
}

export type TipoVerificacion = 'SNC_CERTIFICADO_MEDICO' | 'SNC_COFIPRO' | 'SANCIONES';

export interface Verificacion {
  id: number;
  tipo: TipoVerificacion;
  resultado: 'CONFORME' | 'NO_CONFORME';
  detalle: string | null;
  registradoEn: string;
}

export interface ObservacionExpediente {
  id: number;
  expedienteId: number;
  motivo: string;
  estado: 'ABIERTA' | 'ATENDIDA';
  creadoEn: string;
  respuesta: string | null;
  atendidaEn: string | null;
  numeroExpediente?: string;
}

export interface Licencia {
  expedienteId: number;
  numero: string;
  registradaEn: string;
}

export interface Revision {
  expedienteId: number;
  etapa: Etapa;
  verificacionesObligatorias: TipoVerificacion[];
  verificaciones: Verificacion[];
  observaciones: ObservacionExpediente[];
  licencia: Licencia | null;
  pendientes: string[];
  listoParaEmitir: boolean;
}

export type OrigenRespuesta = 'IA' | 'CONTENIDO' | 'ESTADO' | 'DERIVADA';

export interface ConsultaAsistente {
  id: number;
  pregunta: string;
  respuesta: string;
  origen: OrigenRespuesta;
  derivada: boolean;
  creadoEn: string;
  respuestaGestor: string | null;
  respondidaEn: string | null;
  postulanteId?: number;
}

export type TemaContenido = 'REQUISITOS' | 'DOCUMENTOS' | 'PAGOS' | 'CITAS' | 'EVALUACIONES' | 'TRAMITE';

export type Audiencia = 'POSTULANTE' | 'PERSONAL';

export interface ContenidoAsistente {
  id: number;
  tema: TemaContenido;
  audiencia: Audiencia;
  pregunta: string;
  respuesta: string;
  palabrasClave: string;
  activo: boolean;
}

/** Lo que cada usuario tiene por hacer, calculado con los datos del sistema. */
export interface Pendiente {
  codigo: string;
  texto: string;
  cantidad: number;
  urgente: boolean;
  ruta: string;
}

export interface ConsultaPersonal {
  pregunta: string;
  respuesta: string;
  origen: OrigenRespuesta;
  fuentes: number[];
  creadoEn: string;
}
