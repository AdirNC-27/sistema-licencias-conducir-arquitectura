import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiConflictResponse, ApiForbiddenResponse, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Categoria, TipoTramite } from '../../../compartido/dominio/categoria';
import { Rol, ROLES_PERSONAL, UsuarioActual } from '../../../compartido/dominio/rol';
import { Roles, Usuario } from '../../../compartido/seguridad/decoradores';
import { AutorizarEmisionUseCase, ConsultarExpedienteUseCase, CrearExpedienteUseCase } from '../aplicacion/casos-de-uso';
import { Etapa } from '../dominio/etapa';

class CrearExpedienteDto {
  @ApiProperty({ enum: TipoTramite, example: TipoTramite.EMISION }) @IsEnum(TipoTramite) tipoTramite!: TipoTramite;
  @ApiProperty({ enum: Categoria, example: Categoria.II_C }) @IsEnum(Categoria) categoria!: Categoria;
}

class FiltroDto {
  @ApiPropertyOptional({ enum: Etapa }) @IsOptional() @IsEnum(Etapa) etapa?: Etapa;
  @ApiPropertyOptional({ enum: Categoria }) @IsOptional() @IsEnum(Categoria) categoria?: Categoria;
  @ApiPropertyOptional({ type: Number, default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) pagina: number = 1;
  @ApiPropertyOptional({ type: Number, default: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) tamano: number = 20;
}

@ApiTags('Expedientes y seguimiento')
@ApiBearerAuth()
@Controller('expedientes')
export class ExpedientesController {
  constructor(
    private readonly crear: CrearExpedienteUseCase,
    private readonly consultar: ConsultarExpedienteUseCase,
    private readonly autorizar: AutorizarEmisionUseCase,
  ) {}

  @Post()
  @Roles(Rol.POSTULANTE)
  @ApiOperation({ summary: 'Registrar una solicitud de licencia (RF02)' })
  @ApiConflictResponse({ description: 'Ya tiene un trámite en curso' })
  registrar(@Body() dto: CrearExpedienteDto, @Usuario() usuario: UsuarioActual) {
    return this.crear.ejecutar(usuario, dto.tipoTramite, dto.categoria);
  }

  @Get('mios')
  @Roles(Rol.POSTULANTE)
  @ApiOperation({ summary: 'Mis trámites con etapa y plazo (RF10)' })
  mios(@Usuario() usuario: UsuarioActual) {
    return this.consultar.mios(usuario);
  }

  @Get()
  @Roles(...ROLES_PERSONAL)
  @ApiOperation({ summary: 'Bandeja de expedientes del personal, con filtros y paginación' })
  bandeja(@Query() filtro: FiltroDto) {
    return this.consultar.bandeja({ etapa: filtro.etapa, categoria: filtro.categoria, pagina: filtro.pagina, tamano: filtro.tamano });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Estado, etapa y plazo de un expediente (RF10)' })
  @ApiForbiddenResponse({ description: 'El expediente pertenece a otro postulante (EQ-02)' })
  detalle(@Param('id', ParseIntPipe) id: number, @Usuario() usuario: UsuarioActual) {
    return this.consultar.ejecutar(id, usuario);
  }

  @Patch(':id/emision')
  @Roles(Rol.SUPERVISOR)
  @ApiOperation({ summary: 'Autorizar la emisión de la licencia (RF12, auditable)' })
  @ApiConflictResponse({ description: 'El expediente no está en la etapa EMISION' })
  emitir(@Param('id', ParseIntPipe) id: number, @Usuario() supervisor: UsuarioActual) {
    return this.autorizar.ejecutar(id, supervisor);
  }
}
