import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * La IA de orientación atiende también al personal: el contenido aprobado se separa por audiencia
 * y se agregan los procedimientos internos de cada rol (manual del trámite y reglas del sistema).
 */
export const CONTENIDOS_PERSONAL: [string, string, string, string][] = [
  ['DOCUMENTOS', '¿Cómo reviso los documentos de un expediente?',
    'Abre el expediente desde la bandeja, revisa cada archivo y márcalo como aprobado u observado. Si lo observas, escribe el motivo: el postulante lo ve y vuelve a adjuntarlo. Cuando todos están aprobados, el expediente pasa solo a la etapa de pago.',
    'revisar documentos, aprobar documento, observar documento, bandeja, archivo'],
  ['DOCUMENTOS', '¿Cuándo debo observar el certificado médico?',
    'Obsérvalo si no es de una clínica autorizada por el MTC o si tiene más de 6 meses desde su emisión. El sistema no deja aprobar un certificado vencido.',
    'certificado médico vencido, vigencia, 6 meses, clínica autorizada, observar certificado'],
  ['PAGOS', '¿Cómo verifico un pago?',
    'Compara el número de operación, la fecha y el monto con el reporte del SAT Huamanga: S/ 69.90 para la II-B y S/ 69.40 para la II-C. Si coincide, márcalo verificado y el expediente pasa a cita; si no, obsérvalo o recházalo indicando el motivo.',
    'verificar pago, aprobar pago, voucher, número de operación, SAT, monto, rechazar pago, observar pago'],
  ['TRAMITE', '¿Cómo verifico en el SNC y en el récord de sanciones?',
    'En la etapa de emisión, consulta con el DNI del postulante el SNC (licencias.mtc.gob.pe) para el certificado médico y, si es II-C, la constancia COFIPRO; y el récord del conductor (recordconductor.mtc.gob.pe) para multas y sanciones. Registra conforme o no conforme con el detalle. Sin todas conformes no se puede emitir.',
    'verificar SNC, portal MTC, récord del conductor, sanciones, papeletas, COFIPRO, verificación oficial'],
  ['TRAMITE', '¿Qué hago con un expediente devuelto por el supervisor?',
    'Aparece en «Devueltos por el supervisor» de tu bandeja. Corrige lo que indica la observación y márcala como atendida explicando qué hiciste (mínimo 10 caracteres). El supervisor vuelve a revisarlo para autorizar la emisión.',
    'observación del supervisor, devuelto, atender observación, corregir expediente'],
  ['TRAMITE', '¿Cómo registro el número de licencia para el SNC?',
    'Cuando el expediente está en «Emitida», ábrelo y registra el número de la licencia (6 a 15 letras o números, por ejemplo Q45892014). El postulante recibe un aviso y lo ve en sus resultados. Cada expediente tiene un solo número.',
    'registrar licencia, número de licencia, SNC, emitida, cargar licencia'],
  ['TRAMITE', '¿Cómo respondo las consultas que deriva la IA?',
    'Entra a «Consultas» y responde las preguntas que la IA no pudo contestar o que piden una acción. El postulante ve tu respuesta en su conversación y recibe un aviso. La respuesta queda registrada en la auditoría y no se puede editar.',
    'consultas derivadas, responder consulta, preguntas de postulantes, chat'],
  ['TRAMITE', '¿Cuál es el plazo para atender un expediente?',
    'El trámite tiene un plazo legal de 10 días hábiles desde que se inicia. Si vence sin respuesta, opera el silencio administrativo positivo. Prioriza los expedientes con más días transcurridos.',
    'plazo legal, días hábiles, silencio administrativo, vencido, prioridad, demora'],
  ['EVALUACIONES', '¿Cómo registro el resultado de un examen?',
    'En «Exámenes» elige al postulante y registra la nota de 0 a 20; aprueba con 14. En manejo marca si hubo falta eliminatoria: desaprueba aunque la nota sea mayor. El resultado queda registrado hasta que el supervisor lo valida.',
    'registrar nota, resultado, calificar, puntaje, falta eliminatoria, evaluador'],
  ['EVALUACIONES', '¿Puedo corregir un resultado que ya registré?',
    'Sí, mientras el supervisor no lo valide: corrígelo indicando el motivo y no se gasta otro intento. Una vez validado, el resultado queda bloqueado y nadie puede cambiarlo.',
    'corregir nota, error de digitación, modificar resultado, bloqueado, validado'],
  ['EVALUACIONES', '¿Qué pasa cuando un postulante desaprueba?',
    'Tiene hasta 3 intentos por examen sin volver a pagar. Al validarse un desaprobado, el postulante reserva otra cita. Si desaprueba el tercer intento, el examen queda agotado.',
    'desaprobado, intentos, reintento, agotado, tercer intento'],
  ['CITAS', '¿Qué días se toman los exámenes?',
    'Conocimientos de lunes a miércoles y manejo de martes a viernes. El examen de manejo solo se reserva después de aprobar y validar conocimientos.',
    'días de examen, horario, calendario, conocimientos, manejo'],
  ['EVALUACIONES', '¿Cómo valido un resultado?',
    'En «Por validar» revisa la nota y valídala. Queda bloqueada para siempre en el historial; si aprobó, el expediente avanza a la siguiente etapa.',
    'validar resultado, supervisor, bloquear nota, aprobar examen'],
  ['TRAMITE', '¿Cuándo autorizo la emisión de una licencia?',
    'En «Autorizar emisión» abre el expediente y revisa documentos, pago, exámenes y las verificaciones del gestor. Autoriza solo si todas están conformes y no hay observación abierta. Si algo no cuadra, observa el expediente con el motivo y vuelve al gestor.',
    'autorizar emisión, emitir licencia, observar expediente, supervisor, revisión final'],
  ['CITAS', '¿Cómo habilito horarios de examen?',
    'En «Cupos» elige el tipo, la fecha, la hora y la capacidad. Respeta los días de cada examen; no se permiten dos horarios iguales ni fechas pasadas.',
    'habilitar cupos, horarios, capacidad, crear cupo, administrador'],
  ['TRAMITE', '¿Cómo mantengo las respuestas de la IA?',
    'En «Contenido del asistente» agrega o corrige preguntas y respuestas aprobadas, y elige si son para postulantes o para el personal. La IA solo responde con ese contenido. Si una consulta se deriva varias veces, conviene crear un contenido para ella.',
    'contenido del asistente, respuestas aprobadas, entrenar, agregar pregunta, IA'],
  ['TRAMITE', '¿Cómo gestiono las cuentas del personal?',
    'En «Usuarios» crea las cuentas del gestor, evaluador y supervisor, y desactiva las que ya no se usan. Cada operación del personal queda registrada en la auditoría.',
    'usuarios, crear cuenta, desactivar, contraseña, personal'],
  ['TRAMITE', '¿Qué registra la auditoría?',
    'Quién hizo cada operación importante, cuándo y qué cambió: revisión de documentos y pagos, resultados, validaciones, verificaciones, emisión, licencias, consultas respondidas y cambios de contenido.',
    'auditoría, historial, quién cambió, trazabilidad, registro de operaciones'],
];

export class AsistentePorRol1795094200000 implements MigrationInterface {
  name = 'AsistentePorRol1795094200000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE TYPE "public"."contenidos_audiencia_enum" AS ENUM('POSTULANTE', 'PERSONAL')`);
    await q.query(`ALTER TABLE "contenidos_asistente" ADD "audiencia" "public"."contenidos_audiencia_enum" NOT NULL DEFAULT 'POSTULANTE'`);
    for (const [tema, pregunta, respuesta, palabras] of CONTENIDOS_PERSONAL) {
      await q.query(`INSERT INTO contenidos_asistente (tema, audiencia, pregunta, respuesta, palabras_clave) VALUES ($1, 'PERSONAL', $2, $3, $4)`, [tema, pregunta, respuesta, palabras]);
    }
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DELETE FROM contenidos_asistente WHERE audiencia = 'PERSONAL'`);
    await q.query(`ALTER TABLE "contenidos_asistente" DROP COLUMN "audiencia"`);
    await q.query(`DROP TYPE "public"."contenidos_audiencia_enum"`);
  }
}
