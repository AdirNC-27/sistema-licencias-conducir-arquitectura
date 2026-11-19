import { MigrationInterface, QueryRunner } from "typeorm";

export class EsquemaInicial1795092772996 implements MigrationInterface {
    name = 'EsquemaInicial1795092772996'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."usuarios_rol_enum" AS ENUM('POSTULANTE', 'GESTOR', 'EVALUADOR', 'SUPERVISOR', 'ADMINISTRADOR')`);
        await queryRunner.query(`CREATE TABLE "usuarios" ("id" SERIAL NOT NULL, "usuario" character varying(60) NOT NULL, "nombre" character varying(150) NOT NULL, "clave_cifrada" character varying(100) NOT NULL, "rol" "public"."usuarios_rol_enum" NOT NULL, "postulante_id" integer, "activo" boolean NOT NULL DEFAULT true, "creado_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_d7281c63c176e152e4c531594a8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_0790a401b9d234fa921e9aa177" ON "usuarios" ("usuario") `);
        await queryRunner.query(`CREATE TABLE "postulantes" ("id" SERIAL NOT NULL, "dni" character varying(8) NOT NULL, "nombres" character varying(100) NOT NULL, "apellidos" character varying(100) NOT NULL, "correo" character varying(120) NOT NULL, "celular" character varying(15) NOT NULL, "creado_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_d66d640371b755a165726d23c45" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_db667f87d9e1d9732fd2763f4e" ON "postulantes" ("dni") `);
        await queryRunner.query(`CREATE TYPE "public"."requisitos_tipo_tramite_enum" AS ENUM('EMISION', 'REVALIDACION', 'DUPLICADO')`);
        await queryRunner.query(`CREATE TYPE "public"."requisitos_categoria_enum" AS ENUM('II-B', 'II-C')`);
        await queryRunner.query(`CREATE TABLE "requisitos" ("id" SERIAL NOT NULL, "tipo_tramite" "public"."requisitos_tipo_tramite_enum" NOT NULL, "categoria" "public"."requisitos_categoria_enum", "orden" integer NOT NULL, "descripcion" character varying(250) NOT NULL, "codigo_documento" character varying(40), CONSTRAINT "PK_b0417b3952ffc430e14dc488406" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "ix_requisitos_tramite_categoria" ON "requisitos" ("tipo_tramite", "categoria") `);
        await queryRunner.query(`CREATE TYPE "public"."expedientes_tipo_tramite_enum" AS ENUM('EMISION', 'REVALIDACION', 'DUPLICADO')`);
        await queryRunner.query(`CREATE TYPE "public"."expedientes_categoria_enum" AS ENUM('II-B', 'II-C')`);
        await queryRunner.query(`CREATE TYPE "public"."expedientes_etapa_enum" AS ENUM('DOCUMENTOS', 'PAGO', 'CITA', 'EXAMEN_CONOCIMIENTOS', 'EXAMEN_MANEJO', 'EMISION', 'EMITIDA')`);
        await queryRunner.query(`CREATE TABLE "expedientes" ("id" SERIAL NOT NULL, "numero" character varying(20) NOT NULL, "postulante_id" integer NOT NULL, "tipo_tramite" "public"."expedientes_tipo_tramite_enum" NOT NULL, "categoria" "public"."expedientes_categoria_enum" NOT NULL, "etapa" "public"."expedientes_etapa_enum" NOT NULL, "creado_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "actualizado_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a5ea29a2665df2319ecbb8f4408" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_40f6ecd8f9797cb1ca71c2988d" ON "expedientes" ("numero") `);
        await queryRunner.query(`CREATE INDEX "IDX_1e39b0e45a039ea085fc051fc9" ON "expedientes" ("postulante_id") `);
        await queryRunner.query(`CREATE INDEX "ix_expedientes_etapa_creado" ON "expedientes" ("etapa", "creado_en") `);
        await queryRunner.query(`CREATE TYPE "public"."documentos_tipo_enum" AS ENUM('DECLARACION_JURADA', 'CERTIFICADO_MEDICO', 'FOTOGRAFIA', 'CONSTANCIA_COFIPRO')`);
        await queryRunner.query(`CREATE TYPE "public"."documentos_estado_enum" AS ENUM('PENDIENTE', 'APROBADO', 'OBSERVADO')`);
        await queryRunner.query(`CREATE TABLE "documentos" ("id" SERIAL NOT NULL, "expediente_id" integer NOT NULL, "tipo" "public"."documentos_tipo_enum" NOT NULL, "estado" "public"."documentos_estado_enum" NOT NULL DEFAULT 'PENDIENTE', "observacion" character varying(250), "fecha_emision" date, "nombre_archivo" character varying(150) NOT NULL, "tipo_mime" character varying(60) NOT NULL, "contenido" bytea NOT NULL, "creado_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_30b7ee230a352e7582842d1dc02" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c2db5de4f75734627dce4357cb" ON "documentos" ("expediente_id") `);
        await queryRunner.query(`CREATE TYPE "public"."pagos_estado_enum" AS ENUM('PENDIENTE', 'VERIFICADO', 'OBSERVADO', 'RECHAZADO')`);
        await queryRunner.query(`CREATE TABLE "pagos" ("id" SERIAL NOT NULL, "expediente_id" integer NOT NULL, "numero_operacion" character varying(30) NOT NULL, "monto" numeric(8,2) NOT NULL, "fecha_pago" date NOT NULL, "estado" "public"."pagos_estado_enum" NOT NULL DEFAULT 'PENDIENTE', "observacion" character varying(250), "creado_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_37321ca70a2ed50885dc205beb2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_17615cc2ce0be7c3e68e052e1e" ON "pagos" ("expediente_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_2aa6957c2f274c3abc9cab36a1" ON "pagos" ("numero_operacion") `);
        await queryRunner.query(`CREATE TYPE "public"."cupos_tipo_enum" AS ENUM('CONOCIMIENTOS', 'MANEJO')`);
        await queryRunner.query(`CREATE TABLE "cupos" ("id" SERIAL NOT NULL, "fecha" date NOT NULL, "hora" character varying(5) NOT NULL, "tipo" "public"."cupos_tipo_enum" NOT NULL, "capacidad" integer NOT NULL, "ocupados" integer NOT NULL DEFAULT '0', CONSTRAINT "ck_cupos_ocupados" CHECK ("ocupados" >= 0 AND "ocupados" <= "capacidad"), CONSTRAINT "PK_1a4dc6c815bcd522c473f7e59ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "ux_cupos_fecha_hora_tipo" ON "cupos" ("fecha", "hora", "tipo") `);
        await queryRunner.query(`CREATE TABLE "citas" ("id" SERIAL NOT NULL, "expediente_id" integer NOT NULL, "cupo_id" integer NOT NULL, "creado_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_43851fd780e10030fbe5bb1b912" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_fac005d702c6660affd8fcea67" ON "citas" ("expediente_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a875ef061575b15238d547920d" ON "citas" ("cupo_id") `);
        await queryRunner.query(`CREATE TYPE "public"."evaluaciones_tipo_enum" AS ENUM('CONOCIMIENTOS', 'MANEJO')`);
        await queryRunner.query(`CREATE TYPE "public"."evaluaciones_estado_enum" AS ENUM('PENDIENTE', 'REGISTRADO', 'VALIDADO', 'AGOTADO')`);
        await queryRunner.query(`CREATE TABLE "evaluaciones" ("id" SERIAL NOT NULL, "expediente_id" integer NOT NULL, "tipo" "public"."evaluaciones_tipo_enum" NOT NULL, "estado" "public"."evaluaciones_estado_enum" NOT NULL DEFAULT 'PENDIENTE', "resultado" jsonb, "intentos" integer NOT NULL DEFAULT '0', "historial" jsonb NOT NULL DEFAULT '[]', "version" integer NOT NULL, "actualizado_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_3b157bcce651495e675cdf96a14" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "ux_evaluaciones_expediente_tipo" ON "evaluaciones" ("expediente_id", "tipo") `);
        await queryRunner.query(`CREATE TABLE "auditoria" ("id" SERIAL NOT NULL, "usuario_id" integer NOT NULL, "accion" character varying(40) NOT NULL, "entidad" character varying(30) NOT NULL, "entidad_id" integer NOT NULL, "valor_anterior" jsonb, "valor_nuevo" jsonb, "motivo" character varying(250), "fecha" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_135fe98308816fe3a2d458e6637" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b92ed16d3033415d97c5113d0d" ON "auditoria" ("fecha") `);
        await queryRunner.query(`CREATE INDEX "ix_auditoria_entidad" ON "auditoria" ("entidad", "entidad_id") `);
        await queryRunner.query(`CREATE TABLE "notificaciones" ("id" SERIAL NOT NULL, "postulante_id" integer NOT NULL, "asunto" character varying(150) NOT NULL, "texto" character varying(500) NOT NULL, "enviado_por_correo" boolean NOT NULL DEFAULT false, "leida" boolean NOT NULL DEFAULT false, "creado_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a9d32a419ff58b53a38b5ef85d4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_fa45631199bc07c36a928a72f8" ON "notificaciones" ("postulante_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_fa45631199bc07c36a928a72f8"`);
        await queryRunner.query(`DROP TABLE "notificaciones"`);
        await queryRunner.query(`DROP INDEX "public"."ix_auditoria_entidad"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b92ed16d3033415d97c5113d0d"`);
        await queryRunner.query(`DROP TABLE "auditoria"`);
        await queryRunner.query(`DROP INDEX "public"."ux_evaluaciones_expediente_tipo"`);
        await queryRunner.query(`DROP TABLE "evaluaciones"`);
        await queryRunner.query(`DROP TYPE "public"."evaluaciones_estado_enum"`);
        await queryRunner.query(`DROP TYPE "public"."evaluaciones_tipo_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a875ef061575b15238d547920d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fac005d702c6660affd8fcea67"`);
        await queryRunner.query(`DROP TABLE "citas"`);
        await queryRunner.query(`DROP INDEX "public"."ux_cupos_fecha_hora_tipo"`);
        await queryRunner.query(`DROP TABLE "cupos"`);
        await queryRunner.query(`DROP TYPE "public"."cupos_tipo_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2aa6957c2f274c3abc9cab36a1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_17615cc2ce0be7c3e68e052e1e"`);
        await queryRunner.query(`DROP TABLE "pagos"`);
        await queryRunner.query(`DROP TYPE "public"."pagos_estado_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c2db5de4f75734627dce4357cb"`);
        await queryRunner.query(`DROP TABLE "documentos"`);
        await queryRunner.query(`DROP TYPE "public"."documentos_estado_enum"`);
        await queryRunner.query(`DROP TYPE "public"."documentos_tipo_enum"`);
        await queryRunner.query(`DROP INDEX "public"."ix_expedientes_etapa_creado"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1e39b0e45a039ea085fc051fc9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_40f6ecd8f9797cb1ca71c2988d"`);
        await queryRunner.query(`DROP TABLE "expedientes"`);
        await queryRunner.query(`DROP TYPE "public"."expedientes_etapa_enum"`);
        await queryRunner.query(`DROP TYPE "public"."expedientes_categoria_enum"`);
        await queryRunner.query(`DROP TYPE "public"."expedientes_tipo_tramite_enum"`);
        await queryRunner.query(`DROP INDEX "public"."ix_requisitos_tramite_categoria"`);
        await queryRunner.query(`DROP TABLE "requisitos"`);
        await queryRunner.query(`DROP TYPE "public"."requisitos_categoria_enum"`);
        await queryRunner.query(`DROP TYPE "public"."requisitos_tipo_tramite_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_db667f87d9e1d9732fd2763f4e"`);
        await queryRunner.query(`DROP TABLE "postulantes"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0790a401b9d234fa921e9aa177"`);
        await queryRunner.query(`DROP TABLE "usuarios"`);
        await queryRunner.query(`DROP TYPE "public"."usuarios_rol_enum"`);
    }

}
