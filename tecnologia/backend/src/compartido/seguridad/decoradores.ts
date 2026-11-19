import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Rol, UsuarioActual } from '../dominio/rol';

export const CLAVE_ROLES = 'roles';
export const CLAVE_PUBLICO = 'publico';

/** Roles que pueden ejecutar el endpoint (RF01, DA01). */
export const Roles = (...roles: Rol[]) => SetMetadata(CLAVE_ROLES, roles);

/** Endpoint sin autenticación (login, registro, requisitos públicos). */
export const Publico = () => SetMetadata(CLAVE_PUBLICO, true);

export const Usuario = createParamDecorator(
  (_dato: unknown, contexto: ExecutionContext): UsuarioActual => contexto.switchToHttp().getRequest().user,
);
