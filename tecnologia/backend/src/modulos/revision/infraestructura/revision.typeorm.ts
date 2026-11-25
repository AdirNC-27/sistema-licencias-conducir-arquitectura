import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Repository, Unique } from 'typeorm';
import { RecursoNoEncontradoError } from '../../../compartido/dominio/errores';
import { RepositorioRevision } from '../dominio/contratos';
import { EstadoObservacion, ObservacionExpediente } from '../dominio/observacion';
import { LicenciaEmitida } from '../dominio/revision';
import { ResultadoVerificacion, TipoVerificacion, Verificacion } from '../dominio/verificacion';

/** Historial de verificaciones: nunca se actualiza una fila, cada constancia es un registro nuevo. */
@Entity('verificaciones_oficiales')
export class VerificacionOrmEntity {
  @PrimaryGeneratedColumn() id!: number;
  @Index('ix_verificaciones_expediente') @Column({ name: 'expediente_id' }) expedienteId!: number;
  @Column({ type: 'enum', enum: TipoVerificacion, enumName: 'verificaciones_tipo_enum' }) tipo!: TipoVerificacion;
  @Column({ type: 'enum', enum: ResultadoVerificacion, enumName: 'verificaciones_resultado_enum' }) resultado!: ResultadoVerificacion;
  @Column({ type: 'varchar', length: 250, nullable: true }) detalle!: string | null;
  @Column({ name: 'gestor_id' }) gestorId!: number;
  @CreateDateColumn({ name: 'registrado_en', type: 'timestamptz' }) registradoEn!: Date;
}

@Entity('observaciones_expediente')
@Index('ux_observacion_abierta', ['expedienteId'], { unique: true, where: `"estado" = 'ABIERTA'` }) // una sola abierta por expediente
export class ObservacionOrmEntity {
  @PrimaryGeneratedColumn() id!: number;
  @Index('ix_observaciones_expediente') @Column({ name: 'expediente_id' }) expedienteId!: number;
  @Column({ length: 500 }) motivo!: string;
  @Column({ name: 'supervisor_id' }) supervisorId!: number;
  @Index('ix_observaciones_estado') @Column({ type: 'enum', enum: EstadoObservacion, enumName: 'observaciones_estado_enum', default: EstadoObservacion.ABIERTA }) estado!: EstadoObservacion;
  @Column({ type: 'varchar', length: 500, nullable: true }) respuesta!: string | null;
  @Column({ name: 'gestor_id', type: 'int', nullable: true }) gestorId!: number | null;
  @Column({ name: 'atendida_en', type: 'timestamptz', nullable: true }) atendidaEn!: Date | null;
  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' }) creadoEn!: Date;

  aDominio(): ObservacionExpediente {
    return new ObservacionExpediente(this.id, this.expedienteId, this.motivo, this.supervisorId, this.creadoEn, this.estado, this.respuesta, this.gestorId, this.atendidaEn);
  }
}

@Entity('licencias_emitidas')
@Unique('UQ_licencia_expediente', ['expedienteId'])
@Unique('UQ_licencia_numero', ['numero'])
export class LicenciaOrmEntity {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ name: 'expediente_id' }) expedienteId!: number;
  @Column({ length: 15 }) numero!: string;
  @Column({ name: 'gestor_id' }) gestorId!: number;
  @CreateDateColumn({ name: 'registrada_en', type: 'timestamptz' }) registradaEn!: Date;
}

const aVerificacion = (f: VerificacionOrmEntity): Verificacion => ({
  id: f.id,
  expedienteId: f.expedienteId,
  tipo: f.tipo,
  resultado: f.resultado,
  detalle: f.detalle,
  gestorId: f.gestorId,
  registradoEn: f.registradoEn,
});

const aLicencia = (f: LicenciaOrmEntity): LicenciaEmitida => ({ expedienteId: f.expedienteId, numero: f.numero, gestorId: f.gestorId, registradaEn: f.registradaEn });

@Injectable()
export class RepositorioRevisionTypeOrm implements RepositorioRevision {
  constructor(
    @InjectRepository(VerificacionOrmEntity) private readonly verificaciones: Repository<VerificacionOrmEntity>,
    @InjectRepository(ObservacionOrmEntity) private readonly observaciones: Repository<ObservacionOrmEntity>,
    @InjectRepository(LicenciaOrmEntity) private readonly licencias: Repository<LicenciaOrmEntity>,
  ) {}

  async registrarVerificacion(datos: { expedienteId: number; tipo: TipoVerificacion; resultado: ResultadoVerificacion; detalle: string | null; gestorId: number }): Promise<Verificacion> {
    return aVerificacion(await this.verificaciones.save(this.verificaciones.create(datos)));
  }

  async verificacionesDe(expedienteId: number): Promise<Verificacion[]> {
    return (await this.verificaciones.find({ where: { expedienteId }, order: { id: 'ASC' } })).map(aVerificacion);
  }

  async crearObservacion(datos: { expedienteId: number; motivo: string; supervisorId: number }): Promise<ObservacionExpediente> {
    return (await this.observaciones.save(this.observaciones.create(datos))).aDominio();
  }

  async buscarObservacion(id: number): Promise<ObservacionExpediente> {
    const fila = await this.observaciones.findOneBy({ id });
    if (!fila) throw new RecursoNoEncontradoError(`No existe la observación ${id}`);
    return fila.aDominio();
  }

  async observacionesDe(expedienteId: number): Promise<ObservacionExpediente[]> {
    return (await this.observaciones.find({ where: { expedienteId }, order: { id: 'ASC' } })).map((f) => f.aDominio());
  }

  async observacionesAbiertas(): Promise<ObservacionExpediente[]> {
    return (await this.observaciones.find({ where: { estado: EstadoObservacion.ABIERTA }, order: { id: 'ASC' } })).map((f) => f.aDominio());
  }

  async guardarAtencion(o: ObservacionExpediente): Promise<void> {
    await this.observaciones.update({ id: o.id }, { estado: o.estado, respuesta: o.respuesta, gestorId: o.gestorId, atendidaEn: o.atendidaEn });
  }

  async registrarLicencia(datos: Omit<LicenciaEmitida, 'registradaEn'>): Promise<LicenciaEmitida> {
    return aLicencia(await this.licencias.save(this.licencias.create(datos)));
  }

  async licenciaDe(expedienteId: number): Promise<LicenciaEmitida | null> {
    const fila = await this.licencias.findOneBy({ expedienteId });
    return fila ? aLicencia(fila) : null;
  }

  existeNumeroLicencia(numero: string): Promise<boolean> {
    return this.licencias.existsBy({ numero });
  }
}
