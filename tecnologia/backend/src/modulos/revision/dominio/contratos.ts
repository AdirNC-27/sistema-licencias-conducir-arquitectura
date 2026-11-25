import { ObservacionExpediente } from './observacion';
import { LicenciaEmitida } from './revision';
import { ResultadoVerificacion, TipoVerificacion, Verificacion } from './verificacion';

export interface RepositorioRevision {
  registrarVerificacion(datos: { expedienteId: number; tipo: TipoVerificacion; resultado: ResultadoVerificacion; detalle: string | null; gestorId: number }): Promise<Verificacion>;
  verificacionesDe(expedienteId: number): Promise<Verificacion[]>;

  crearObservacion(datos: { expedienteId: number; motivo: string; supervisorId: number }): Promise<ObservacionExpediente>;
  buscarObservacion(id: number): Promise<ObservacionExpediente>;
  observacionesDe(expedienteId: number): Promise<ObservacionExpediente[]>;
  observacionesAbiertas(): Promise<ObservacionExpediente[]>;
  guardarAtencion(observacion: ObservacionExpediente): Promise<void>;

  registrarLicencia(licencia: Omit<LicenciaEmitida, 'registradaEn'>): Promise<LicenciaEmitida>;
  licenciaDe(expedienteId: number): Promise<LicenciaEmitida | null>;
  existeNumeroLicencia(numero: string): Promise<boolean>;
}

export const REPOSITORIO_REVISION = Symbol('RepositorioRevision');
