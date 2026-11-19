import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RepositorioPostulantes } from '../dominio/contratos';
import { Postulante } from '../dominio/postulante';
import { PostulanteOrmEntity } from './postulante.orm-entity';

@Injectable()
export class RepositorioPostulantesTypeOrm implements RepositorioPostulantes {
  constructor(@InjectRepository(PostulanteOrmEntity) private readonly orm: Repository<PostulanteOrmEntity>) {}

  existeDni(dni: string): Promise<boolean> {
    return this.orm.existsBy({ dni });
  }

  async crear(datos: Omit<Postulante, 'id' | 'nombreCompleto'>): Promise<Postulante> {
    return (await this.orm.save(this.orm.create(datos))).aDominio();
  }

  async buscarPorId(id: number): Promise<Postulante | null> {
    return (await this.orm.findOneBy({ id }))?.aDominio() ?? null;
  }
}
