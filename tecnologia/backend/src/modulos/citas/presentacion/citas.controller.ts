import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, Matches, Max, Min } from 'class-validator';
import { Rol, UsuarioActual } from '../../../compartido/dominio/rol';
import { Roles, Usuario } from '../../../compartido/seguridad/decoradores';
import { ConfigurarCupoUseCase, ConsultarCitasUseCase, ReservarCitaUseCase } from '../aplicacion/casos-de-uso';
import { TipoExamen } from '../dominio/cupo';
import { Contrato } from '../../../compartido/presentacion/contrato';
import { CupoRespuesta, CitaRespuesta, CitaReservadaRespuesta } from './respuestas';

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
  @Contrato({ resumen: 'Habilitar un horario con cupos (RF21)', descripcion: 'Conocimientos de lunes a miércoles; manejo de martes a viernes.', exito: { estado: 201, descripcion: 'Horario habilitado', tipo: CupoRespuesta }, errores: [400, 403, [409, 'Ya existe un horario de ese tipo en esa fecha y hora'], [422, 'Día no permitido para el tipo de examen, fecha pasada o capacidad inválida']] })
  crearCupo(@Body() dto: CupoDto) {
    return this.configurar.ejecutar(new Date(`${dto.fecha.slice(0, 10)}T00:00:00Z`), dto.hora, dto.tipo, dto.capacidad);
  }

  @Get('cupos')
  @Contrato({ resumen: 'Horarios con cupos disponibles', exito: { descripcion: 'Horarios desde la fecha indicada (por defecto, hoy)', tipo: CupoRespuesta, lista: true }, errores: [400] })
  cupos(@Query() filtro: FiltroCuposDto) {
    return this.configurar.listar(filtro.tipo, filtro.desde ? new Date(filtro.desde) : new Date());
  }

  @Post('expedientes/:id/citas')
  @Roles(Rol.POSTULANTE)
  @Contrato({ resumen: 'Reservar la cita de examen (RF07)', descripcion: 'Envía un recordatorio por correo y el expediente avanza de CITA a EXAMEN_CONOCIMIENTOS.', exito: { estado: 201, descripcion: 'Cita reservada', tipo: CitaReservadaRespuesta }, errores: [400, [403, 'El expediente pertenece a otro postulante'], [404, 'No existe el expediente o el cupo'], [409, 'Sin cupos disponibles o etapa incorrecta'], [422, 'No se puede reservar una fecha pasada']] })
  reservarCita(@Param('id', ParseIntPipe) id: number, @Body() dto: ReservaDto, @Usuario() usuario: UsuarioActual) {
    return this.reservar.ejecutar(id, dto.cupoId, usuario);
  }

  @Get('expedientes/:id/citas')
  @Contrato({ resumen: 'Citas programadas del expediente', exito: { descripcion: 'Citas del expediente', tipo: CitaRespuesta, lista: true }, errores: [400, [403, 'El expediente pertenece a otro postulante'], [404, 'No existe el expediente']] })
  citas(@Param('id', ParseIntPipe) id: number, @Usuario() usuario: UsuarioActual) {
    return this.consultarCitas.ejecutar(id, usuario);
  }
}
