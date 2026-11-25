import { ConflictoError, ReglaNegocioError } from '../../../compartido/dominio/errores';

export enum EstadoObservacion {
  ABIERTA = 'ABIERTA',
  ATENDIDA = 'ATENDIDA',
}

/** RF11 · HU21: el supervisor devuelve el expediente al gestor con un motivo; el gestor lo atiende. */
export class ObservacionExpediente {
  constructor(
    readonly id: number,
    readonly expedienteId: number,
    readonly motivo: string,
    readonly supervisorId: number,
    readonly creadoEn: Date,
    private estadoActual: EstadoObservacion = EstadoObservacion.ABIERTA,
    private respuestaActual: string | null = null,
    private gestorActual: number | null = null,
    private atendidaEnActual: Date | null = null,
  ) {}

  get estado(): EstadoObservacion {
    return this.estadoActual;
  }
  get respuesta(): string | null {
    return this.respuestaActual;
  }
  get gestorId(): number | null {
    return this.gestorActual;
  }
  get atendidaEn(): Date | null {
    return this.atendidaEnActual;
  }

  static validarMotivo(motivo: string): void {
    if (motivo.trim().length < 10) throw new ReglaNegocioError('Explique el motivo de la observación (al menos 10 caracteres)');
  }

  atender(respuesta: string, gestorId: number, ahora = new Date()): void {
    if (this.estadoActual === EstadoObservacion.ATENDIDA) throw new ConflictoError('La observación ya fue atendida');
    if (respuesta.trim().length < 10) throw new ReglaNegocioError('Describa la corrección realizada (al menos 10 caracteres)');
    this.estadoActual = EstadoObservacion.ATENDIDA;
    this.respuestaActual = respuesta.trim();
    this.gestorActual = gestorId;
    this.atendidaEnActual = ahora;
  }
}
