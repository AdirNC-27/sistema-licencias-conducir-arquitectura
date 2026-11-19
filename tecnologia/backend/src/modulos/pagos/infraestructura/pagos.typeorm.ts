import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Repository } from 'typeorm';
import { RecursoNoEncontradoError } from '../../../compartido/dominio/errores';
import { EstadoPago, Pago, RepositorioPagos } from '../dominio/pago';

@Entity('pagos')
export class PagoOrmEntity {
  @PrimaryGeneratedColumn() id!: number;
  @Index() @Column({ name: 'expediente_id' }) expedienteId!: number;
  @Index({ unique: true }) @Column({ name: 'numero_operacion', length: 30 }) numeroOperacion!: string;
  @Column({ type: 'numeric', precision: 8, scale: 2, transformer: { to: (v: number) => v, from: (v: string) => Number(v) } }) monto!: number;
  @Column({ name: 'fecha_pago', type: 'date' }) fechaPago!: string;
  @Column({ type: 'enum', enum: EstadoPago, default: EstadoPago.PENDIENTE }) estado!: EstadoPago;
  @Column({ type: 'varchar', length: 250, nullable: true }) observacion!: string | null;
  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' }) creadoEn!: Date;

  aDominio(): Pago {
    return new Pago(this.id, this.expedienteId, this.numeroOperacion, this.monto, new Date(this.fechaPago), this.estado, this.observacion);
  }
}

@Injectable()
export class RepositorioPagosTypeOrm implements RepositorioPagos {
  constructor(@InjectRepository(PagoOrmEntity) private readonly orm: Repository<PagoOrmEntity>) {}

  async registrar(datos: { expedienteId: number; numeroOperacion: string; monto: number; fechaPago: Date }): Promise<Pago> {
    return (await this.orm.save(this.orm.create({ ...datos, fechaPago: datos.fechaPago.toISOString().slice(0, 10) }))).aDominio();
  }

  async buscarPorId(id: number): Promise<Pago> {
    const fila = await this.orm.findOneBy({ id });
    if (!fila) throw new RecursoNoEncontradoError(`No existe el pago ${id}`);
    return fila.aDominio();
  }

  async listarDeExpediente(expedienteId: number): Promise<Pago[]> {
    return (await this.orm.find({ where: { expedienteId }, order: { id: 'ASC' } })).map((f) => f.aDominio());
  }

  existeOperacion(numeroOperacion: string): Promise<boolean> {
    return this.orm.existsBy({ numeroOperacion });
  }

  async guardarEstado(pago: Pago): Promise<void> {
    await this.orm.update({ id: pago.id }, { estado: pago.estado, observacion: pago.observacion });
  }
}
