import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/** Configuración común para main.ts y para las pruebas de la API. */
export function configurarAplicacion(app: INestApplication): INestApplication {
  app.setGlobalPrefix('api');
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  return app;
}

export function configurarSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('API · Sistema de Licencias de Conducir Clase B')
    .setDescription(
      'Municipalidad Provincial de Huamanga. Monolito modular con Clean Architecture (NestJS + PostgreSQL). ' +
        'Inicie sesión en POST /api/auth/login y pulse "Authorize" con el token. ' +
        'Cuentas de demostración: gestor, evaluador, supervisor, admin y el DNI 45892014 (clave demo123).',
    )
    .setVersion('1.0 · Sprint 2')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config), {
    jsonDocumentUrl: 'api/docs-json',
    swaggerOptions: { persistAuthorization: true },
  });
}
