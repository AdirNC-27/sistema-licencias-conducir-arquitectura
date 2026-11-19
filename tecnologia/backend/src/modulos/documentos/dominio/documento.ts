import { Categoria } from '../../../compartido/dominio/categoria';
import { ConflictoError, ReglaNegocioError } from '../../../compartido/dominio/errores';

export enum TipoDocumento {
  DECLARACION_JURADA = 'DECLARACION_JURADA',
  CERTIFICADO_MEDICO = 'CERTIFICADO_MEDICO',
  FOTOGRAFIA = 'FOTOGRAFIA',
  CONSTANCIA_COFIPRO = 'CONSTANCIA_COFIPRO',
}

export enum EstadoDocumento {
  PENDIENTE = 'PENDIENTE',
  APROBADO = 'APROBADO',
  OBSERVADO = 'OBSERVADO',
}

/** Documentos obligatorios según la categoría (TUPA MPH). La II-C pide además la constancia COFIPRO. */
export function documentosObligatorios(categoria: Categoria): TipoDocumento[] {
  const base = [TipoDocumento.DECLARACION_JURADA, TipoDocumento.CERTIFICADO_MEDICO, TipoDocumento.FOTOGRAFIA];
  return categoria === Categoria.II_C ? [...base, TipoDocumento.CONSTANCIA_COFIPRO] : base;
}

export const VIGENCIA_CERTIFICADO_MESES = 6;

/** RF23: el certificado médico vale 6 meses desde su emisión. */
export function certificadoVigente(fechaEmision: Date, hoy: Date): boolean {
  const vence = new Date(fechaEmision);
  vence.setMonth(vence.getMonth() + VIGENCIA_CERTIFICADO_MESES);
  return hoy <= vence;
}

export class Documento {
  constructor(
    readonly id: number,
    readonly expedienteId: number,
    readonly tipo: TipoDocumento,
    private estadoActual: EstadoDocumento,
    private observacionActual: string | null,
    readonly fechaEmision: Date | null,
  ) {}

  get estado(): EstadoDocumento {
    return this.estadoActual;
  }
  get observacion(): string | null {
    return this.observacionActual;
  }

  /** RF04: el gestor aprueba u observa. Un documento aprobado ya no se cambia. */
  revisar(nuevo: EstadoDocumento.APROBADO | EstadoDocumento.OBSERVADO, observacion: string | null, hoy = new Date()): EstadoDocumento {
    if (this.estadoActual === EstadoDocumento.APROBADO) throw new ConflictoError('El documento ya fue aprobado');
    if (nuevo === EstadoDocumento.OBSERVADO && !observacion) throw new ReglaNegocioError('Indique el motivo de la observación');
    if (nuevo === EstadoDocumento.APROBADO && this.tipo === TipoDocumento.CERTIFICADO_MEDICO) {
      if (!this.fechaEmision || !certificadoVigente(this.fechaEmision, hoy)) {
        throw new ReglaNegocioError('El certificado médico no está vigente (6 meses)');
      }
    }
    const anterior = this.estadoActual;
    this.estadoActual = nuevo;
    this.observacionActual = nuevo === EstadoDocumento.OBSERVADO ? observacion : null;
    return anterior;
  }
}
