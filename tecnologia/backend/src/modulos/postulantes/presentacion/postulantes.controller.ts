import { Body, Controller, Post } from '@nestjs/common';
import { ApiConflictResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsString, Length, Matches, MinLength } from 'class-validator';
import { Publico } from '../../../compartido/seguridad/decoradores';
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
  constructor(private readonly registrar: RegistrarPostulanteUseCase) {}

  @Publico()
  @Post()
  @ApiOperation({ summary: 'Crear cuenta de postulante con DNI validado en API Perú (RF03, RF04)' })
  @ApiConflictResponse({ description: 'El DNI ya tiene una cuenta' })
  crear(@Body() dto: RegistroDto) {
    return this.registrar.ejecutar(dto);
  }
}
