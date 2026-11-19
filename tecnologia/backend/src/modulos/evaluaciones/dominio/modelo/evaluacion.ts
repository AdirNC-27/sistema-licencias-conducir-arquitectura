import { ConflictoError } from '../../../../compartido/dominio/errores';
import { IntentosAgotadosError, ResultadoBloqueadoError } from './errores';
import { EstadoResultado, IntentoValidado, Resultado, TipoEvaluacion } from './tipos';

/** Entidad con las reglas críticas del trámite: 3 intentos (RF08) y bloqueo tras validar (RF09, DA04). */
export class Evaluacion {
  static readonly MAXIMO_INTENTOS = 3;

  constructor(
    readonly id: number,
    readonly expedienteId: number,
    readonly tipo: TipoEvaluacion,
    private estadoActual: EstadoResultado = EstadoResultado.PENDIENTE,
    private resultadoActual: Resultado | null = null,
    private intentosUsados = 0,
    private readonly historialValidado: IntentoValidado[] = [],
  ) {}

  get estado(): EstadoResultado {
    return this.estadoActual;
  }
  get resultado(): Resultado | null {
    return this.resultadoActual;
  }
  get intentos(): number {
    return this.intentosUsados;
  }
  get historial(): readonly IntentoValidado[] {
    return this.historialValidado;
  }

  registrar(nuevo: Resultado): void {
    if (this.estadoActual === EstadoResultado.VALIDADO) throw new ResultadoBloqueadoError(this.id);
    if (this.estadoActual === EstadoResultado.AGOTADO || this.intentosUsados >= Evaluacion.MAXIMO_INTENTOS) {
      throw new IntentosAgotadosError(this.id);
    }
    if (this.estadoActual === EstadoResultado.REGISTRADO) {
      throw new ConflictoError('Ya hay un resultado registrado sin validar; corríjalo o espere la validación');
    }
    this.intentosUsados++;
    this.resultadoActual = nuevo;
    this.estadoActual = EstadoResultado.REGISTRADO;
  }

  /** Corrige el intento actual sin consumir otro intento (RF09). */
  corregir(corregido: Resultado): Resultado {
    if (this.estadoActual !== EstadoResultado.REGISTRADO || !this.resultadoActual) throw new ResultadoBloqueadoError(this.id);
    const anterior = this.resultadoActual;
    this.resultadoActual = corregido;
    return anterior;
  }

  /** El supervisor valida: el intento queda bloqueado para siempre en el historial. */
  validar(): void {
    if (this.estadoActual === EstadoResultado.VALIDADO) throw new ResultadoBloqueadoError(this.id);
    if (this.estadoActual !== EstadoResultado.REGISTRADO || !this.resultadoActual) {
      throw new ConflictoError('No hay un resultado registrado para validar');
    }
    const r = this.resultadoActual;
    this.historialValidado.push({ numero: this.intentosUsados, puntaje: r.puntaje, aprobado: r.aprobado, observaciones: r.observaciones });
    if (r.aprobado) this.estadoActual = EstadoResultado.VALIDADO;
    else if (this.intentosUsados >= Evaluacion.MAXIMO_INTENTOS) this.estadoActual = EstadoResultado.AGOTADO;
    else {
      this.estadoActual = EstadoResultado.PENDIENTE; // espera el siguiente intento, sin pagar de nuevo
      this.resultadoActual = null;
    }
  }

  fueAprobada(): boolean {
    return this.estadoActual === EstadoResultado.VALIDADO;
  }

  estaBloqueada(): boolean {
    return this.estadoActual === EstadoResultado.VALIDADO || this.estadoActual === EstadoResultado.AGOTADO;
  }
}
