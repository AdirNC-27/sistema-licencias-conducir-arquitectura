import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Asistente virtual (RF14, RF15, HU25): contenido aprobado y conversación de cada postulante.
 * El contenido inicial sale del TUPA MPH (PA6190033B) y de las reglas del sistema; el administrador
 * lo mantiene desde el portal.
 */
export const CONTENIDOS_INICIALES: [string, string, string, string][] = [
  ['REQUISITOS', '¿Qué requisitos necesito para la licencia II-B de moto?',
    'Para la II-B necesitas: la solicitud con declaración jurada de no estar privado de conducir, tener 18 años o más, un certificado médico registrado en el SNC (vigente 6 meses), dos fotografías tamaño carné a color, pagar S/ 69.90 y aprobar los exámenes de conocimientos y de manejo.',
    'requisitos moto, motocicleta, lineal, qué necesito, documentos para moto'],
  ['REQUISITOS', '¿Qué requisitos necesito para la licencia II-C de mototaxi?',
    'Para la II-C necesitas lo mismo que para la II-B (declaración jurada, 18 años, certificado médico en el SNC, dos fotos y los dos exámenes), además de la constancia COFIPRO registrada en el SNC y no tener multas ni sanciones pendientes. La tasa es S/ 69.40.',
    'requisitos mototaxi, mototaxista, trimoto, qué necesito, documentos para mototaxi'],
  ['PAGOS', '¿Cuánto cuesta la licencia?',
    'La tasa única del TUPA es S/ 69.90 para la II-B (moto) y S/ 69.40 para la II-C (mototaxi). Incluye los dos exámenes.',
    'precio, costo, tasa, monto, cuánto pago, cuánto cobran, precio del trámite para moto o mototaxi'],
  ['PAGOS', '¿Dónde pago la tasa?',
    'Puedes pagar en la Caja Central o en las cajas del SAT Huamanga, y también en el BBVA o en Interbank. Después registra el número de operación en la opción «Pago» del portal.',
    'dónde pago, banco, SAT, caja, lugar de pago'],
  ['PAGOS', '¿Cómo registro mi pago en el portal?',
    'Entra a «Pago», escribe el número de operación del recibo, el monto exacto y la fecha. El gestor lo verifica y tu trámite pasa a la etapa de cita.',
    'registrar pago, número de operación, recibo, voucher, comprobante'],
  ['PAGOS', '¿Tengo que pagar otra vez si desapruebo un examen?',
    'No. La tasa incluye los dos exámenes y tienes hasta 3 intentos en cada uno sin volver a pagar.',
    'pagar de nuevo, volver a pagar, desaprobar, jalar'],
  ['EVALUACIONES', '¿Cuántos intentos tengo para los exámenes?',
    'Tienes hasta 3 intentos en el examen de conocimientos y 3 en el de manejo, sin volver a pagar. Si no apruebas en el tercer intento, el gestor te indicará cómo continuar.',
    'intentos, oportunidades, cuántas veces, repetir examen, intentos para aprobar conocimientos o manejo'],
  ['EVALUACIONES', '¿Con qué nota apruebo el examen?',
    'La nota mínima es 14 sobre 20. En el examen de manejo, una falta eliminatoria desaprueba el intento aunque la nota sea mayor.',
    'nota mínima, aprobar, puntaje, calificación, falta eliminatoria'],
  ['EVALUACIONES', '¿Puedo dar el examen de manejo antes que el de conocimientos?',
    'No. Primero debes aprobar el examen de conocimientos; recién después puedes reservar el examen de manejo.',
    'orden de exámenes, primero, antes, manejo primero'],
  ['CITAS', '¿Qué días son los exámenes?',
    'El examen de conocimientos se toma de lunes a miércoles y el de manejo de martes a viernes, según los cupos disponibles.',
    'días de examen, horario de examen, qué día'],
  ['CITAS', '¿Cómo reservo mi cita para el examen?',
    'Cuando tu pago esté verificado, entra a «Mi cita», elige un día con cupos libres y confirma. Recibirás un recordatorio con la fecha.',
    'reservar cita, programar examen, sacar cita, separar turno'],
  ['CITAS', '¿Puedo reprogramar mi cita?',
    'Si no puedes asistir, pide la reprogramación al gestor de trámites. No lo dejes para después: el certificado médico vence a los 6 meses.',
    'reprogramar, cambiar fecha, no puedo ir, faltar al examen, postergar'],
  ['DOCUMENTOS', '¿Cuánto tiempo vale el certificado médico?',
    'El certificado médico vale 6 meses desde su emisión. Si vence antes de que el gestor lo apruebe, tendrás que sacar uno nuevo.',
    'vigencia certificado, vence, caduca, cuánto dura el certificado'],
  ['DOCUMENTOS', '¿Dónde saco el certificado médico?',
    'En una clínica autorizada por el MTC. La clínica lo registra en el SNC y el gestor verifica ese registro.',
    'examen médico, clínica, psicosomático, dónde saco'],
  ['DOCUMENTOS', '¿Qué es la constancia COFIPRO?',
    'Es la constancia del curso de formación para conductores de mototaxi, dictado por una escuela de conductores autorizada y registrado en el SNC. Solo se pide para la II-C.',
    'COFIPRO, curso, capacitación, escuela de conductores'],
  ['DOCUMENTOS', '¿En qué formato subo mis documentos?',
    'Puedes adjuntar archivos PDF, JPG o PNG de hasta 2 MB cada uno, desde «Mis documentos».',
    'formato, PDF, foto, tamaño de archivo, subir documentos, adjuntar'],
  ['DOCUMENTOS', '¿Qué hago si me observaron un documento?',
    'Revisa el motivo en «Mis documentos», corrige el archivo y vuelve a adjuntarlo. El gestor lo revisará otra vez.',
    'observado, rechazado, corregir documento, subsanar'],
  ['DOCUMENTOS', '¿Qué fotografías debo presentar?',
    'Debes presentar dos fotografías tamaño carné a color.',
    'fotos, fotografías, tamaño carné'],
  ['TRAMITE', '¿Cuánto demora el trámite?',
    'El plazo legal es de 10 días hábiles, con silencio administrativo positivo. En el portal ves cuántos días lleva tu expediente.',
    'demora, plazo, cuánto tarda, cuántos días, tiempo del trámite'],
  ['TRAMITE', '¿Dónde se atiende el trámite presencial?',
    'En la Unidad de Atención al Ciudadano del Palacio Municipal (lunes a viernes de 8:00 a 13:00 y de 15:00 a 17:30) o en el MAC Ayacucho (Terrapuerto Libertadores de América, 2.º nivel). Teléfono: (066) 31-5339.',
    'dirección, oficina, dónde queda, MAC, atención presencial, teléfono'],
  ['TRAMITE', '¿Cuál es la edad mínima para sacar la licencia?',
    'Debes tener 18 años o más.',
    'edad mínima, menor de edad, cuántos años'],
  ['TRAMITE', '¿Qué pasa si tengo multas o papeletas pendientes?',
    'Para la II-C no debes tener multas ni sanciones pendientes en el Registro Nacional de Sanciones. El gestor lo verifica y, si hay pendientes, no se autoriza la emisión.',
    'multas, papeletas, sanciones, récord del conductor, papeletas sin pagar'],
  ['TRAMITE', '¿Cuántos años dura la licencia II-B?',
    'Según el TUPA, la licencia II-B tiene una vigencia de 5 años.',
    'vigencia de la licencia, cuánto dura la licencia, vence la licencia'],
  ['TRAMITE', '¿Cómo me entero de los avances de mi trámite?',
    'Cada vez que tu expediente avanza recibes un aviso en «Avisos» y, si registraste tu correo, también por correo electrónico.',
    'avisos, notificaciones, correo, me avisan'],
  ['TRAMITE', '¿Qué diferencia hay entre la licencia II-B y la II-C?',
    'La II-B es para motocicletas de uso particular y cuesta S/ 69.90. La II-C es para mototaxis (servicio de pasajeros), cuesta S/ 69.40 y además pide la constancia COFIPRO y no tener multas pendientes.',
    'diferencia, categoría, cuál elijo, moto o mototaxi, trabajar, servicio de pasajeros'],
];

