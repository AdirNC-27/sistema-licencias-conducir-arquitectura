import { applyDecorators, HttpCode, Type } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ErrorRespuesta } from './filtro-errores';

/** Solo la respuesta exitosa es el archivo; los errores siguen siendo JSON. */
const TIPOS_ARCHIVO = ['application/pdf', 'image/jpeg', 'image/png'];

export type CodigoError = 400 | 401 | 403 | 404 | 409 | 413 | 422;

const DESCRIPCION_ERROR: Record<CodigoError, string> = {
  400: 'Datos de entrada inválidos (ver "detalles")',
  401: 'Falta el token, no es válido o expiró',
  403: 'Su rol no tiene permiso para esta operación',
  404: 'El recurso no existe',
  409: 'La operación no es posible en el estado actual',
  413: 'El archivo supera 2 MB',
  422: 'No cumple una regla del trámite',
};

export interface OpcionesContrato {
  resumen: string;
  descripcion?: string;
  exito: {
    estado?: 200 | 201;
    descripcion: string;
    /** Clase de respuesta documentada; se omite solo en descargas de archivo. */
    tipo?: Type<unknown>;
    lista?: boolean;
    /** La respuesta es el archivo (PDF, JPG o PNG), no JSON. */
    archivo?: boolean;
  };
  /** Errores que la operación puede devolver. Un código solo usa la descripción por defecto; [código, texto] la reemplaza. */
  errores?: (CodigoError | [CodigoError, string])[];
  /** Operación sin token (login, registro, requisitos). Si no es pública se agrega 401. */
  publico?: boolean;
}

/**
 * Contrato OpenAPI de una operación en un solo decorador: resumen, respuesta exitosa con su esquema
 * y cada error con el formato ErrorRespuesta. Fija también el código HTTP de éxito, para que
 * la documentación y la implementación no puedan diferir.
 */
export function Contrato(o: OpcionesContrato) {
  const estado = o.exito.estado ?? 200;
  const errores = new Map<CodigoError, string>();
  if (!o.publico) errores.set(401, DESCRIPCION_ERROR[401]);
  for (const e of o.errores ?? []) {
    const [codigo, texto] = Array.isArray(e) ? e : [e, DESCRIPCION_ERROR[e]];
    errores.set(codigo, texto);
  }
  const exito = o.exito.archivo
    ? [
        ApiResponse({
          status: estado,
          description: o.exito.descripcion,
          content: Object.fromEntries(
            TIPOS_ARCHIVO.map((t) => [
              t,
              { schema: { type: 'string', format: 'binary' } },
            ]),
          ),
        }),
      ]
    : [
        ApiResponse({
          status: estado,
          description: o.exito.descripcion,
          type: o.exito.tipo,
          isArray: o.exito.lista,
        }),
      ];
  return applyDecorators(
    ApiOperation({ summary: o.resumen, description: o.descripcion }),
    HttpCode(estado),
    ...exito,
    ...[...errores.entries()]
      .sort(([a], [b]) => a - b)
      .map(([status, description]) =>
        ApiResponse({ status, description, type: ErrorRespuesta }),
      ),
  );
}
