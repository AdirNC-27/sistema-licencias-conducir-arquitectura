import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('notificaciones')
export class NotificacionOrmEntity {
  @PrimaryGeneratedColumn() id!: number;
  @Index() @Column({ name: 'postulante_id' }) postulanteId!: number;
  @Column({ length: 150 }) asunto!: string;
  @Column({ length: 500 }) texto!: string;
  @Column({ name: 'enviado_por_correo', default: false }) enviadoPorCorreo!: boolean;
  @Column({ default: false }) leida!: boolean;
  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' }) creadoEn!: Date;
}
