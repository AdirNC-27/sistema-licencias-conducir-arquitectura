import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy } from '../../compartido/seguridad/jwt.strategy';
import { CambiarRolUseCase } from './aplicacion/cambiar-rol.use-case';
import { IniciarSesionUseCase } from './aplicacion/iniciar-sesion.use-case';
import { CIFRADOR_CLAVES, EMISOR_TOKENS, REPOSITORIO_USUARIOS } from './dominio/contratos';
import { CifradorBcrypt, EmisorTokensJwt } from './infraestructura/adaptadores';
import { RepositorioUsuariosTypeOrm } from './infraestructura/repositorio-usuarios.typeorm';
import { UsuarioOrmEntity } from './infraestructura/usuario.orm-entity';
import { IdentidadController } from './presentacion/identidad.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([UsuarioOrmEntity]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRETO'),
        signOptions: { expiresIn: '8h' },
      }),
    }),
  ],
  controllers: [IdentidadController],
  providers: [
    IniciarSesionUseCase,
    CambiarRolUseCase,
    JwtStrategy,
    { provide: REPOSITORIO_USUARIOS, useClass: RepositorioUsuariosTypeOrm },
    { provide: CIFRADOR_CLAVES, useClass: CifradorBcrypt },
    { provide: EMISOR_TOKENS, useClass: EmisorTokensJwt },
  ],
  exports: [REPOSITORIO_USUARIOS, CIFRADOR_CLAVES],
})
export class IdentidadModule {}
