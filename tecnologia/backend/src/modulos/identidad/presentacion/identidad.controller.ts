import { Body, Controller, Get, Inject, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Rol, UsuarioActual } from '../../../compartido/dominio/rol';
import { Publico, Roles, Usuario } from '../../../compartido/seguridad/decoradores';
import { CambiarRolUseCase } from '../aplicacion/cambiar-rol.use-case';
import { IniciarSesionUseCase } from '../aplicacion/iniciar-sesion.use-case';
import { REPOSITORIO_USUARIOS, RepositorioUsuarios } from '../dominio/contratos';
import { Contrato } from '../../../compartido/presentacion/contrato';
import { SesionRespuesta, UsuarioTokenRespuesta, CuentaRespuesta, RolCambiadoRespuesta } from './respuestas';

class LoginDto {
  @ApiProperty({ example: 'gestor', description: 'DNI del postulante o usuario del personal' })
  @IsString() @IsNotEmpty() usuario!: string;
  @ApiProperty({ example: 'demo123' }) @IsString() @IsNotEmpty() clave!: string;
}

class CambiarRolDto {
  @ApiProperty({ enum: Rol, example: Rol.SUPERVISOR }) @IsEnum(Rol) rol!: Rol;
}

@ApiTags('Identidad y acceso')
@Controller()
export class IdentidadController {
  constructor(
    private readonly iniciarSesion: IniciarSesionUseCase,
    private readonly cambiarRol: CambiarRolUseCase,
    @Inject(REPOSITORIO_USUARIOS) private readonly usuarios: RepositorioUsuarios,
  ) {}

  @Publico()
  @Post('auth/login')
  @Contrato({ resumen: 'Iniciar sesión (RF01)', descripcion: 'Devuelve un token JWT con el rol de la cuenta. Postulantes con su DNI; personal con su usuario.', publico: true, exito: { descripcion: 'Sesión iniciada', tipo: SesionRespuesta }, errores: [400, [401, 'Usuario o contraseña incorrectos']] })
  login(@Body() dto: LoginDto) {
    return this.iniciarSesion.ejecutar(dto.usuario, dto.clave);
  }

  @ApiBearerAuth()
  @Get('auth/yo')
  @Contrato({ resumen: 'Datos del usuario autenticado', exito: { descripcion: 'Usuario del token', tipo: UsuarioTokenRespuesta } })
  yo(@Usuario() usuario: UsuarioActual) {
    return usuario;
  }

  @ApiBearerAuth()
  @Roles(Rol.ADMINISTRADOR)
  @Get('usuarios')
  @Contrato({ resumen: 'Listar cuentas (RF16)', exito: { descripcion: 'Cuentas del sistema', tipo: CuentaRespuesta, lista: true }, errores: [403] })
  async listar() {
    return (await this.usuarios.listar()).map((u) => ({ id: u.id, usuario: u.usuario, nombre: u.nombre, rol: u.rol, activo: u.activo }));
  }

  @ApiBearerAuth()
  @Roles(Rol.ADMINISTRADOR)
  @Patch('usuarios/:id/rol')
  @Contrato({ resumen: 'Cambiar el rol de una cuenta del personal (RF16, auditable)', exito: { descripcion: 'Rol actualizado', tipo: RolCambiadoRespuesta }, errores: [400, 403, [404, 'No existe el usuario'], [422, 'Un postulante no puede pasar a ser personal ni al revés']] })
  cambiar(@Param('id', ParseIntPipe) id: number, @Body() dto: CambiarRolDto, @Usuario() admin: UsuarioActual) {
    return this.cambiarRol.ejecutar(id, dto.rol, admin);
  }
}
