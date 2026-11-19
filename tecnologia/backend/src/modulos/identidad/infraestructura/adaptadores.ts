import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { CifradorClaves, EmisorTokens } from '../dominio/contratos';
import { Usuario } from '../dominio/usuario';

@Injectable()
export class CifradorBcrypt implements CifradorClaves {
  cifrar(clave: string): Promise<string> {
    return bcrypt.hash(clave, 10);
  }
  comparar(clave: string, cifrada: string): Promise<boolean> {
    return bcrypt.compare(clave, cifrada);
  }
}

@Injectable()
export class EmisorTokensJwt implements EmisorTokens {
  constructor(private readonly jwt: JwtService) {}
  emitir(usuario: Usuario): string {
    return this.jwt.sign({ sub: usuario.id, usuario: usuario.usuario, rol: usuario.rol, postulanteId: usuario.postulanteId });
  }
}
