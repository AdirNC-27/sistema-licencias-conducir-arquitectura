import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Índices definidos con EXPLAIN ANALYZE sobre 30 000 expedientes (docs/06-validacion-calidad/analisis-base-de-datos.md).
 * - Bandeja sin filtro: evitaba recorrer y ordenar toda la tabla de expedientes.
 * - Resultados por validar: índice parcial; solo guarda las evaluaciones en estado REGISTRADO.
 */
export class IndicesRendimiento1795092900000 implements MigrationInterface {
  name = 'IndicesRendimiento1795092900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX "ix_expedientes_creado" ON "expedientes" ("creado_en") `);
    await queryRunner.query(`CREATE INDEX "ix_evaluaciones_por_validar" ON "evaluaciones" ("actualizado_en") WHERE "estado" = 'REGISTRADO'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."ix_evaluaciones_por_validar"`);
    await queryRunner.query(`DROP INDEX "public"."ix_expedientes_creado"`);
  }
}
