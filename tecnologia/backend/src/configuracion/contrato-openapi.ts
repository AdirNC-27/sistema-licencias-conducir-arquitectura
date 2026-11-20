import { NestFactory } from '@nestjs/core';
import { OpenAPIObject } from '@nestjs/swagger';
import { join } from 'path';
import { AppModule } from '../app.module';
import { configurarAplicacion, crearDocumentoOpenApi } from './aplicacion';

/** Archivo versionado con el contrato de la API (docs/07-contrato-api/openapi.json). */
export const ARCHIVO_CONTRATO = join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  'docs',
  '07-contrato-api',
  'openapi.json',
);

/**
 * Genera el contrato sin conectarse a PostgreSQL: el modo "preview" de NestJS arma los módulos
 * y los controladores, pero no instancia proveedores ni abre conexiones.
 */
export async function generarContrato(): Promise<OpenAPIObject> {
  const app = configurarAplicacion(
    await NestFactory.create(AppModule, { preview: true, logger: false }),
  );
  const documento = crearDocumentoOpenApi(app);
  await app.close();
  return documento;
}

export const serializarContrato = (documento: OpenAPIObject) =>
  `${JSON.stringify(documento, null, 2)}\n`;
