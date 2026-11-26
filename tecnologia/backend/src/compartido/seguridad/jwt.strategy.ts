import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Rol, UsuarioActual } from '../dominio/rol';

interface CargaToken {
  sub: number;
  usuario: string;
  rol: Rol;
  postulanteId: number | null;
  nombre?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRETO'),
    });
  }

  validate(carga: CargaToken): UsuarioActual {
    return { id: carga.sub, usuario: carga.usuario, rol: carga.rol, postulanteId: carga.postulanteId, nombre: carga.nombre };
  }
}
