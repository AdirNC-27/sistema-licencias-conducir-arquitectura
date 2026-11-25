import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Revisión del expediente (RF11, RF24, RF27): verificaciones del gestor en portales oficiales,
 * observaciones del supervisor y licencia emitida para su carga en el SNC.
 */
export class RevisionExpediente1795094000000 implements MigrationInterface {
  name = 'RevisionExpediente1795094000000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE TYPE "public"."verificaciones_tipo_enum" AS ENUM('SNC_CERTIFICADO_MEDICO', 'SNC_COFIPRO', 'SANCIONES')`);
    await q.query(`CREATE TYPE "public"."verificaciones_resultado_enum" AS ENUM('CONFORME', 'NO_CONFORME')`);
    await q.query(`CREATE TABLE "verificaciones_oficiales" (
      "id" SERIAL NOT NULL,
      "expediente_id" integer NOT NULL,
      "tipo" "public"."verificaciones_tipo_enum" NOT NULL,
      "resultado" "public"."verificaciones_resultado_enum" NOT NULL,
      "detalle" character varying(250),
      "gestor_id" integer NOT NULL,
      "registrado_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      CONSTRAINT "PK_verificaciones_oficiales" PRIMARY KEY ("id"))`);
    await q.query(`CREATE INDEX "ix_verificaciones_expediente" ON "verificaciones_oficiales" ("expediente_id")`);

    await q.query(`CREATE TYPE "public"."observaciones_estado_enum" AS ENUM('ABIERTA', 'ATENDIDA')`);
    await q.query(`CREATE TABLE "observaciones_expediente" (
      "id" SERIAL NOT NULL,
      "expediente_id" integer NOT NULL,
      "motivo" character varying(500) NOT NULL,
      "supervisor_id" integer NOT NULL,
      "estado" "public"."observaciones_estado_enum" NOT NULL DEFAULT 'ABIERTA',
      "respuesta" character varying(500),
      "gestor_id" integer,
      "atendida_en" TIMESTAMP WITH TIME ZONE,
      "creado_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      CONSTRAINT "PK_observaciones_expediente" PRIMARY KEY ("id"))`);
    await q.query(`CREATE INDEX "ix_observaciones_expediente" ON "observaciones_expediente" ("expediente_id")`);
    // Una sola observación abierta por expediente, garantizado también por la base de datos
    await q.query(`CREATE UNIQUE INDEX "ux_observacion_abierta" ON "observaciones_expediente" ("expediente_id") WHERE "estado" = 'ABIERTA'`);
    await q.query(`CREATE INDEX "ix_observaciones_estado" ON "observaciones_expediente" ("estado")`);

    await q.query(`CREATE TABLE "licencias_emitidas" (
      "id" SERIAL NOT NULL,
      "expediente_id" integer NOT NULL,
      "numero" character varying(15) NOT NULL,
      "gestor_id" integer NOT NULL,
      "registrada_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      CONSTRAINT "PK_licencias_emitidas" PRIMARY KEY ("id"),
      CONSTRAINT "UQ_licencia_expediente" UNIQUE ("expediente_id"),
      CONSTRAINT "UQ_licencia_numero" UNIQUE ("numero"))`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE "licencias_emitidas"`);
    await q.query(`DROP TABLE "observaciones_expediente"`);
    await q.query(`DROP TYPE "public"."observaciones_estado_enum"`);
    await q.query(`DROP TABLE "verificaciones_oficiales"`);
    await q.query(`DROP TYPE "public"."verificaciones_resultado_enum"`);
    await q.query(`DROP TYPE "public"."verificaciones_tipo_enum"`);
  }
}
