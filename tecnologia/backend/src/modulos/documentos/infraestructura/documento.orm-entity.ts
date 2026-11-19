import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { Documento, EstadoDocumento, TipoDocumento } from '../dominio/documento';

@Entity('documentos')
export class DocumentoOrmEntity {
  @PrimaryGeneratedColumn() id!: number;
  @Index() @Column({ name: 'expediente_id' }) expedienteId!: number;
  @Column({ type: 'enum', enum: TipoDocumento }) tipo!: TipoDocumento;
  @Column({ type: 'enum', enum: EstadoDocumento, default: EstadoDocumento.PENDIENTE }) estado!: EstadoDocumento;
  @Column({ type: 'varchar', length: 250, nullable: true }) observacion!: string | null;
  @Column({ name: 'fecha_emision', type: 'date', nullable: true }) fechaEmision!: string | null;
  @Column({ name: 'nombre_archivo', length: 150 }) nombreArchivo!: string;
  @Column({ name: 'tipo_mime', length: 60 }) tipoMime!: string;
  @Column({ type: 'bytea', select: false }) contenido!: Buffer;
  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' }) creadoEn!: Date;

  aDominio(): Documento {
    return new Documento(this.id, this.expedienteId, this.tipo, this.estado, this.observacion, this.fechaEmision ? new Date(this.fechaEmision) : null);
  }
}
