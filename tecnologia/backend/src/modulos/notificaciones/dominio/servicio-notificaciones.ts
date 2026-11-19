export interface Mensaje {
  correo: string;
  asunto: string;
  texto: string;
}

/** Contrato del canal de salida (ADR-013). Cambiar de proveedor = otro adaptador. */
export interface ServicioNotificaciones {
  enviar(mensaje: Mensaje): Promise<boolean>;
}

export const SERVICIO_NOTIFICACIONES = Symbol('ServicioNotificaciones');

export const NOMBRE_ETAPA: Record<string, string> = {
  DOCUMENTOS: 'revisión de documentos',
  PAGO: 'pago',
  CITA: 'elegir cita',
  EXAMEN_CONOCIMIENTOS: 'examen de conocimientos',
  EXAMEN_MANEJO: 'examen de manejo',
  EMISION: 'emisión de la licencia',
  EMITIDA: 'licencia emitida',
};

export interface Aviso {
  postulanteId: number;
  asunto: string;
  texto: string;
  enviadoPorCorreo: boolean;
}

/** Avisos internos que el postulante ve en la plataforma (RF13). */
export interface RepositorioAvisos {
  guardar(aviso: Aviso): Promise<void>;
}

export const REPOSITORIO_AVISOS = Symbol('RepositorioAvisos');
