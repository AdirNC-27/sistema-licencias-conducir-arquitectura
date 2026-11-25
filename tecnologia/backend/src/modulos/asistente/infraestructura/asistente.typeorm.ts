import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Column, CreateDateColumn, Entity, Index, IsNull, Not, PrimaryGeneratedColumn, Repository, UpdateDateColumn } from 'typeorm';
import { RecursoNoEncontradoError } from '../../../compartido/dominio/errores';
import { ConsultaAsistente, OrigenRespuesta } from '../dominio/consulta';
import { ContenidoAprobado, DatosContenido, TemaContenido } from '../dominio/contenido';
import { RepositorioConsultas, RepositorioContenidos } from '../dominio/contratos';

@Entity('contenidos_asistente')
export class ContenidoOrmEntity {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ type: 'enum', enum: TemaContenido, enumName: 'contenidos_tema_enum' }) tema!: TemaContenido;
  @Column({ length: 200 }) pregunta!: string;
  @Column({ length: 1000 }) respuesta!: string;
  @Column({ name: 'palabras_clave', length: 300, default: '' }) palabrasClave!: string;
  @Column({ default: true }) activo!: boolean;
  @UpdateDateColumn({ name: 'actualizado_en', type: 'timestamptz' }) actualizadoEn!: Date;
}

@Entity('consultas_asistente')
@Index('ix_consultas_derivadas_pendientes', ['id'], { where: `"origen" = 'DERIVADA' AND "respondida_en" IS NULL` }) // bandeja del gestor
export class ConsultaOrmEntity {
  @PrimaryGeneratedColumn() id!: number;
  @Index('ix_consultas_postulante') @Column({ name: 'postulante_id' }) postulanteId!: number;
  @Column({ length: 300 }) pregunta!: string;
  @Column({ length: 1500 }) respuesta!: string;
  @Column({ type: 'enum', enum: OrigenRespuesta, enumName: 'consultas_origen_enum' }) origen!: OrigenRespuesta;
  @Column({ type: 'int', array: true, default: () => "'{}'" }) fuentes!: number[];
  @Column({ name: 'respuesta_gestor', type: 'varchar', length: 1000, nullable: true }) respuestaGestor!: string | null;
  @Column({ name: 'gestor_id', type: 'int', nullable: true }) gestorId!: number | null;
  @Column({ name: 'respondida_en', type: 'timestamptz', nullable: true }) respondidaEn!: Date | null;
  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' }) creadoEn!: Date;

  aDominio(): ConsultaAsistente {
    return new ConsultaAsistente(this.id, this.postulanteId, this.pregunta, this.respuesta, this.origen, this.fuentes, this.creadoEn, this.respuestaGestor, this.gestorId, this.respondidaEn);
  }
}

const aContenido = (f: ContenidoOrmEntity): ContenidoAprobado => ({ id: f.id, tema: f.tema, pregunta: f.pregunta, respuesta: f.respuesta, palabrasClave: f.palabrasClave, activo: f.activo });

/**
 * El contenido activo se guarda en memoria del monolito (ADR-009): es público, cambia poco y se lee
 * en cada pregunta. Cualquier cambio del administrador vacía la caché.
 */
@Injectable()
export class RepositorioContenidosTypeOrm implements RepositorioContenidos {
  private cache: ContenidoAprobado[] | null = null;

  constructor(@InjectRepository(ContenidoOrmEntity) private readonly orm: Repository<ContenidoOrmEntity>) {}

  async activos(): Promise<ContenidoAprobado[]> {
    this.cache ??= (await this.orm.find({ where: { activo: true }, order: { id: 'ASC' } })).map(aContenido);
    return this.cache;
  }

  async todos(): Promise<ContenidoAprobado[]> {
    return (await this.orm.find({ order: { tema: 'ASC', id: 'ASC' } })).map(aContenido);
  }

  async buscarPorId(id: number): Promise<ContenidoAprobado> {
    const fila = await this.orm.findOneBy({ id });
    if (!fila) throw new RecursoNoEncontradoError(`No existe el contenido ${id}`);
    return aContenido(fila);
  }

  async crear(datos: DatosContenido): Promise<ContenidoAprobado> {
    this.cache = null;
    return aContenido(await this.orm.save(this.orm.create(datos)));
  }

  async actualizar(c: ContenidoAprobado): Promise<ContenidoAprobado> {
    this.cache = null;
    await this.orm.update({ id: c.id }, { tema: c.tema, pregunta: c.pregunta, respuesta: c.respuesta, palabrasClave: c.palabrasClave, activo: c.activo });
    return this.buscarPorId(c.id);
  }
}

@Injectable()
export class RepositorioConsultasTypeOrm implements RepositorioConsultas {
  constructor(@InjectRepository(ConsultaOrmEntity) private readonly orm: Repository<ConsultaOrmEntity>) {}

  async registrar(datos: { postulanteId: number; pregunta: string; respuesta: string; origen: OrigenRespuesta; fuentes: number[] }): Promise<ConsultaAsistente> {
    return (await this.orm.save(this.orm.create(datos))).aDominio();
  }

  async buscarPorId(id: number): Promise<ConsultaAsistente> {
    const fila = await this.orm.findOneBy({ id });
    if (!fila) throw new RecursoNoEncontradoError(`No existe la consulta ${id}`);
    return fila.aDominio();
  }

  async dePostulante(postulanteId: number, limite: number): Promise<ConsultaAsistente[]> {
    const filas = await this.orm.find({ where: { postulanteId }, order: { id: 'DESC' }, take: limite });
    return filas.reverse().map((f) => f.aDominio());
  }

  async derivadas(soloPendientes: boolean): Promise<ConsultaAsistente[]> {
    const filas = await this.orm.find({
      where: { origen: OrigenRespuesta.DERIVADA, respondidaEn: soloPendientes ? IsNull() : Not(IsNull()) },
      order: { id: soloPendientes ? 'ASC' : 'DESC' },
      take: 100,
    });
    return filas.map((f) => f.aDominio());
  }

  async guardarRespuestaGestor(c: ConsultaAsistente): Promise<void> {
    await this.orm.update({ id: c.id }, { respuestaGestor: c.respuestaGestor, gestorId: c.gestorId, respondidaEn: c.respondidaEn });
  }
}
