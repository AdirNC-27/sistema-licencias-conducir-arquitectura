import { Inject, Injectable } from '@nestjs/common';
import { CredencialesInvalidasError } from '../../../compartido/dominio/errores';
import { CIFRADOR_CLAVES, CifradorClaves, EMISOR_TOKENS, EmisorTokens, REPOSITORIO_USUARIOS, RepositorioUsuarios } from '../dominio/contratos';

export interface Sesion {
  token: string;
  usuario: { id: number; usuario: string; nombre: string; rol: string; postulanteId: number | null };
}

/** RF01: un solo login para todos. El rol lo define la cuenta, no se elige al ingresar. */
@Injectable()
export class IniciarSesionUseCase {
  constructor(
    @Inject(REPOSITORIO_USUARIOS) private readonly usuarios: RepositorioUsuarios,
    @Inject(CIFRADOR_CLAVES) private readonly cifrador: CifradorClaves,
    @Inject(EMISOR_TOKENS) private readonly tokens: EmisorTokens,
  ) {}

  async ejecutar(usuario: string, clave: string): Promise<Sesion> {
    const encontrado = await this.usuarios.buscarPorUsuario(usuario.trim().toLowerCase());
    if (!encontrado || !encontrado.activo || !(await this.cifrador.comparar(clave, encontrado.claveCifrada))) {
      throw new CredencialesInvalidasError('Usuario o contraseña incorrectos');
    }
    return {
      token: this.tokens.emitir(encontrado),
      usuario: {
        id: encontrado.id,
        usuario: encontrado.usuario,
        nombre: encontrado.nombre,
        rol: encontrado.rol,
        postulanteId: encontrado.postulanteId,
      },
    };
  }
}
