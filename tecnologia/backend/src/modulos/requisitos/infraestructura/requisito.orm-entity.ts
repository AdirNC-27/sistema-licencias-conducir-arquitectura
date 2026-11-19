import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { Categoria, TipoTramite } from '../../../compartido/dominio/categoria';

@Entity('requisitos')
@Index('ix_requisitos_tramite_categoria', ['tipoTramite', 'categoria'])
export class RequisitoOrmEntity {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ name: 'tipo_tramite', type: 'enum', enum: TipoTramite }) tipoTramite!: TipoTramite;
  @Column({ type: 'enum', enum: Categoria, nullable: true }) categoria!: Categoria | null;
  @Column() orden!: number;
  @Column({ length: 250 }) descripcion!: string;
  @Column({ name: 'codigo_documento', type: 'varchar', length: 40, nullable: true }) codigoDocumento!: string | null;
}
