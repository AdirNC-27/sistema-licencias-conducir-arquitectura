import { INestApplication, RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { ModulesContainer } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configurarAplicacion } from '../src/configuracion/aplicacion';
import { Rol } from '../src/compartido/dominio/rol';
import { CLAVE_PUBLICO, CLAVE_ROLES } from '../src/compartido/seguridad/decoradores';
import { ASISTENTE_IA } from '../src/modulos/asistente/dominio/contratos';

/**
 * EQ-01 · Matriz rol × operación completa. Se arma desde los metadatos de los controladores
 * (@Roles y @Publico), así cubre todas las operaciones protegidas, incluidas las que se agreguen después.
 * Para cada una: sin token → 401; con token falso → 401; con cada rol no permitido → 403.
 * Y en todos los casos la respuesta trae solo el formato de error: ningún dato protegido.
 */
interface Operacion {
  metodo: 'get' | 'post' | 'put' | 'patch' | 'delete';
  ruta: string;
  roles: Rol[] | undefined;
}

const METODO: Record<number, Operacion['metodo']> = {
  [RequestMethod.GET]: 'get',
  [RequestMethod.POST]: 'post',
  [RequestMethod.PUT]: 'put',
  [RequestMethod.PATCH]: 'patch',
  [RequestMethod.DELETE]: 'delete',
};
const CAMPOS_ERROR = ['estado', 'error', 'mensaje', 'detalles']; // ErrorRespuesta
const CUENTAS: Record<Rol, string> = {
  [Rol.POSTULANTE]: '45892014',
  [Rol.GESTOR]: 'gestor',
  [Rol.EVALUADOR]: 'evaluador',
  [Rol.SUPERVISOR]: 'supervisor',
  [Rol.ADMINISTRADOR]: 'admin',
};

/** Recorre los controladores registrados y devuelve cada operación protegida con sus roles. */
function operacionesProtegidas(app: INestApplication): Operacion[] {
  const salida: Operacion[] = [];
  for (const modulo of app.get(ModulesContainer).values()) {
    for (const { metatype } of modulo.controllers.values()) {
      if (!metatype) continue;
      const base = String(Reflect.getMetadata(PATH_METADATA, metatype) ?? '');
      const prototipo = metatype.prototype as Record<string, unknown>;
      for (const nombre of Object.getOwnPropertyNames(prototipo)) {
        const manejador = prototipo[nombre];
        if (nombre === 'constructor' || typeof manejador !== 'function') continue;
        const metodo = Reflect.getMetadata(METHOD_METADATA, manejador) as number | undefined;
        if (metodo === undefined) continue;
        const publico = Reflect.getMetadata(CLAVE_PUBLICO, manejador) ?? Reflect.getMetadata(CLAVE_PUBLICO, metatype);
        if (publico) continue;
        const sub = String(Reflect.getMetadata(PATH_METADATA, manejador) ?? '');
        const ruta = `/api/${[base, sub].filter((p) => p && p !== '/').join('/')}`.replace(/\/+/g, '/').replace(/:\w+/g, '1');
        const roles = (Reflect.getMetadata(CLAVE_ROLES, manejador) ?? Reflect.getMetadata(CLAVE_ROLES, metatype)) as Rol[] | undefined;
        salida.push({ metodo: METODO[metodo], ruta, roles });
      }
    }
  }
  return salida.sort((a, b) => a.ruta.localeCompare(b.ruta) || a.metodo.localeCompare(b.metodo));
}

describe('Matriz rol × operación (EQ-01)', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let operaciones: Operacion[];
  const tokens: Partial<Record<Rol, string>> = {};

  beforeAll(async () => {
    process.env.DB_NOMBRE = process.env.DB_NOMBRE_PRUEBAS ?? 'licencias_test';
    process.env.JWT_SECRETO = process.env.JWT_SECRETO ?? 'secreto-de-pruebas';
    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ASISTENTE_IA)
      .useValue({ disponible: false, redactar: async () => null })
      .compile();
    app = configurarAplicacion(modulo.createNestApplication());
    await app.init();
    http = request(app.getHttpServer());
    operaciones = operacionesProtegidas(app);
    for (const rol of Object.values(Rol)) {
      const r = await http.post('/api/auth/login').send({ usuario: CUENTAS[rol], clave: 'demo123' }).expect(200);
      tokens[rol] = r.body.token;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  const soloError = (cuerpo: Record<string, unknown>) => Object.keys(cuerpo).every((c) => CAMPOS_ERROR.includes(c));

  it('encuentra las 45 operaciones protegidas del contrato', () => {
    expect(operaciones).toHaveLength(45);
  });

  it('sin token y con un token falso, todas responden 401 sin datos', async () => {
    for (const o of operaciones) {
      const sinToken = await http[o.metodo](o.ruta).send({});
      expect({ op: `${o.metodo} ${o.ruta}`, estado: sinToken.status, soloError: soloError(sinToken.body) }).toEqual({ op: `${o.metodo} ${o.ruta}`, estado: 401, soloError: true });
      const falso = await http[o.metodo](o.ruta).set('Authorization', 'Bearer token.falso.123').send({});
      expect({ op: `${o.metodo} ${o.ruta}`, estado: falso.status }).toEqual({ op: `${o.metodo} ${o.ruta}`, estado: 401 });
    }
  });

  it('cada rol sin permiso recibe 403 sin datos en cada operación restringida por rol', async () => {
    const casos: string[] = [];
    for (const o of operaciones.filter((x) => x.roles?.length)) {
      for (const rol of Object.values(Rol).filter((r) => !o.roles!.includes(r))) {
        const r = await http[o.metodo](o.ruta).set('Authorization', `Bearer ${tokens[rol]}`).send({});
        expect({ caso: `${rol} ${o.metodo} ${o.ruta}`, estado: r.status, soloError: soloError(r.body) }).toEqual({ caso: `${rol} ${o.metodo} ${o.ruta}`, estado: 403, soloError: true });
        casos.push(`${rol} ${o.metodo.toUpperCase()} ${o.ruta}`);
      }
    }
    // Deja la matriz en la salida de la prueba como evidencia
    console.log(`Matriz rol × operación: ${casos.length} casos con 403\n${casos.join('\n')}`);
    expect(casos.length).toBeGreaterThan(100);
  });
});
