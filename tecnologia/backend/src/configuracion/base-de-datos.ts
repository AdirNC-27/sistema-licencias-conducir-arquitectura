import { DataSourceOptions } from 'typeorm';
import { UsuarioOrmEntity } from '../modulos/identidad/infraestructura/usuario.orm-entity';
import { PostulanteOrmEntity } from '../modulos/postulantes/infraestructura/postulante.orm-entity';
import { RequisitoOrmEntity } from '../modulos/requisitos/infraestructura/requisito.orm-entity';
import { ExpedienteOrmEntity } from '../modulos/expedientes/infraestructura/expediente.orm-entity';
import { DocumentoOrmEntity } from '../modulos/documentos/infraestructura/documento.orm-entity';
import { PagoOrmEntity } from '../modulos/pagos/infraestructura/pagos.typeorm';
import { CitaOrmEntity, CupoOrmEntity } from '../modulos/citas/infraestructura/citas.typeorm';
import { EvaluacionOrmEntity } from '../modulos/evaluaciones/infraestructura/evaluaciones.typeorm';
import { AuditoriaOrmEntity } from '../modulos/auditoria/infraestructura/bitacora-auditoria.typeorm';
import { NotificacionOrmEntity } from '../modulos/notificaciones/infraestructura/notificacion.orm-entity';
import { LicenciaOrmEntity, ObservacionOrmEntity, VerificacionOrmEntity } from '../modulos/revision/infraestructura/revision.typeorm';
import { ConsultaOrmEntity, ContenidoOrmEntity } from '../modulos/asistente/infraestructura/asistente.typeorm';
import { MIGRACIONES } from '../migraciones';

export const ENTIDADES = [
  UsuarioOrmEntity,
  PostulanteOrmEntity,
  RequisitoOrmEntity,
  ExpedienteOrmEntity,
  DocumentoOrmEntity,
  PagoOrmEntity,
  CupoOrmEntity,
  CitaOrmEntity,
  EvaluacionOrmEntity,
  AuditoriaOrmEntity,
  NotificacionOrmEntity,
  VerificacionOrmEntity,
  ObservacionOrmEntity,
  LicenciaOrmEntity,
  ContenidoOrmEntity,
  ConsultaOrmEntity,
];

/** Una sola base de datos PostgreSQL (ADR-005). El esquema se crea con migraciones, nunca con synchronize. */
export function opcionesBaseDeDatos(env: Record<string, string | undefined> = process.env): DataSourceOptions {
  return {
    type: 'postgres',
    host: env.DB_HOST ?? 'localhost',
    port: Number(env.DB_PUERTO ?? 5432),
    username: env.DB_USUARIO ?? 'licencias',
    password: env.DB_CLAVE ?? 'licencias',
    database: env.DB_NOMBRE ?? 'licencias',
    entities: ENTIDADES,
    migrations: MIGRACIONES,
    synchronize: false,
    extra: { max: Number(env.DB_POOL ?? 20) },
  };
}
