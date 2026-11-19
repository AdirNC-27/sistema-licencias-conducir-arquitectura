import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Categoria, TipoTramite } from '../../../compartido/dominio/categoria';
import { RecursoNoEncontradoError } from '../../../compartido/dominio/errores';
import { FiltroExpedientes, RepositorioExpedientes } from '../dominio/contratos';
import { Etapa } from '../dominio/etapa';
import { Expediente } from '../dominio/expediente';
import { ExpedienteOrmEntity } from './expediente.orm-entity';

@Injectable()
export class RepositorioExpedientesTypeOrm implements RepositorioExpedientes {
  constructor(@InjectRepository(ExpedienteOrmEntity) private readonly orm: Repository<ExpedienteOrmEntity>) {}

  async crear(datos: { postulanteId: number; tipoTramite: TipoTramite; categoria: Categoria }): Promise<Expediente> {
    return this.orm.manager.transaction(async (tx) => {
      const fila = await tx.save(
        tx.create(ExpedienteOrmEntity, { ...datos, etapa: Etapa.DOCUMENTOS, numero: `TMP-${Date.now()}-${Math.random()}`.slice(0, 20) }),
      );
      fila.numero = `EXP-${new Date().getFullYear()}-${String(fila.id).padStart(5, '0')}`;
      await tx.update(ExpedienteOrmEntity, { id: fila.id }, { numero: fila.numero });
      return fila.aDominio();
    });
  }

  async buscarPorId(id: number): Promise<Expediente> {
    const fila = await this.orm.findOneBy({ id });
    if (!fila) throw new RecursoNoEncontradoError(`No existe el expediente ${id}`);
    return fila.aDominio();
  }

  async listar(filtro: FiltroExpedientes): Promise<{ total: number; datos: Expediente[] }> {
    const [filas, total] = await this.orm.findAndCount({
      where: { ...(filtro.etapa ? { etapa: filtro.etapa } : {}), ...(filtro.categoria ? { categoria: filtro.categoria } : {}) },
      order: { creadoEn: 'ASC' },
      skip: (filtro.pagina - 1) * filtro.tamano,
      take: filtro.tamano,
    });
    return { total, datos: filas.map((f) => f.aDominio()) };
  }

  async listarDePostulante(postulanteId: number): Promise<Expediente[]> {
    return (await this.orm.find({ where: { postulanteId }, order: { creadoEn: 'DESC' } })).map((f) => f.aDominio());
  }

  async guardarEtapa(expediente: Expediente): Promise<void> {
    await this.orm.update({ id: expediente.id }, { etapa: expediente.etapa });
  }

  async tieneTramiteActivo(postulanteId: number): Promise<boolean> {
    return this.orm.existsBy({ postulanteId, etapa: Not(Etapa.EMITIDA) });
  }
}
