import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { Rol } from '../../../compartido/dominio/rol';
import { Usuario } from '../dominio/usuario';

@Entity('usuarios')
export class UsuarioOrmEntity {
  @PrimaryGeneratedColumn() id!: number;
  @Index({ unique: true }) @Column({ length: 60 }) usuario!: string;
  @Column({ length: 150 }) nombre!: string;
  @Column({ name: 'clave_cifrada', length: 100 }) claveCifrada!: string;
  @Column({ type: 'enum', enum: Rol }) rol!: Rol;
  @Column({ name: 'postulante_id', type: 'int', nullable: true }) postulanteId!: number | null;
  @Column({ default: true }) activo!: boolean;
  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' }) creadoEn!: Date;

  aDominio(): Usuario {
    return new Usuario(this.id, this.usuario, this.nombre, this.claveCifrada, this.rol, this.postulanteId, this.activo);
  }
}
