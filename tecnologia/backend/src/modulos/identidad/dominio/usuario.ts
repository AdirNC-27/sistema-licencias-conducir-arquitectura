import { Rol } from '../../../compartido/dominio/rol';

export class Usuario {
  constructor(
    readonly id: number,
    readonly usuario: string,
    readonly nombre: string,
    readonly claveCifrada: string,
    private rolActual: Rol,
    readonly postulanteId: number | null = null,
    readonly activo = true,
  ) {}

  get rol(): Rol {
    return this.rolActual;
  }

  cambiarRol(nuevo: Rol): Rol {
    const anterior = this.rolActual;
    this.rolActual = nuevo;
    return anterior;
  }
}