export class AsistenteVirtual1795094100000 implements MigrationInterface {
  name = 'AsistenteVirtual1795094100000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE TYPE "public"."contenidos_tema_enum" AS ENUM('REQUISITOS', 'DOCUMENTOS', 'PAGOS', 'CITAS', 'EVALUACIONES', 'TRAMITE')`);
    await q.query(`CREATE TABLE "contenidos_asistente" (
      "id" SERIAL NOT NULL,
      "tema" "public"."contenidos_tema_enum" NOT NULL,
      "pregunta" character varying(200) NOT NULL,
      "respuesta" character varying(1000) NOT NULL,
      "palabras_clave" character varying(300) NOT NULL DEFAULT '',
      "activo" boolean NOT NULL DEFAULT true,
      "actualizado_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      CONSTRAINT "PK_contenidos_asistente" PRIMARY KEY ("id"))`);

    await q.query(`CREATE TYPE "public"."consultas_origen_enum" AS ENUM('IA', 'CONTENIDO', 'ESTADO', 'DERIVADA')`);
    await q.query(`CREATE TABLE "consultas_asistente" (
      "id" SERIAL NOT NULL,
      "postulante_id" integer NOT NULL,
      "pregunta" character varying(300) NOT NULL,
      "respuesta" character varying(1500) NOT NULL,
      "origen" "public"."consultas_origen_enum" NOT NULL,
      "fuentes" integer array NOT NULL DEFAULT '{}',
      "respuesta_gestor" character varying(1000),
      "gestor_id" integer,
      "respondida_en" TIMESTAMP WITH TIME ZONE,
      "creado_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      CONSTRAINT "PK_consultas_asistente" PRIMARY KEY ("id"))`);
    await q.query(`CREATE INDEX "ix_consultas_postulante" ON "consultas_asistente" ("postulante_id")`);
    // Bandeja del gestor: solo las derivadas sin responder
    await q.query(`CREATE INDEX "ix_consultas_derivadas_pendientes" ON "consultas_asistente" ("id") WHERE "origen" = 'DERIVADA' AND "respondida_en" IS NULL`);

    for (const [tema, pregunta, respuesta, palabras] of CONTENIDOS_INICIALES) {
      await q.query(`INSERT INTO contenidos_asistente (tema, pregunta, respuesta, palabras_clave) VALUES ($1, $2, $3, $4)`, [tema, pregunta, respuesta, palabras]);
    }
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE "consultas_asistente"`);
    await q.query(`DROP TYPE "public"."consultas_origen_enum"`);
    await q.query(`DROP TABLE "contenidos_asistente"`);
    await q.query(`DROP TYPE "public"."contenidos_tema_enum"`);
  }
}
