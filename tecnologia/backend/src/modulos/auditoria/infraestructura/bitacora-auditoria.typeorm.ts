import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Repository } from 'typeorm';
import { EVENTOS, OperacionAuditable } from '../../../compartido/eventos/eventos';
import { RegistroAuditoria } from '../dominio/registro-auditoria';

@Entity('auditoria')
@Index('ix_auditoria_entidad', ['entidad', 'entidadId'])
export class AuditoriaOrmEntity {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ name: 'usuario_id' }) usuarioId!: number;
  @Column({ length: 40 }) accion!: string;
  @Column({ length: 30 }) entidad!: string;
  @Column({ name: 'entidad_id' }) entidadId!: number;
  @Column({ name: 'valor_anterior', type: 'jsonb', nullable: true }) valorAnterior!: unknown;
  @Column({ name: 'valor_nuevo', type: 'jsonb', nullable: true }) valorNuevo!: unknown;
  @Column({ type: 'varchar', length: 250, nullable: true }) motivo!: string | null;
  @Index() @CreateDateColumn({ name: 'fecha', type: 'timestamptz' }) fecha!: Date;
}

/** Solo inserta: la bitácora nunca se modifica ni se borra (ADR-006). */
@Injectable()
export class BitacoraAuditoriaTypeOrm implements RegistroAuditoria {
  constructor(@InjectRepository(AuditoriaOrmEntity) private readonly orm: Repository<AuditoriaOrmEntity>) {}

  async registrar(o: OperacionAuditable): Promise<void> {
    await this.orm.insert({
      usuarioId: o.usuarioId,
      accion: o.accion,
      entidad: o.entidad,
      entidadId: o.entidadId,
      valorAnterior: (o.valorAnterior ?? null) as never,
      valorNuevo: (o.valorNuevo ?? null) as never,
      motivo: o.motivo ?? null,
    });
  }

  /** Patrón Observer: escucha las operaciones auditables que publican los demás módulos. */
  @OnEvent(EVENTOS.OPERACION_AUDITABLE, { async: true, promisify: true })
  async alOcurrirOperacion(o: OperacionAuditable): Promise<void> {
    await this.registrar(o);
  }
}
