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
