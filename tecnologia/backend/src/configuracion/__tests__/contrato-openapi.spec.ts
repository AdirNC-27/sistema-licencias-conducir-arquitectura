import { existsSync, readFileSync } from 'fs';
import { OpenAPIObject } from '@nestjs/swagger';
import type { OperationObject, PathItemObject, ResponseObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { ARCHIVO_CONTRATO, generarContrato, serializarContrato } from '../contrato-openapi';

/**
 * Reglas del contrato de la API (Guía 05): cada operación declara su respuesta exitosa con esquema
 * y los errores que puede devolver, todos con el mismo formato. Si alguien agrega un endpoint sin
 * documentarlo, o cambia uno sin actualizar docs/07-contrato-api/openapi.json, esta prueba falla.
 */
interface Operacion {
  ruta: string;
  metodo: string;
  op: OperationObject;
}

const METODOS = ['get', 'post', 'put', 'patch', 'delete'] as const;
const ERROR_RESPUESTA = '#/components/schemas/ErrorRespuesta';

const respuestas = (o: Operacion) => Object.entries(o.op.responses) as [string, ResponseObject][];
const tiene = (o: Operacion, codigo: string) => codigo in o.op.responses;
const esProtegida = (o: Operacion) => (o.op.security?.length ?? 0) > 0;
const nombre = (o: Operacion) => `${o.metodo} ${o.ruta}`;

describe('Contrato OpenAPI', () => {
  let contrato: OpenAPIObject;
  let operaciones: Operacion[];
  const incumplen = (regla: (o: Operacion) => boolean) => operaciones.filter((o) => !regla(o)).map(nombre);

  beforeAll(async () => {
    contrato = await generarContrato();
    operaciones = Object.entries(contrato.paths as Record<string, PathItemObject>)
      .filter(([ruta]) => ruta !== '/api/health') // la genera @nestjs/terminus con su propio formato
      .flatMap(([ruta, item]) =>
        METODOS.filter((m) => item[m]).map((m) => ({ ruta, metodo: m.toUpperCase(), op: item[m] as OperationObject })),
      );
  }, 30_000);

  it('documenta las 31 operaciones de negocio', () => {
    expect(operaciones).toHaveLength(31);
  });

  it('cada operación tiene un resumen', () => {
    expect(incumplen((o) => Boolean(o.op.summary?.trim()))).toEqual([]);
  });

  it('cada operación declara una sola respuesta exitosa, con esquema', () => {
    expect(
      incumplen((o) => {
        const exitos = respuestas(o).filter(([codigo]) => codigo.startsWith('2'));
        const contenido = Object.values(exitos[0]?.[1].content ?? {});
        return exitos.length === 1 && contenido.length > 0 && contenido.every((c) => Boolean(c.schema));
      }),
    ).toEqual([]);
  });

  it('todos los errores usan el esquema ErrorRespuesta en JSON', () => {
    expect(
      incumplen((o) =>
        respuestas(o)
          .filter(([codigo]) => Number(codigo) >= 400)
          .every(([, r]) => {
            const esquema = r.content?.['application/json']?.schema as { $ref?: string } | undefined;
            return esquema?.$ref === ERROR_RESPUESTA;
          }),
      ),
    ).toEqual([]);
  });

  it('las operaciones protegidas exigen token y documentan el 401', () => {
    const protegidas = operaciones.filter(esProtegida);
    expect(protegidas.length).toBe(28);
    expect(protegidas.filter((o) => !tiene(o, '401')).map(nombre)).toEqual([]);
  });

  it('solo login, registro y requisitos son públicos', () => {
    expect(incumplen(esProtegida)).toEqual(['POST /api/auth/login', 'POST /api/postulantes', 'GET /api/requisitos']);
  });

  it('las operaciones con identificador en la ruta documentan 400 y 404', () => {
    expect(incumplen((o) => !o.ruta.includes('{id}') || (tiene(o, '400') && tiene(o, '404')))).toEqual([]);
  });

  it('las operaciones con cuerpo documentan el 400 de validación', () => {
    expect(incumplen((o) => !o.op.requestBody || tiene(o, '400'))).toEqual([]);
  });

  it('el archivo docs/07-contrato-api/openapi.json coincide con el código (si falla, ejecute "npm run contrato")', () => {
    expect(existsSync(ARCHIVO_CONTRATO)).toBe(true);
    expect(readFileSync(ARCHIVO_CONTRATO, 'utf8')).toBe(serializarContrato(contrato));
  });
});
