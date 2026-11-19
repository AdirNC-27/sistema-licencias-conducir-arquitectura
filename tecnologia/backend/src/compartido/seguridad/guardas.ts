import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Rol, UsuarioActual } from '../dominio/rol';
import { CLAVE_PUBLICO, CLAVE_ROLES } from './decoradores';

/** Exige un token JWT válido en todos los endpoints, salvo los marcados con @Publico(). */
@Injectable()
export class GuardaJwt extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(contexto: ExecutionContext) {
    const publico = this.reflector.getAllAndOverride<boolean>(CLAVE_PUBLICO, [contexto.getHandler(), contexto.getClass()]);
    return publico ? true : super.canActivate(contexto);
  }
}

/** Comprueba que el rol del token esté entre los permitidos por @Roles(). Responde 403 si no. */
@Injectable()
export class GuardaRoles implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(contexto: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Rol[]>(CLAVE_ROLES, [contexto.getHandler(), contexto.getClass()]);
    if (!roles || roles.length === 0) return true;
    const usuario: UsuarioActual | undefined = contexto.switchToHttp().getRequest().user;
    if (!usuario || !roles.includes(usuario.rol)) {
      throw new ForbiddenException('Su rol no tiene permiso para esta operación');
    }
    return true;
  }
}
