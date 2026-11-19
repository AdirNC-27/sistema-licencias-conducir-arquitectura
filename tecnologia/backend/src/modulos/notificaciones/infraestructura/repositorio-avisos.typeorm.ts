import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Aviso, RepositorioAvisos } from '../dominio/servicio-notificaciones';
import { NotificacionOrmEntity } from './notificacion.orm-entity';

@Injectable()
export class RepositorioAvisosTypeOrm implements RepositorioAvisos {
  constructor(@InjectRepository(NotificacionOrmEntity) private readonly orm: Repository<NotificacionOrmEntity>) {}

  async guardar(aviso: Aviso): Promise<void> {
    await this.orm.insert(aviso);
  }
}
