import { Body, Controller, Get, HttpCode, Inject, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiProperty, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Rol, UsuarioActual } from '../../../compartido/dominio/rol';
import { Publico, Roles, Usuario } from '../../../compartido/seguridad/decoradores';
import { CambiarRolUseCase } from '../aplicacion/cambiar-rol.use-case';
import { IniciarSesionUseCase } from '../aplicacion/iniciar-sesion.use-case';
import { REPOSITORIO_USUARIOS, RepositorioUsuarios } from '../dominio/contratos';

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
  @HttpCode(200)
  @ApiOperation({ summary: 'Iniciar sesión (RF01)', description: 'Devuelve un token JWT con el rol de la cuenta.' })
  @ApiUnauthorizedResponse({ description: 'Usuario o contraseña incorrectos' })
  login(@Body() dto: LoginDto) {
    return this.iniciarSesion.ejecutar(dto.usuario, dto.clave);
  }

  @ApiBearerAuth()
  @Get('auth/yo')
  @ApiOperation({ summary: 'Datos del usuario autenticado' })
  yo(@Usuario() usuario: UsuarioActual) {
    return usuario;
  }

  @ApiBearerAuth()
  @Roles(Rol.ADMINISTRADOR)
  @Get('usuarios')
  @ApiOperation({ summary: 'Listar cuentas (RF16)' })
  async listar() {
    return (await this.usuarios.listar()).map((u) => ({ id: u.id, usuario: u.usuario, nombre: u.nombre, rol: u.rol, activo: u.activo }));
  }

  @ApiBearerAuth()
  @Roles(Rol.ADMINISTRADOR)
  @Patch('usuarios/:id/rol')
  @ApiOperation({ summary: 'Cambiar el rol de una cuenta del personal (RF16, auditable)' })
  @ApiOkResponse({ description: 'Rol actualizado' })
  cambiar(@Param('id', ParseIntPipe) id: number, @Body() dto: CambiarRolDto, @Usuario() admin: UsuarioActual) {
    return this.cambiarRol.ejecutar(id, dto.rol, admin);
  }
}
