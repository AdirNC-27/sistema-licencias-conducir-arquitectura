import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rol, UsuarioActual } from '../../../compartido/dominio/rol';
import { Roles, Usuario } from '../../../compartido/seguridad/decoradores';
import { NotificacionOrmEntity } from '../infraestructura/notificacion.orm-entity';

@ApiTags('Notificaciones')
@ApiBearerAuth()
@Controller('notificaciones')
export class NotificacionesController {
  constructor(@InjectRepository(NotificacionOrmEntity) private readonly orm: Repository<NotificacionOrmEntity>) {}

  @Get('mias')
  @Roles(Rol.POSTULANTE)
  @ApiOperation({ summary: 'Avisos del postulante (RF13)' })
  mias(@Usuario() usuario: UsuarioActual) {
    return this.orm.find({ where: { postulanteId: usuario.postulanteId ?? -1 }, order: { id: 'DESC' }, take: 50 });
  }
}
