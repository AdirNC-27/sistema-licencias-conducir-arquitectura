import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiConflictResponse, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, Matches, Max, Min } from 'class-validator';
import { Rol, UsuarioActual } from '../../../compartido/dominio/rol';
import { Roles, Usuario } from '../../../compartido/seguridad/decoradores';
import { ConfigurarCupoUseCase, ConsultarCitasUseCase, ReservarCitaUseCase } from '../aplicacion/casos-de-uso';
import { TipoExamen } from '../dominio/cupo';

class CupoDto {
  @ApiProperty({ example: '2026-11-23' }) @IsDateString() fecha!: string;
  @ApiProperty({ example: '08:30' }) @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) hora!: string;
  @ApiProperty({ enum: TipoExamen }) @IsEnum(TipoExamen) tipo!: TipoExamen;
  @ApiProperty({ example: 15 }) @IsInt() @Min(1) @Max(200) capacidad!: number;
}

class FiltroCuposDto {
  @ApiProperty({ enum: TipoExamen }) @IsEnum(TipoExamen) tipo!: TipoExamen;
  @ApiPropertyOptional({ example: '2026-11-19' }) @IsOptional() @IsDateString() desde?: string;
}

class ReservaDto {
  @ApiProperty({ example: 1 }) @IsInt() cupoId!: number;
}

@ApiTags('Citas')
@ApiBearerAuth()
@Controller()
export class CitasController {
  constructor(
    private readonly configurar: ConfigurarCupoUseCase,
    private readonly reservar: ReservarCitaUseCase,
    private readonly consultarCitas: ConsultarCitasUseCase,
  ) {}

  @Post('cupos')
  @Roles(Rol.ADMINISTRADOR)
  @ApiOperation({ summary: 'Habilitar un horario con cupos (RF21): conocimientos L–X, manejo M–V' })
  crearCupo(@Body() dto: CupoDto) {
    return this.configurar.ejecutar(new Date(`${dto.fecha.slice(0, 10)}T00:00:00Z`), dto.hora, dto.tipo, dto.capacidad);
  }

  @Get('cupos')
  @ApiOperation({ summary: 'Horarios con cupos disponibles' })
  cupos(@Query() filtro: FiltroCuposDto) {
    return this.configurar.listar(filtro.tipo, filtro.desde ? new Date(filtro.desde) : new Date());
  }

  @Post('expedientes/:id/citas')
  @Roles(Rol.POSTULANTE)
  @ApiOperation({ summary: 'Reservar la cita de examen (RF07). Envía recordatorio por correo' })
  @ApiConflictResponse({ description: 'Sin cupos o etapa incorrecta' })
  reservarCita(@Param('id', ParseIntPipe) id: number, @Body() dto: ReservaDto, @Usuario() usuario: UsuarioActual) {
    return this.reservar.ejecutar(id, dto.cupoId, usuario);
  }

  @Get('expedientes/:id/citas')
  @ApiOperation({ summary: 'Citas programadas del expediente' })
  citas(@Param('id', ParseIntPipe) id: number, @Usuario() usuario: UsuarioActual) {
    return this.consultarCitas.ejecutar(id, usuario);
  }
}
