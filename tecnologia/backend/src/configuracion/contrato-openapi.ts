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

/** Guía del contrato: su tabla de operaciones se genera desde el mismo documento OpenAPI. */
export const GUIA_CONTRATO = join(ARCHIVO_CONTRATO, '..', 'README.md');
const INICIO_TABLA = '<!-- operaciones:inicio (generado por "npm run contrato"; no editar a mano) -->';
const FIN_TABLA = '<!-- operaciones:fin -->';
const METODOS_HTTP = ['get', 'post', 'put', 'patch', 'delete'] as const;

interface FilaOperacion {
  recurso: string;
  metodo: string;
  ruta: string;
  resumen: string;
  exito: string;
  errores: string;
  publica: boolean;
}

function filasDeOperaciones(documento: OpenAPIObject): FilaOperacion[] {
  return Object.entries(documento.paths).flatMap(([ruta, item]) =>
    METODOS_HTTP.filter((m) => item[m]).map((m) => {
      const op = item[m]!;
      const codigos = Object.keys(op.responses);
      return {
        recurso: op.tags?.[0] ?? '',
        metodo: m.toUpperCase(),
        ruta: ruta.replace(/^\/api/, ''),
        resumen: op.summary ?? '',
        exito: codigos.filter((c) => c.startsWith('2')).join(' '),
        errores: codigos.filter((c) => !c.startsWith('2')).join(' '),
        publica: !(op.security?.length ?? 0),
      };
    }),
  );
}

/** Resumen y tabla de operaciones en Markdown, con los conteos tomados del contrato. */
export function tablaOperaciones(documento: OpenAPIObject): string {
  const filas = filasDeOperaciones(documento);
  const rutas = Object.keys(documento.paths).length;
  const publicas = filas.filter((f) => f.publica).length;
  const negocio = filas.filter((f) => f.ruta !== '/health').length;
  return [
    INICIO_TABLA,
    '',
    `**${rutas} rutas y ${filas.length} operaciones**: ${negocio} de negocio declaradas con \`@Contrato\` más \`GET /health\`, que genera \`@nestjs/terminus\`. ` +
      `${publicas} son públicas y ${filas.length - publicas} exigen token.`,
    '',
    '| Recurso | Método | Ruta | Operación | Éxito | Errores | Acceso |',
    '|---|---|---|---|---|---|---|',
    ...filas.map(
      (f) => `| ${f.recurso} | ${f.metodo} | \`${f.ruta}\` | ${f.resumen} | ${f.exito} | ${f.errores} | ${f.publica ? 'Pública' : 'Token'} |`,
    ),
    '',
    FIN_TABLA,
  ].join('\n');
}

/** Devuelve la guía con la tabla de operaciones actualizada (null si faltan los marcadores). */
export function guiaConTabla(guia: string, documento: OpenAPIObject): string | null {
  const inicio = guia.indexOf('<!-- operaciones:inicio');
  const fin = guia.indexOf(FIN_TABLA);
  if (inicio < 0 || fin < 0) return null;
  return guia.slice(0, inicio) + tablaOperaciones(documento) + guia.slice(fin + FIN_TABLA.length);
}
