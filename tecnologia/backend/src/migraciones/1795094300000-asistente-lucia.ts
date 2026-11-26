import { MigrationInterface, QueryRunner } from 'typeorm';

/** Lucía responde saludos y mensajes fuera de lugar sin derivarlos: nuevo origen de respuesta. */
export class AsistenteLucia1795094300000 implements MigrationInterface {
  name = 'AsistenteLucia1795094300000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TYPE "public"."consultas_origen_enum" ADD VALUE IF NOT EXISTS 'CONVERSACION' BEFORE 'DERIVADA'`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DELETE FROM consultas_asistente WHERE origen = 'CONVERSACION'`);
    await q.query(`ALTER TYPE "public"."consultas_origen_enum" RENAME TO "consultas_origen_enum_old"`);
    await q.query(`CREATE TYPE "public"."consultas_origen_enum" AS ENUM('IA', 'CONTENIDO', 'ESTADO', 'DERIVADA')`);
    await q.query(`ALTER TABLE "consultas_asistente" ALTER COLUMN "origen" TYPE "public"."consultas_origen_enum" USING "origen"::text::"public"."consultas_origen_enum"`);
    await q.query(`DROP TYPE "public"."consultas_origen_enum_old"`);
  }
}
