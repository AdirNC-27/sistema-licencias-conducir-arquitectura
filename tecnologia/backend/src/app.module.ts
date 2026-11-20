import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FiltroErrores } from './compartido/presentacion/filtro-errores';
import { GuardaJwt, GuardaRoles } from './compartido/seguridad/guardas';
import { opcionesBaseDeDatos } from './configuracion/base-de-datos';
import { AuditoriaModule } from './modulos/auditoria/auditoria.module';
import { CitasModule } from './modulos/citas/citas.module';
import { DocumentosModule } from './modulos/documentos/documentos.module';
import { EvaluacionesModule } from './modulos/evaluaciones/evaluaciones.module';
import { ExpedientesModule } from './modulos/expedientes/expedientes.module';
import { IdentidadModule } from './modulos/identidad/identidad.module';
import { NotificacionesModule } from './modulos/notificaciones/notificaciones.module';
import { PagosModule } from './modulos/pagos/pagos.module';
import { PostulantesModule } from './modulos/postulantes/postulantes.module';
import { RequisitosModule } from './modulos/requisitos/requisitos.module';
import { SaludModule } from './modulos/salud/salud.module';

/** Monolito modular (ADR-001): un solo despliegue con módulos independientes. */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({ useFactory: () => ({ ...opcionesBaseDeDatos(), migrationsRun: true }) }),
    CacheModule.register({ isGlobal: true }), // caché en memoria dentro del monolito (ADR-009)
    EventEmitterModule.forRoot(),
    IdentidadModule,
    PostulantesModule,
    RequisitosModule,
    ExpedientesModule,
    DocumentosModule,
    PagosModule,
    CitasModule,
    EvaluacionesModule,
    NotificacionesModule,
    AuditoriaModule,
    SaludModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: GuardaJwt },
    { provide: APP_GUARD, useClass: GuardaRoles },
    { provide: APP_FILTER, useClass: FiltroErrores },
  ],
})
export class AppModule {}
