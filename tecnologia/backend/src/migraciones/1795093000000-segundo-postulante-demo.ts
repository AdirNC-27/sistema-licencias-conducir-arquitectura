import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Segundo postulante de demostración (clave demo123). Permite probar la privacidad entre postulantes
 * (EQ-02) desde Postman: cada uno intenta ver el expediente del otro.
 */
const CLAVE_DEMO = '$2a$10$mNPMhuBUTq6FXU/yUGQ2Pe5uvJXkSjYk2ZDIumph1xPNC2JOG6EVS';

export class SegundoPostulanteDemo1795093000000 implements MigrationInterface {
  name = 'SegundoPostulanteDemo1795093000000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(
      `INSERT INTO postulantes (dni, nombres, apellidos, correo, celular) VALUES ('70123456', 'MARIA ELENA', 'ROJAS PALOMINO', 'postulante2@correo.example', '912345678')`,
    );
    await q.query(
      `INSERT INTO usuarios (usuario, nombre, clave_cifrada, rol, postulante_id)
       VALUES ('70123456', 'MARIA ELENA ROJAS PALOMINO', $1, 'POSTULANTE', (SELECT id FROM postulantes WHERE dni = '70123456'))`,
      [CLAVE_DEMO],
    );
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DELETE FROM usuarios WHERE usuario = '70123456'`);
    await q.query(`DELETE FROM postulantes WHERE dni = '70123456'`);
  }
}
