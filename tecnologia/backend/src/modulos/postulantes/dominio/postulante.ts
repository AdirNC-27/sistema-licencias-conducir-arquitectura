import { ReglaNegocioError } from '../../../compartido/dominio/errores';

export class Dni {
  readonly valor: string;
  constructor(valor: string) {
    const limpio = (valor ?? '').trim();
    if (!/^\d{8}$/.test(limpio)) throw new ReglaNegocioError('El DNI debe tener 8 dígitos');
    this.valor = limpio;
  }
}

export interface DatosIdentidad {
  dni: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
}

export class Postulante {
  constructor(
    readonly id: number,
    readonly dni: string,
    readonly nombres: string,
    readonly apellidos: string,
    readonly correo: string,
    readonly celular: string,
  ) {}

  get nombreCompleto(): string {
    return `${this.nombres} ${this.apellidos}`.trim();
  }
}
