import { Inject, Injectable } from '@nestjs/common';
import { AccesoDenegadoError, RecursoNoEncontradoError } from '../../../compartido/dominio/errores';
import { esPersonal, UsuarioActual } from '../../../compartido/dominio/rol';
import { REPOSITORIO_POSTULANTES, RepositorioPostulantes } from '../dominio/contratos';
import { Postulante } from '../dominio/postulante';

const vista = (p: Postulante) => ({ id: p.id, dni: p.dni, nombre: p.nombreCompleto, correo: p.correo, celular: p.celular });

/** Datos del postulante: el personal ve a cualquiera; el postulante solo a sí mismo (EQ-02). */
@Injectable()
export class ConsultarPostulantesUseCase {
  constructor(@Inject(REPOSITORIO_POSTULANTES) private readonly postulantes: RepositorioPostulantes) {}

  async uno(id: number, usuario: UsuarioActual) {
    if (!esPersonal(usuario) && usuario.postulanteId !== id) throw new AccesoDenegadoError('No puede ver los datos de otro postulante');
    const p = await this.postulantes.buscarPorId(id);
    if (!p) throw new RecursoNoEncontradoError(`No existe el postulante ${id}`);
    return vista(p);
  }

  async varios(ids: number[]) {
    return (await this.postulantes.buscarVarios(ids.slice(0, 100))).map(vista);
  }
}
