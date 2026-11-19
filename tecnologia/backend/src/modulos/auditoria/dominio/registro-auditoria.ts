import { OperacionAuditable } from '../../../compartido/eventos/eventos';

/** Contrato pequeño (SOLID · I): solo registra. Lo usan los casos de uso y el escuchador de eventos. */
export interface RegistroAuditoria {
  registrar(operacion: OperacionAuditable): Promise<void>;
}

export const REGISTRO_AUDITORIA = Symbol('RegistroAuditoria');

/** Las 8 operaciones auditables definidas en EQ-07. */
export const OPERACIONES_AUDITABLES = [
  'APROBAR_DOCUMENTO',
  'OBSERVAR_DOCUMENTO',
  'VERIFICAR_PAGO',
  'REGISTRAR_RESULTADO',
  'CORREGIR_RESULTADO',
  'VALIDAR_RESULTADO',
  'CAMBIAR_ETAPA',
  'AUTORIZAR_EMISION',
  'CAMBIAR_ROL',
] as const;
