import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

/** Configuración común para main.ts y para las pruebas de la API. */
export function configurarAplicacion(app: INestApplication): INestApplication {
  app.setGlobalPrefix('api');
  // EQ-01 · encabezados de seguridad (hallazgos de OWASP ZAP): no revelar el framework y no adivinar tipos de contenido
  (app.getHttpAdapter().getInstance() as { disable?: (opcion: string) => void }).disable?.('x-powered-by');
  app.use((_peticion: unknown, respuesta: { setHeader: (nombre: string, valor: string) => void }, siguiente: () => void) => {
    respuesta.setHeader('X-Content-Type-Options', 'nosniff');
    siguiente();
  });
  const origenes = process.env.CORS_ORIGENES?.split(',').map((o) => o.trim()).filter(Boolean);
  app.enableCors({ origin: origenes?.length ? origenes : true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  return app;
}

/** Contrato OpenAPI generado desde los decoradores @Contrato de los controladores. */
export function crearDocumentoOpenApi(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('API · Sistema de Licencias de Conducir Clase B')
    .setDescription(
      'Municipalidad Provincial de Huamanga. Monolito modular con Clean Architecture (NestJS + PostgreSQL). ' +
        'Inicie sesión en POST /api/auth/login y pulse "Authorize" con el token. ' +
        'Cuentas de demostración: gestor, evaluador, supervisor, admin y el DNI 45892014 (clave demo123). ' +
        'Todos los errores usan el esquema ErrorRespuesta.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  return SwaggerModule.createDocument(app, config);
}

export function configurarSwagger(app: INestApplication): void {
  SwaggerModule.setup('api/docs', app, crearDocumentoOpenApi(app), {
    jsonDocumentUrl: 'api/docs-json',
    swaggerOptions: { persistAuthorization: true },
  });
}
