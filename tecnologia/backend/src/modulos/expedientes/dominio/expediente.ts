import { Categoria, TipoTramite } from '../../../compartido/dominio/categoria';
import { AccesoDenegadoError, ConflictoError, ReglaNegocioError } from '../../../compartido/dominio/errores';
import { esPersonal, Rol, UsuarioActual } from '../../../compartido/dominio/rol';
import { Etapa, siguienteEtapa } from './etapa';

export class Expediente {
  constructor(
    readonly id: number,
    readonly numero: string,
    readonly postulanteId: number,
    readonly tipoTramite: TipoTramite,
    private categoriaActual: Categoria,
    private etapaActual: Etapa,
    readonly creadoEn: Date,
  ) {}

  get etapa(): Etapa {
    return this.etapaActual;
  }

  get categoria(): Categoria {
    return this.categoriaActual;
  }

  /**
   * El postulante corrige la categoría que eligió por error. Solo él y solo mientras el trámite
   * está en DOCUMENTOS: todavía no hay pago (la tasa depende de la categoría) ni exámenes.
   * Devuelve la categoría anterior para la auditoría.
   */
  cambiarCategoria(nueva: Categoria, usuario: UsuarioActual): Categoria {
    if (usuario.rol !== Rol.POSTULANTE || usuario.postulanteId !== this.postulanteId) {
      throw new AccesoDenegadoError('Solo el postulante dueño del trámite puede cambiar su categoría');
    }
    if (this.etapaActual !== Etapa.DOCUMENTOS) {
      throw new ConflictoError(`La categoría solo se puede cambiar en la etapa de documentos; el expediente ${this.numero} está en ${this.etapaActual}`);
    }
    if (nueva === this.categoriaActual) throw new ReglaNegocioError(`El expediente ya es de la categoría ${nueva}`);
    const anterior = this.categoriaActual;
    this.categoriaActual = nueva;
    return anterior;
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
