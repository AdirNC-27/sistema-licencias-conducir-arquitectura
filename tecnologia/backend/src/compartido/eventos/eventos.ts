/** Eventos internos del monolito (patrón Observer con @nestjs/event-emitter). */
export const EVENTOS = {
  OPERACION_AUDITABLE: 'auditoria.operacion',
  ETAPA_CAMBIADA: 'expediente.etapa-cambiada',
  CITA_RESERVADA: 'cita.reservada',
} as const;

export interface OperacionAuditable {
  usuarioId: number;
  accion: string;
  entidad: string;
  entidadId: number;
  valorAnterior: unknown;
  valorNuevo: unknown;
  motivo?: string;
}

export interface EtapaCambiada {
  expedienteId: number;
  numero: string;
  postulanteId: number;
  etapaAnterior: string;
  etapaNueva: string;
}

export interface CitaReservada {
  expedienteId: number;
  postulanteId: number;
  tipo: string;
  fecha: string;
}
