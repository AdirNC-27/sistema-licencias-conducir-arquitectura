import { Body, Controller, Get, HttpCode, Param, ParseEnumPipe, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiConflictResponse, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Rol, UsuarioActual } from '../../../compartido/dominio/rol';
import { Roles, Usuario } from '../../../compartido/seguridad/decoradores';
import { ConsultarEvaluacionesUseCase, CorregirResultadoUseCase, RegistrarResultadoUseCase, ValidarResultadoUseCase } from '../aplicacion/casos-de-uso';
import { TipoEvaluacion } from '../dominio/modelo/tipos';

class ResultadoDto {
  @ApiProperty({ example: 16, description: 'Nota de 0 a 20' }) @IsInt() @Min(0) @Max(20) puntaje!: number;
  @ApiPropertyOptional({ example: false, description: 'Solo manejo' }) @IsOptional() @IsBoolean() faltaEliminatoria?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(250) observaciones?: string;
}

class CorreccionDto extends ResultadoDto {
  @ApiProperty({ example: 'Error de digitación' }) @IsString() @IsNotEmpty() @MaxLength(250) motivo!: string;
}

@ApiTags('Evaluaciones')
@ApiBearerAuth()
@Controller()
export class EvaluacionesController {
  constructor(
    private readonly registrar: RegistrarResultadoUseCase,
    private readonly corregir: CorregirResultadoUseCase,
    private readonly validar: ValidarResultadoUseCase,
    private readonly consultar: ConsultarEvaluacionesUseCase,
  ) {}

  @Post('expedientes/:id/evaluaciones/:tipo/resultado')
  @Roles(Rol.EVALUADOR)
  @ApiOperation({ summary: 'Registrar el resultado de un intento (RF08, máximo 3)' })
  @ApiConflictResponse({ description: 'Intentos agotados, resultado pendiente de validar o etapa incorrecta' })
  registrarResultado(
    @Param('id', ParseIntPipe) id: number,
    @Param('tipo', new ParseEnumPipe(TipoEvaluacion)) tipo: TipoEvaluacion,
    @Body() dto: ResultadoDto,
    @Usuario() evaluador: UsuarioActual,
  ) {
    return this.registrar.ejecutar(id, tipo, dto, evaluador);
  }

  @Patch('evaluaciones/:id/resultado')
  @Roles(Rol.EVALUADOR)
  @ApiOperation({ summary: 'Corregir el resultado antes de la validación (RF09)' })
  @ApiConflictResponse({ description: 'El resultado ya fue validado: no se puede modificar (EQ-09)' })
  corregirResultado(@Param('id', ParseIntPipe) id: number, @Body() dto: CorreccionDto, @Usuario() evaluador: UsuarioActual) {
    return this.corregir.ejecutar(id, dto, dto.motivo, evaluador);
  }

  @Post('evaluaciones/:id/validacion')
  @HttpCode(200)
  @Roles(Rol.SUPERVISOR)
  @ApiOperation({ summary: 'Validar el resultado: queda bloqueado (RF09, DA04)' })
  @ApiConflictResponse({ description: 'El resultado ya estaba validado' })
  validarResultado(@Param('id', ParseIntPipe) id: number, @Usuario() supervisor: UsuarioActual) {
    return this.validar.ejecutar(id, supervisor);
  }

  @Get('evaluaciones/por-validar')
  @Roles(Rol.SUPERVISOR, Rol.EVALUADOR)
  @ApiOperation({ summary: 'Resultados registrados que esperan la validación del supervisor' })
  porValidar() {
    return this.consultar.pendientesDeValidar();
  }

  @Get('expedientes/:id/evaluaciones')
  @ApiOperation({ summary: 'Resultados del expediente (RF19: el postulante ve solo los validados)' })
  listar(@Param('id', ParseIntPipe) id: number, @Usuario() usuario: UsuarioActual) {
    return this.consultar.ejecutar(id, usuario);
  }
}
