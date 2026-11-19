import { Categoria, TipoTramite } from '../../../compartido/dominio/categoria';
import { AccesoDenegadoError, ConflictoError } from '../../../compartido/dominio/errores';
import { esPersonal, Rol, UsuarioActual } from '../../../compartido/dominio/rol';
import { Etapa, siguienteEtapa } from './etapa';

export class Expediente {
  constructor(
    readonly id: number,
    readonly numero: string,
    readonly postulanteId: number,
    readonly tipoTramite: TipoTramite,
    readonly categoria: Categoria,
    private etapaActual: Etapa,
    readonly creadoEn: Date,
  ) {}

  get etapa(): Etapa {
    return this.etapaActual;
  }

  /**
   * RF20: solo avanza si está en la etapa esperada; nunca se salta una etapa.
   * Devuelve la etapa anterior para registrarla en auditoría.
   */
  avanzarDesde(esperada: Etapa): Etapa {
    if (this.etapaActual !== esperada) {
      throw new ConflictoError(`El expediente ${this.numero} está en ${this.etapaActual}, no en ${esperada}`);
    }
    const siguiente = siguienteEtapa(this.etapaActual);
    if (!siguiente) throw new ConflictoError(`El expediente ${this.numero} ya terminó el trámite`);
    this.etapaActual = siguiente;
    return esperada;
  }

  exigirEtapa(...permitidas: Etapa[]): void {
    if (!permitidas.includes(this.etapaActual)) {
      throw new ConflictoError(`Operación no permitida: el expediente ${this.numero} está en ${this.etapaActual}`);
    }
  }

  /** EQ-02: el postulante solo ve su expediente; el personal ve todos. */
  verificarAcceso(usuario: UsuarioActual): void {
    if (esPersonal(usuario)) return;
    if (usuario.rol === Rol.POSTULANTE && usuario.postulanteId === this.postulanteId) return;
    throw new AccesoDenegadoError('No tiene acceso a este expediente');
  }
}
