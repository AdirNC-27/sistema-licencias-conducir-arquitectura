import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostulantesModule } from '../postulantes/postulantes.module';
import { NotificarListener } from './aplicacion/notificar.listener';
import { REPOSITORIO_AVISOS, SERVICIO_NOTIFICACIONES } from './dominio/servicio-notificaciones';
import { RepositorioAvisosTypeOrm } from './infraestructura/repositorio-avisos.typeorm';
import { NotificacionOrmEntity } from './infraestructura/notificacion.orm-entity';
import { NotificadorBrevo } from './infraestructura/notificador-brevo';
import { NotificadorCorreo } from './infraestructura/notificador-correo';
import { NotificacionesController } from './presentacion/notificaciones.controller';

@Module({
  imports: [TypeOrmModule.forFeature([NotificacionOrmEntity]), PostulantesModule],
  controllers: [NotificacionesController],
  providers: [
    NotificarListener,
    // Proveedor de correo (EQ-06): CORREO_PROVEEDOR=brevo usa la API de Brevo; si no, SMTP con Nodemailer.
    {
      provide: SERVICIO_NOTIFICACIONES,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => (config.get('CORREO_PROVEEDOR') === 'brevo' ? new NotificadorBrevo(config) : new NotificadorCorreo(config)),
    },
    { provide: REPOSITORIO_AVISOS, useClass: RepositorioAvisosTypeOrm },
  ],
})
export class NotificacionesModule {}
