import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsString, Length, Matches, MinLength } from 'class-validator';
import { ROLES_PERSONAL, UsuarioActual } from '../../../compartido/dominio/rol';
import { Publico, Roles, Usuario } from '../../../compartido/seguridad/decoradores';
import { ConsultarPostulantesUseCase } from '../aplicacion/consultar-postulantes.use-case';
import { RegistrarPostulanteUseCase } from '../aplicacion/registrar-postulante.use-case';
import { Contrato } from '../../../compartido/presentacion/contrato';
import { PostulanteCreadoRespuesta, PostulanteRespuesta } from './respuestas';

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
  @Contrato({ resumen: 'Crear cuenta de postulante con DNI validado en API Perú (RF03, RF04)', publico: true, exito: { estado: 201, descripcion: 'Cuenta creada con el nombre que devuelve API Perú', tipo: PostulanteCreadoRespuesta }, errores: [400, [404, 'El DNI no existe en el servicio de identidad'], [409, 'El DNI ya tiene una cuenta'], [422, 'Falta configurar el token de API Perú en el servidor']] })
  crear(@Body() dto: RegistroDto) {
    return this.registrar.ejecutar(dto);
  }

  @ApiBearerAuth()
  @Get()
  @Roles(...ROLES_PERSONAL)
  @ApiQuery({ name: 'ids', example: '1,2,3' })
  @Contrato({ resumen: 'Nombres y DNI de varios postulantes (bandeja del personal, una sola consulta)', exito: { descripcion: 'Postulantes encontrados; los identificadores inexistentes se omiten', tipo: PostulanteRespuesta, lista: true }, errores: [403] })
  varios(@Query('ids') ids = '') {
    return this.consultar.varios(ids.split(',').map(Number).filter((n) => Number.isInteger(n) && n > 0));
  }

  @ApiBearerAuth()
  @Get(':id')
  @Contrato({ resumen: 'Datos de un postulante (el propio o, para el personal, cualquiera)', exito: { descripcion: 'Datos del postulante', tipo: PostulanteRespuesta }, errores: [400, [403, 'Un postulante solo puede ver sus propios datos'], [404, 'No existe el postulante']] })
  uno(@Param('id', ParseIntPipe) id: number, @Usuario() usuario: UsuarioActual) {
    return this.consultar.uno(id, usuario);
  }
}
