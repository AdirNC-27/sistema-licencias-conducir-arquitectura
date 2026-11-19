import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { Postulante } from '../dominio/postulante';

@Entity('postulantes')
export class PostulanteOrmEntity {
  @PrimaryGeneratedColumn() id!: number;
  @Index({ unique: true }) @Column({ length: 8 }) dni!: string;
  @Column({ length: 100 }) nombres!: string;
  @Column({ length: 100 }) apellidos!: string;
  @Column({ length: 120 }) correo!: string;
  @Column({ length: 15 }) celular!: string;
  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' }) creadoEn!: Date;

  aDominio(): Postulante {
    return new Postulante(this.id, this.dni, this.nombres, this.apellidos, this.correo, this.celular);
  }
}
