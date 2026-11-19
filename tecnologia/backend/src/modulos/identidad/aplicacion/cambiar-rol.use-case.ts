import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ReglaNegocioError, RecursoNoEncontradoError } from '../../../compartido/dominio/errores';
import { Rol, UsuarioActual } from '../../../compartido/dominio/rol';
import { EVENTOS, OperacionAuditable } from '../../../compartido/eventos/eventos';
import { REPOSITORIO_USUARIOS, RepositorioUsuarios } from '../dominio/contratos';

/** RF16: el administrador cambia el rol de una cuenta del personal. Operación auditable (RF17). */
@Injectable()
export class CambiarRolUseCase {
  constructor(
    @Inject(REPOSITORIO_USUARIOS) private readonly usuarios: RepositorioUsuarios,
    private readonly eventos: EventEmitter2,
  ) {}

  async ejecutar(usuarioId: number, nuevoRol: Rol, administrador: UsuarioActual) {
    const usuario = await this.usuarios.buscarPorId(usuarioId);
    if (!usuario) throw new RecursoNoEncontradoError(`No existe el usuario ${usuarioId}`);
    if (usuario.rol === Rol.POSTULANTE || nuevoRol === Rol.POSTULANTE) {
      throw new ReglaNegocioError('Los postulantes no pueden pasar a ser personal ni al revés');
    }
    const anterior = usuario.cambiarRol(nuevoRol);
    await this.usuarios.guardarRol(usuario);
    const operacion: OperacionAuditable = {
      usuarioId: administrador.id,
      accion: 'CAMBIAR_ROL',
      entidad: 'usuario',
      entidadId: usuario.id,
      valorAnterior: { rol: anterior },
      valorNuevo: { rol: nuevoRol },
    };
    this.eventos.emit(EVENTOS.OPERACION_AUDITABLE, operacion);
    return { id: usuario.id, usuario: usuario.usuario, rol: usuario.rol };
  }
}
