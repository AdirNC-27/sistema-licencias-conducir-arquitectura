import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiConflictResponse, ApiOperation, ApiProperty, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsString, Length, Matches, MinLength } from 'class-validator';
import { ROLES_PERSONAL, UsuarioActual } from '../../../compartido/dominio/rol';
import { Publico, Roles, Usuario } from '../../../compartido/seguridad/decoradores';
import { ConsultarPostulantesUseCase } from '../aplicacion/consultar-postulantes.use-case';
import { RegistrarPostulanteUseCase } from '../aplicacion/registrar-postulante.use-case';

class RegistroDto {
  @ApiProperty({ example: '45892014' }) @Matches(/^\d{8}$/, { message: 'El DNI debe tener 8 dígitos' }) dni!: string;
  @ApiProperty({ example: 'postulante@correo.com' }) @IsEmail() correo!: string;
  @ApiProperty({ example: '987654321' }) @IsString() @Length(9, 9) celular!: string;
  @ApiProperty({ example: 'demo123' }) @IsString() @MinLength(6) clave!: string;
}

@ApiTags('Postulantes')
@Controller('postulantes')
export class PostulantesController {
  constructor(
    private readonly registrar: RegistrarPostulanteUseCase,
    private readonly consultar: ConsultarPostulantesUseCase,
  ) {}

  @Publico()
  @Post()
  @ApiOperation({ summary: 'Crear cuenta de postulante con DNI validado en API Perú (RF03, RF04)' })
  @ApiConflictResponse({ description: 'El DNI ya tiene una cuenta' })
  crear(@Body() dto: RegistroDto) {
    return this.registrar.ejecutar(dto);
  }

  @ApiBearerAuth()
  @Get()
  @Roles(...ROLES_PERSONAL)
  @ApiQuery({ name: 'ids', example: '1,2,3' })
  @ApiOperation({ summary: 'Nombres y DNI de varios postulantes (para la bandeja del personal)' })
  varios(@Query('ids') ids = '') {
    return this.consultar.varios(ids.split(',').map(Number).filter((n) => Number.isInteger(n) && n > 0));
  }

  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Datos de un postulante (el propio o, para el personal, cualquiera)' })
  uno(@Param('id', ParseIntPipe) id: number, @Usuario() usuario: UsuarioActual) {
    return this.consultar.uno(id, usuario);
  }
}
