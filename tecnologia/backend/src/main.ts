import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configurarAplicacion, configurarSwagger } from './configuracion/aplicacion';

async function iniciar() {
  const app = configurarAplicacion(await NestFactory.create(AppModule));
  configurarSwagger(app);
  const puerto = Number(process.env.PUERTO ?? 3000);
  await app.listen(puerto);
  console.log(`API en http://localhost:${puerto}/api · Swagger en http://localhost:${puerto}/api/docs`);
}
void iniciar();
