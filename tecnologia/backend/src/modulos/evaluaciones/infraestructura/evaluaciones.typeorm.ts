import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Column, Entity, Index, PrimaryGeneratedColumn, Repository, UpdateDateColumn, VersionColumn } from 'typeorm';
import { RecursoNoEncontradoError } from '../../../compartido/dominio/errores';
import { RepositorioEvaluaciones } from '../dominio/contratos/contratos';
import { Evaluacion } from '../dominio/modelo/evaluacion';
import { EstadoResultado, IntentoValidado, Resultado, TipoEvaluacion } from '../dominio/modelo/tipos';

@Entity('evaluaciones')
@Index('ux_evaluaciones_expediente_tipo', ['expedienteId', 'tipo'], { unique: true })
export class EvaluacionOrmEntity {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ name: 'expediente_id' }) expedienteId!: number;
  @Column({ type: 'enum', enum: TipoEvaluacion }) tipo!: TipoEvaluacion;
  @Column({ type: 'enum', enum: EstadoResultado, default: EstadoResultado.PENDIENTE }) estado!: EstadoResultado;
  @Column({ type: 'jsonb', nullable: true }) resultado!: { puntaje: number; aprobado: boolean; observaciones: string | null } | null;
  @Column({ default: 0 }) intentos!: number;
  @Column({ type: 'jsonb', default: () => "'[]'" }) historial!: IntentoValidado[];
  @VersionColumn() version!: number; // control de concurrencia optimista
  @UpdateDateColumn({ name: 'actualizado_en', type: 'timestamptz' }) actualizadoEn!: Date;

  aDominio(): Evaluacion {
    const r = this.resultado ? new Resultado(this.resultado.puntaje, this.resultado.aprobado, this.resultado.observaciones) : null;
    return new Evaluacion(this.id, this.expedienteId, this.tipo, this.estado, r, this.intentos, [...(this.historial ?? [])]);
  }
}

@Injectable()
export class RepositorioEvaluacionesTypeOrm implements RepositorioEvaluaciones {
  constructor(@InjectRepository(EvaluacionOrmEntity) private readonly orm: Repository<EvaluacionOrmEntity>) {}

  async buscarPorId(id: number): Promise<Evaluacion> {
    const fila = await this.orm.findOneBy({ id });
    if (!fila) throw new RecursoNoEncontradoError(`No existe la evaluación ${id}`);
    return fila.aDominio();
  }

  async buscarOCrear(expedienteId: number, tipo: TipoEvaluacion): Promise<Evaluacion> {
    const existente = await this.orm.findOneBy({ expedienteId, tipo });
    if (existente) return existente.aDominio();
    return (await this.orm.save(this.orm.create({ expedienteId, tipo, estado: EstadoResultado.PENDIENTE, intentos: 0, historial: [] }))).aDominio();
  }

  async listarDeExpediente(expedienteId: number): Promise<Evaluacion[]> {
    return (await this.orm.find({ where: { expedienteId }, order: { id: 'ASC' } })).map((f) => f.aDominio());
  }

  async guardar(e: Evaluacion): Promise<void> {
    await this.orm.update(
      { id: e.id },
      {
        estado: e.estado,
        resultado: e.resultado ? { puntaje: e.resultado.puntaje, aprobado: e.resultado.aprobado, observaciones: e.resultado.observaciones } : null,
        intentos: e.intentos,
        historial: [...e.historial],
      },
    );
  }
}
