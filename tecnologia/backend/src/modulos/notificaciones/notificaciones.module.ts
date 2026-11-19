import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostulantesModule } from '../postulantes/postulantes.module';
import { NotificarListener } from './aplicacion/notificar.listener';
import { REPOSITORIO_AVISOS, SERVICIO_NOTIFICACIONES } from './dominio/servicio-notificaciones';
import { RepositorioAvisosTypeOrm } from './infraestructura/repositorio-avisos.typeorm';
import { NotificacionOrmEntity } from './infraestructura/notificacion.orm-entity';
import { NotificadorCorreo } from './infraestructura/notificador-correo';
import { NotificacionesController } from './presentacion/notificaciones.controller';

@Module({
  imports: [TypeOrmModule.forFeature([NotificacionOrmEntity]), PostulantesModule],
  controllers: [NotificacionesController],
  providers: [
    NotificarListener,
    { provide: SERVICIO_NOTIFICACIONES, useClass: NotificadorCorreo }, // cambiar de proveedor = cambiar esta línea (EQ-06)
    { provide: REPOSITORIO_AVISOS, useClass: RepositorioAvisosTypeOrm },
  ],
})
export class NotificacionesModule {}
