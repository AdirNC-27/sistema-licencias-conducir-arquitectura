import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Categoria, TipoTramite } from '../../../compartido/dominio/categoria';
import { Etapa } from '../dominio/etapa';
import { Expediente } from '../dominio/expediente';

@Entity('expedientes')
@Index('ix_expedientes_etapa_creado', ['etapa', 'creadoEn'])
export class ExpedienteOrmEntity {
  @PrimaryGeneratedColumn() id!: number;
  @Index({ unique: true }) @Column({ length: 20 }) numero!: string;
  @Index() @Column({ name: 'postulante_id' }) postulanteId!: number;
  @Column({ name: 'tipo_tramite', type: 'enum', enum: TipoTramite }) tipoTramite!: TipoTramite;
  @Column({ type: 'enum', enum: Categoria }) categoria!: Categoria;
  @Column({ type: 'enum', enum: Etapa }) etapa!: Etapa;
  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' }) creadoEn!: Date;
  @UpdateDateColumn({ name: 'actualizado_en', type: 'timestamptz' }) actualizadoEn!: Date;

  aDominio(): Expediente {
    return new Expediente(this.id, this.numero, this.postulanteId, this.tipoTramite, this.categoria, this.etapa, this.creadoEn);
  }
}
