import { Categoria, TASA_EMISION } from '../../../compartido/dominio/categoria';
import { ConflictoError, ReglaNegocioError } from '../../../compartido/dominio/errores';

export enum EstadoPago {
  PENDIENTE = 'PENDIENTE',
  VERIFICADO = 'VERIFICADO',
  OBSERVADO = 'OBSERVADO',
  RECHAZADO = 'RECHAZADO',
}

export class Pago {
  constructor(
    readonly id: number,
    readonly expedienteId: number,
    readonly numeroOperacion: string,
    readonly monto: number,
    readonly fechaPago: Date,
    private estadoActual: EstadoPago,
    private observacionActual: string | null,
  ) {}

  get estado(): EstadoPago {
    return this.estadoActual;
  }
  get observacion(): string | null {
    return this.observacionActual;
  }

  /** RF05: el monto debe ser la tasa única de la categoría y la fecha no puede ser futura. */
  static validarRegistro(categoria: Categoria, monto: number, fechaPago: Date, hoy = new Date()): void {
    const tasa = TASA_EMISION[categoria];
    if (Math.abs(monto - tasa) > 0.001) throw new ReglaNegocioError(`El monto para ${categoria} es S/ ${tasa.toFixed(2)}`);
    if (fechaPago.getTime() > hoy.getTime()) throw new ReglaNegocioError('La fecha de pago no puede ser futura');
  }

  /** RF06: el gestor verifica, observa o rechaza. Un pago verificado ya no cambia. */
  verificar(nuevo: Exclude<EstadoPago, EstadoPago.PENDIENTE>, observacion: string | null): EstadoPago {
    if (this.estadoActual === EstadoPago.VERIFICADO) throw new ConflictoError('El pago ya fue verificado');
    if (nuevo !== EstadoPago.VERIFICADO && !observacion) throw new ReglaNegocioError('Indique el motivo');
    const anterior = this.estadoActual;
    this.estadoActual = nuevo;
    this.observacionActual = nuevo === EstadoPago.VERIFICADO ? null : observacion;
    return anterior;
  }
}

export interface RepositorioPagos {
  registrar(datos: { expedienteId: number; numeroOperacion: string; monto: number; fechaPago: Date }): Promise<Pago>;
  buscarPorId(id: number): Promise<Pago>;
  listarDeExpediente(expedienteId: number): Promise<Pago[]>;
  existeOperacion(numeroOperacion: string): Promise<boolean>;
  guardarEstado(pago: Pago): Promise<void>;
}

export const REPOSITORIO_PAGOS = Symbol('RepositorioPagos');
