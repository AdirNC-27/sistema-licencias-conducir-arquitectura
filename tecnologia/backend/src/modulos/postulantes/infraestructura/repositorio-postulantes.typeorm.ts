import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
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

  async buscarVarios(ids: number[]): Promise<Postulante[]> {
    if (ids.length === 0) return [];
    return (await this.orm.findBy({ id: In(ids) })).map((f) => f.aDominio());
  }
}
