import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Cache } from 'cache-manager';
import { IsNull, Repository } from 'typeorm';
import { Categoria, TipoTramite } from '../../../compartido/dominio/categoria';
import { RepositorioRequisitos, Requisito } from '../dominio/requisito';
import { RequisitoOrmEntity } from './requisito.orm-entity';

@Injectable()
export class RepositorioRequisitosTypeOrm implements RepositorioRequisitos {
  constructor(@InjectRepository(RequisitoOrmEntity) private readonly orm: Repository<RequisitoOrmEntity>) {}

  listar(tipoTramite: TipoTramite, categoria: Categoria): Promise<Requisito[]> {
    return this.orm.find({
      where: [
        { tipoTramite, categoria },
        { tipoTramite, categoria: IsNull() },
      ],
      order: { orden: 'ASC' },
    });
  }
}

export const TTL_REQUISITOS_MS = 10 * 60 * 1000;

/**
 * Patrón Decorator (ADR-009): envuelve al repositorio real y guarda el resultado en memoria.
 * Solo se cachea información pública; nunca datos personales.
 */
@Injectable()
export class RepositorioRequisitosCacheado implements RepositorioRequisitos {
  constructor(
    private readonly real: RepositorioRequisitosTypeOrm,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async listar(tipoTramite: TipoTramite, categoria: Categoria): Promise<Requisito[]> {
    const clave = `requisitos:${tipoTramite}:${categoria}`;
    const guardado = await this.cache.get<Requisito[]>(clave);
    if (guardado) return guardado;
    const requisitos = await this.real.listar(tipoTramite, categoria);
    await this.cache.set(clave, requisitos, TTL_REQUISITOS_MS);
    return requisitos;
  }
}
