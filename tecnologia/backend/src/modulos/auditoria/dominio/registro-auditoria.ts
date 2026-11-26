import { OperacionAuditable } from '../../../compartido/eventos/eventos';

/** Contrato pequeño (SOLID · I): solo registra. Lo usan los casos de uso y el escuchador de eventos. */
export interface RegistroAuditoria {
  registrar(operacion: OperacionAuditable): Promise<void>;
}

export const REGISTRO_AUDITORIA = Symbol('RegistroAuditoria');

/** Las 16 operaciones auditables de EQ-07. */
export const OPERACIONES_AUDITABLES = [
  'APROBAR_DOCUMENTO',
  'OBSERVAR_DOCUMENTO',
  'VERIFICAR_PAGO',
  'REGISTRAR_RESULTADO',
  'CORREGIR_RESULTADO',
  'VALIDAR_RESULTADO',
  'INTENTO_MODIFICAR_BLOQUEADO',
  'CAMBIAR_ETAPA',
  'VERIFICAR_PORTAL_OFICIAL',
  'OBSERVAR_EXPEDIENTE',
  'ATENDER_OBSERVACION',
  'AUTORIZAR_EMISION',
  'REGISTRAR_LICENCIA_SNC',
  'RESPONDER_CONSULTA',
  'GESTIONAR_CONTENIDO',
  'CAMBIAR_ROL',
] as const;
