import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Response } from 'express';
import { ErrorDominio } from '../dominio/errores';
import { traducirMensaje } from './mensajes-validacion';

/** Formato único de error de toda la API (contrato OpenAPI). */
export class ErrorRespuesta {
  @ApiProperty({ example: 409, description: 'Código HTTP' }) estado!: number;
  @ApiProperty({ example: 'ConflictoError', description: 'Tipo de error' })
  error!: string;
  @ApiProperty({
    example: 'Ya tiene un trámite en curso',
    description: 'Mensaje para mostrar al usuario',
  })
  mensaje!: string;
  @ApiPropertyOptional({
    type: [String],
    example: ['categoria debe ser uno de estos valores: II-B, II-C'],
    description: 'Solo en 400: cada dato inválido',
  })
  detalles?: string[];
}

const ESTADO_DOMINIO: Record<ErrorDominio['tipo'], number> = {
  NO_ENCONTRADO: HttpStatus.NOT_FOUND,
  CONFLICTO: HttpStatus.CONFLICT,
  REGLA_NEGOCIO: HttpStatus.UNPROCESSABLE_ENTITY,
  ACCESO_DENEGADO: HttpStatus.FORBIDDEN,
  NO_AUTENTICADO: HttpStatus.UNAUTHORIZED,
};

const NOMBRE_HTTP: Record<number, string> = {
  400: 'SolicitudInvalida',
  401: 'NoAutenticado',
  403: 'AccesoDenegado',
  404: 'NoEncontrado',
  413: 'ArchivoMuyGrande',
};

const MENSAJE_HTTP: Record<number, string> = {
  400: 'Datos de entrada inválidos',
  401: 'Inicie sesión: el token falta, no es válido o expiró',
  403: 'Su rol no tiene permiso para esta operación',
  404: 'La ruta solicitada no existe',
  413: 'El archivo supera el tamaño permitido (2 MB)',
};

/** Mensajes genéricos de NestJS, Express y Multer que se reemplazan por uno en español. */
const GENERICO =
  /^(Unauthorized|Forbidden|Not Found|Bad Request|Payload Too Large|File too large|Cannot (GET|POST|PUT|PATCH|DELETE) .*)$/;

/**
 * Red de seguridad: una restricción UNIQUE de PostgreSQL (código 23505) que ningún caso de uso anticipó,
 * por ejemplo dos solicitudes simultáneas. Se reconoce por el código, sin importar TypeORM en esta capa.
 */
function esRegistroDuplicado(error: unknown): boolean {
  const driver = (error as { driverError?: { code?: string } } | null)?.driverError;
  return driver?.code === '23505';
}

/**
 * Traduce cualquier error a ErrorRespuesta: errores del dominio (404, 409, 422, 403, 401),
 * errores HTTP de NestJS (400 de validación, 401, 403, 404, 413) y errores inesperados (500, sin detalles internos).
 */
@Catch()
export class FiltroErrores implements ExceptionFilter {
  private readonly log = new Logger('Errores');

  catch(error: unknown, host: ArgumentsHost): void {
    const cuerpo = this.traducir(error);
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(cuerpo.estado)
      .json(cuerpo);
  }

  traducir(error: unknown): ErrorRespuesta {
    if (error instanceof ErrorDominio) {
      return {
        estado: ESTADO_DOMINIO[error.tipo],
        error: error.name,
        mensaje: error.message,
      };
    }
    if (error instanceof HttpException) {
      const estado = error.getStatus();
      const respuesta = error.getResponse();
      const mensaje =
        typeof respuesta === 'string'
          ? respuesta
          : (respuesta as { message?: string | string[] }).message;
      const base = { estado, error: NOMBRE_HTTP[estado] ?? 'ErrorHttp' };
      if (Array.isArray(mensaje)) {
        return {
          ...base,
          mensaje: MENSAJE_HTTP[400],
          detalles: mensaje.map(traducirMensaje),
        };
      }
      if (mensaje?.startsWith('Validation failed')) {
        return {
          ...base,
          mensaje: 'Un parámetro de la ruta no tiene un valor válido',
          detalles: [mensaje],
        };
      }
      const propio = mensaje && !GENERICO.test(mensaje) ? mensaje : undefined;
      return {
        ...base,
        mensaje:
          propio ?? MENSAJE_HTTP[estado] ?? 'No se pudo atender la solicitud',
      };
    }
    if (esRegistroDuplicado(error)) {
      return { estado: 409, error: 'RegistroDuplicado', mensaje: 'El registro ya existe' };
    }
    this.log.error(
      error instanceof Error ? (error.stack ?? error.message) : String(error),
    );
    return {
      estado: 500,
      error: 'ErrorInterno',
      mensaje: 'Error interno del servidor. Intente nuevamente.',
    };
  }
}
