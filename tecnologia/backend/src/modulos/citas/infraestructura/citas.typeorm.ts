import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Check, Column, CreateDateColumn, Entity, Index, MoreThanOrEqual, PrimaryGeneratedColumn, Repository } from 'typeorm';
import { RecursoNoEncontradoError } from '../../../compartido/dominio/errores';
import { Cita, RepositorioCitas } from '../dominio/contratos';
import { Cupo, TipoExamen } from '../dominio/cupo';

@Entity('cupos')
@Index('ux_cupos_fecha_hora_tipo', ['fecha', 'hora', 'tipo'], { unique: true })
@Check('ck_cupos_ocupados', '"ocupados" >= 0 AND "ocupados" <= "capacidad"')
export class CupoOrmEntity {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ type: 'date' }) fecha!: string;
  @Column({ length: 5 }) hora!: string;
  @Column({ type: 'enum', enum: TipoExamen }) tipo!: TipoExamen;
  @Column() capacidad!: number;
  @Column({ default: 0 }) ocupados!: number;

  aDominio(): Cupo {
    return new Cupo(this.id, new Date(`${this.fecha}T00:00:00Z`), this.hora, this.tipo, this.capacidad, this.ocupados);
  }
}

@Entity('citas')
export class CitaOrmEntity {
  @PrimaryGeneratedColumn() id!: number;
  @Index() @Column({ name: 'expediente_id' }) expedienteId!: number;
  @Index() @Column({ name: 'cupo_id' }) cupoId!: number;
  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' }) creadoEn!: Date;
}

@Injectable()
export class RepositorioCitasTypeOrm implements RepositorioCitas {
  constructor(
    @InjectRepository(CupoOrmEntity) private readonly cupos: Repository<CupoOrmEntity>,
    @InjectRepository(CitaOrmEntity) private readonly citas: Repository<CitaOrmEntity>,
  ) {}

  async crearCupo(datos: { fecha: Date; hora: string; tipo: TipoExamen; capacidad: number }): Promise<Cupo> {
    const fila = await this.cupos.save(this.cupos.create({ ...datos, fecha: datos.fecha.toISOString().slice(0, 10), ocupados: 0 }));
    return fila.aDominio();
  }

  async buscarCupo(id: number): Promise<Cupo> {
    const fila = await this.cupos.findOneBy({ id });
    if (!fila) throw new RecursoNoEncontradoError(`No existe el cupo ${id}`);
    return fila.aDominio();
  }

  async listarCupos(tipo: TipoExamen, desde: Date): Promise<Cupo[]> {
    const filas = await this.cupos.find({ where: { tipo, fecha: MoreThanOrEqual(desde.toISOString().slice(0, 10)) }, order: { fecha: 'ASC', hora: 'ASC' }, take: 60 });
    return filas.map((f) => f.aDominio());
  }

  /** UPDATE condicional: dos personas no pueden tomar el último cupo a la vez. */
  async reservar(cupoId: number, expedienteId: number): Promise<Cita | null> {
    return this.cupos.manager.transaction(async (tx) => {
      const resultado = await tx
        .createQueryBuilder()
        .update(CupoOrmEntity)
        .set({ ocupados: () => 'ocupados + 1' })
        .where('id = :cupoId AND ocupados < capacidad', { cupoId })
        .execute();
      if (!resultado.affected) return null;
      const cupo = await tx.findOneByOrFail(CupoOrmEntity, { id: cupoId });
      const cita = await tx.save(tx.create(CitaOrmEntity, { cupoId, expedienteId }));
      return { id: cita.id, expedienteId, cupoId, tipo: cupo.tipo, fecha: new Date(`${cupo.fecha}T00:00:00Z`), hora: cupo.hora };
    });
  }

  async citasDeExpediente(expedienteId: number): Promise<Cita[]> {
    const filas = await this.citas
      .createQueryBuilder('c')
      .innerJoin(CupoOrmEntity, 'u', 'u.id = c.cupo_id')
      .select(['c.id AS id', 'c.expediente_id AS "expedienteId"', 'c.cupo_id AS "cupoId"', 'u.tipo AS tipo', 'u.fecha AS fecha', 'u.hora AS hora'])
      .where('c.expediente_id = :expedienteId', { expedienteId })
      .getRawMany<{ id: number; expedienteId: number; cupoId: number; tipo: TipoExamen; fecha: string | Date; hora: string }>();
    return filas.map((f) => ({ ...f, fecha: new Date(f.fecha) }));
  }
}
