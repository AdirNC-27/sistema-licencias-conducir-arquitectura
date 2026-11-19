import { Inject, Injectable } from '@nestjs/common';
import { ConflictoError } from '../../../compartido/dominio/errores';
import { Rol } from '../../../compartido/dominio/rol';
import { CIFRADOR_CLAVES, CifradorClaves, REPOSITORIO_USUARIOS, RepositorioUsuarios } from '../../identidad/dominio/contratos';
import { REPOSITORIO_POSTULANTES, RepositorioPostulantes, VERIFICADOR_IDENTIDAD, VerificadorIdentidad } from '../dominio/contratos';
import { Dni } from '../dominio/postulante';

export interface DatosRegistro {
  dni: string;
  correo: string;
  celular: string;
  clave: string;
}

/** RF03 y RF04: registro del postulante con su DNI validado en API Perú. */
@Injectable()
export class RegistrarPostulanteUseCase {
  constructor(
    @Inject(VERIFICADOR_IDENTIDAD) private readonly verificador: VerificadorIdentidad,
    @Inject(REPOSITORIO_POSTULANTES) private readonly postulantes: RepositorioPostulantes,
    @Inject(REPOSITORIO_USUARIOS) private readonly usuarios: RepositorioUsuarios,
    @Inject(CIFRADOR_CLAVES) private readonly cifrador: CifradorClaves,
  ) {}

  async ejecutar(datos: DatosRegistro) {
    const dni = new Dni(datos.dni);
    if (await this.postulantes.existeDni(dni.valor)) throw new ConflictoError('Ese DNI ya tiene una cuenta');
    const identidad = await this.verificador.consultar(dni.valor);
    const postulante = await this.postulantes.crear({
      dni: dni.valor,
      nombres: identidad.nombres,
      apellidos: `${identidad.apellidoPaterno} ${identidad.apellidoMaterno}`.trim(),
      correo: datos.correo.trim().toLowerCase(),
      celular: datos.celular.trim(),
    });
    await this.usuarios.crear({
      usuario: dni.valor,
      nombre: postulante.nombreCompleto,
      claveCifrada: await this.cifrador.cifrar(datos.clave),
      rol: Rol.POSTULANTE,
      postulanteId: postulante.id,
    });
    return { id: postulante.id, dni: postulante.dni, nombre: postulante.nombreCompleto, correo: postulante.correo };
  }
}
