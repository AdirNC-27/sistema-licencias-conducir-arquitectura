import { Body, Controller, Get, Param, ParseEnumPipe, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Rol, UsuarioActual } from '../../../compartido/dominio/rol';
import { Roles, Usuario } from '../../../compartido/seguridad/decoradores';
import { ConsultarEvaluacionesUseCase, CorregirResultadoUseCase, RegistrarResultadoUseCase, ValidarResultadoUseCase } from '../aplicacion/casos-de-uso';
import { TipoEvaluacion } from '../dominio/modelo/tipos';
import { Contrato } from '../../../compartido/presentacion/contrato';
import { EvaluacionRespuesta } from './respuestas';

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
  @Contrato({ resumen: 'Registrar el resultado de un intento (RF08, máximo 3)', exito: { estado: 201, descripcion: 'Resultado registrado; queda pendiente de validación', tipo: EvaluacionRespuesta }, errores: [400, 403, [404, 'No existe el expediente'], [409, 'Intentos agotados, resultado sin validar o etapa incorrecta']] })
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
  @Contrato({ resumen: 'Corregir el resultado antes de la validación (RF09, auditable)', exito: { descripcion: 'Resultado corregido', tipo: EvaluacionRespuesta }, errores: [400, 403, [404, 'No existe la evaluación'], [409, 'El resultado ya fue validado: no se puede modificar (EQ-09)']] })
  corregirResultado(@Param('id', ParseIntPipe) id: number, @Body() dto: CorreccionDto, @Usuario() evaluador: UsuarioActual) {
    return this.corregir.ejecutar(id, dto, dto.motivo, evaluador);
  }

  @Post('evaluaciones/:id/validacion')
  @Roles(Rol.SUPERVISOR)
  @Contrato({ resumen: 'Validar el resultado: queda bloqueado (RF09, DA04)', descripcion: 'Si el postulante aprobó, el expediente avanza a la siguiente etapa.', exito: { descripcion: 'Resultado validado y bloqueado', tipo: EvaluacionRespuesta }, errores: [400, 403, [404, 'No existe la evaluación'], [409, 'El resultado ya estaba validado o no hay resultado registrado']] })
  validarResultado(@Param('id', ParseIntPipe) id: number, @Usuario() supervisor: UsuarioActual) {
    return this.validar.ejecutar(id, supervisor);
  }

  @Get('evaluaciones/por-validar')
  @Roles(Rol.SUPERVISOR, Rol.EVALUADOR)
  @Contrato({ resumen: 'Resultados registrados que esperan la validación del supervisor', exito: { descripcion: 'Evaluaciones en estado REGISTRADO', tipo: EvaluacionRespuesta, lista: true }, errores: [403] })
  porValidar() {
    return this.consultar.pendientesDeValidar();
  }

  @Get('expedientes/:id/evaluaciones')
  @Contrato({ resumen: 'Resultados del expediente (RF19)', descripcion: 'El postulante recibe resultadoActual en null; el personal lo recibe completo.', exito: { descripcion: 'Evaluaciones del expediente', tipo: EvaluacionRespuesta, lista: true }, errores: [400, [403, 'El expediente pertenece a otro postulante'], [404, 'No existe el expediente']] })
  listar(@Param('id', ParseIntPipe) id: number, @Usuario() usuario: UsuarioActual) {
    return this.consultar.ejecutar(id, usuario);
  }
}
