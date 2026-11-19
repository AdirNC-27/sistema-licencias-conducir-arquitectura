import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Datos de demostración: cuentas por rol, un postulante, requisitos del TUPA MPH y cupos de examen.
 * Clave de todas las cuentas: demo123 (cifrada con bcrypt).
 */
const CLAVE_DEMO = '$2a$10$mNPMhuBUTq6FXU/yUGQ2Pe5uvJXkSjYk2ZDIumph1xPNC2JOG6EVS';

function proximosDias(cantidad: number): string[] {
  const dias: string[] = [];
  const d = new Date();
  for (let i = 1; dias.length < cantidad; i++) {
    const f = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + i));
    if (f.getUTCDay() >= 1 && f.getUTCDay() <= 5) dias.push(f.toISOString().slice(0, 10));
  }
  return dias;
}

export class DatosIniciales1795092800000 implements MigrationInterface {
  name = 'DatosIniciales1795092800000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(
      `INSERT INTO postulantes (dni, nombres, apellidos, correo, celular) VALUES ('45892014', 'JUAN CARLOS', 'QUISPE MENDOZA', 'postulante@correo.example', '987654321')`,
    );
    await q.query(
      `INSERT INTO usuarios (usuario, nombre, clave_cifrada, rol, postulante_id) VALUES
        ('gestor', 'Carlos Mendoza (Gestor de trámites)', $1, 'GESTOR', NULL),
        ('evaluador', 'Rosa Vargas (Evaluadora)', $1, 'EVALUADOR', NULL),
        ('supervisor', 'Elena Morales (Supervisora)', $1, 'SUPERVISOR', NULL),
        ('admin', 'Miguel Valenzuela (Administrador TI)', $1, 'ADMINISTRADOR', NULL),
        ('45892014', 'JUAN CARLOS QUISPE MENDOZA', $1, 'POSTULANTE', (SELECT id FROM postulantes WHERE dni = '45892014'))`,
      [CLAVE_DEMO],
    );
    // Requisitos del TUPA MPH · emisión de licencia clase B (PA6190033B)
    await q.query(`INSERT INTO requisitos (tipo_tramite, categoria, orden, descripcion, codigo_documento) VALUES
      ('EMISION', NULL, 1, 'Solicitud con declaración jurada de no estar privado de conducir. Ser mayor de 18 años', 'DECLARACION_JURADA'),
      ('EMISION', NULL, 2, 'Certificado médico de una clínica autorizada por el MTC, registrado en el SNC (vigencia de 6 meses)', 'CERTIFICADO_MEDICO'),
      ('EMISION', NULL, 3, 'Dos fotografías tamaño carné a color', 'FOTOGRAFIA'),
      ('EMISION', 'II-B', 4, 'Pago único de S/ 69.90 en el SAT Huamanga (incluye los dos exámenes)', NULL),
      ('EMISION', 'II-C', 4, 'Pago único de S/ 69.40 en el SAT Huamanga (incluye los dos exámenes)', NULL),
      ('EMISION', NULL, 5, 'Aprobar el examen de conocimientos (3 intentos sin pagar de nuevo)', NULL),
      ('EMISION', NULL, 6, 'Aprobar el examen de manejo (3 intentos sin pagar de nuevo)', NULL),
      ('EMISION', 'II-C', 7, 'Constancia COFIPRO del curso de formación para conductores de mototaxi', 'CONSTANCIA_COFIPRO'),
      ('EMISION', 'II-C', 8, 'No tener multas ni sanciones pendientes (Registro Nacional de Sanciones)', NULL)`);
    // Cupos de examen para los próximos 10 días hábiles (RF21)
    for (const dia of proximosDias(10)) {
      const semana = new Date(`${dia}T00:00:00Z`).getUTCDay();
      if (semana >= 1 && semana <= 3) {
        await q.query(`INSERT INTO cupos (fecha, hora, tipo, capacidad) VALUES ($1, '08:30', 'CONOCIMIENTOS', 15), ($1, '10:30', 'CONOCIMIENTOS', 15)`, [dia]);
      }
      if (semana >= 2 && semana <= 5) {
        await q.query(`INSERT INTO cupos (fecha, hora, tipo, capacidad) VALUES ($1, '08:00', 'MANEJO', 8), ($1, '14:00', 'MANEJO', 8)`, [dia]);
      }
    }
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DELETE FROM cupos`);
    await q.query(`DELETE FROM requisitos`);
    await q.query(`DELETE FROM usuarios WHERE usuario IN ('gestor','evaluador','supervisor','admin','45892014')`);
    await q.query(`DELETE FROM postulantes WHERE dni = '45892014'`);
  }
}
