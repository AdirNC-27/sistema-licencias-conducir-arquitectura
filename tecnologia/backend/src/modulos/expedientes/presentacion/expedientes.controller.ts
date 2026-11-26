import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { Categoria, TipoTramite } from '../../../compartido/dominio/categoria';
import { Rol, ROLES_PERSONAL, UsuarioActual } from '../../../compartido/dominio/rol';
import { Roles, Usuario } from '../../../compartido/seguridad/decoradores';
import { CambiarCategoriaUseCase, ConsultarExpedienteUseCase, CrearExpedienteUseCase } from '../aplicacion/casos-de-uso';
import { Etapa } from '../dominio/etapa';
import { Contrato } from '../../../compartido/presentacion/contrato';
import { ExpedienteRespuesta, PaginaExpedientesRespuesta } from './respuestas';

class CrearExpedienteDto {
  @ApiProperty({ enum: TipoTramite, example: TipoTramite.EMISION }) @IsEnum(TipoTramite) tipoTramite!: TipoTramite;
  @ApiProperty({ enum: Categoria, example: Categoria.II_C }) @IsEnum(Categoria) categoria!: Categoria;
}

class CambiarCategoriaDto {
  @ApiProperty({ enum: Categoria, example: Categoria.II_B }) @IsEnum(Categoria) categoria!: Categoria;
  @ApiProperty({ example: 'Me equivoqué: quiero la licencia para moto lineal', minLength: 10, maxLength: 250 })
  @IsString()
  @Length(10, 250)
  motivo!: string;
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
    private readonly cambiarCategoria: CambiarCategoriaUseCase,
  ) {}

  @Post()
  @Roles(Rol.POSTULANTE)
  @Contrato({ resumen: 'Registrar una solicitud de licencia (RF02)', exito: { estado: 201, descripcion: 'Expediente creado en la etapa DOCUMENTOS', tipo: ExpedienteRespuesta }, errores: [400, [403, 'Solo un postulante puede iniciar un trámite'], [409, 'Ya tiene un trámite en curso'], [422, 'En esta versión solo se atiende la emisión']] })
  registrar(@Body() dto: CrearExpedienteDto, @Usuario() usuario: UsuarioActual) {
    return this.crear.ejecutar(usuario, dto.tipoTramite, dto.categoria);
  }

  @Get('mios')
  @Roles(Rol.POSTULANTE)
  @Contrato({ resumen: 'Mis trámites con etapa y plazo (RF10)', exito: { descripcion: 'Trámites del postulante, del más reciente al más antiguo', tipo: ExpedienteRespuesta, lista: true }, errores: [403] })
  mios(@Usuario() usuario: UsuarioActual) {
    return this.consultar.mios(usuario);
  }

  @Get()
  @Roles(...ROLES_PERSONAL)
  @Contrato({ resumen: 'Bandeja de expedientes del personal, con filtros y paginación', exito: { descripcion: 'Página de expedientes ordenada por antigüedad', tipo: PaginaExpedientesRespuesta }, errores: [400, 403] })
  bandeja(@Query() filtro: FiltroDto) {
    return this.consultar.bandeja({ etapa: filtro.etapa, categoria: filtro.categoria, pagina: filtro.pagina, tamano: filtro.tamano });
  }

  @Get(':id')
  @Contrato({ resumen: 'Estado, etapa y plazo de un expediente (RF10)', exito: { descripcion: 'Expediente', tipo: ExpedienteRespuesta }, errores: [400, [403, 'El expediente pertenece a otro postulante (EQ-02)'], [404, 'No existe el expediente']] })
  detalle(@Param('id', ParseIntPipe) id: number, @Usuario() usuario: UsuarioActual) {
    return this.consultar.ejecutar(id, usuario);
  }

  @Patch(':id/categoria')
  @Roles(Rol.POSTULANTE)
  @Contrato({
    resumen: 'Cambiar la categoría elegida (II-B o II-C) mientras el trámite está en documentos',
    exito: { descripcion: 'Expediente con la nueva categoría; el cambio queda en la auditoría con su motivo', tipo: ExpedienteRespuesta },
    errores: [400, [403, 'Solo el dueño del trámite puede cambiarla'], [404, 'No existe el expediente'], [409, 'El trámite ya pasó la etapa de documentos'], [422, 'El expediente ya es de esa categoría']],
  })
  cambiar(@Param('id', ParseIntPipe) id: number, @Body() dto: CambiarCategoriaDto, @Usuario() usuario: UsuarioActual) {
    return this.cambiarCategoria.ejecutar(id, usuario, dto.categoria, dto.motivo.trim());
  }
}
