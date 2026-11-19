import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ErrorDominio } from '../dominio/errores';

const ESTADO_HTTP: Record<ErrorDominio['tipo'], number> = {
  NO_ENCONTRADO: HttpStatus.NOT_FOUND,
  CONFLICTO: HttpStatus.CONFLICT,
  REGLA_NEGOCIO: HttpStatus.UNPROCESSABLE_ENTITY,
  ACCESO_DENEGADO: HttpStatus.FORBIDDEN,
  NO_AUTENTICADO: HttpStatus.UNAUTHORIZED,
};

/** Traduce los errores del dominio a respuestas HTTP (409, 404, 422, 403, 401). */
@Catch(ErrorDominio)
export class FiltroErroresDominio implements ExceptionFilter {
  catch(error: ErrorDominio, host: ArgumentsHost): void {
    const respuesta = host.switchToHttp().getResponse<Response>();
    const estado = ESTADO_HTTP[error.tipo];
    respuesta.status(estado).json({ estado, error: error.name, mensaje: error.message });
  }
}
