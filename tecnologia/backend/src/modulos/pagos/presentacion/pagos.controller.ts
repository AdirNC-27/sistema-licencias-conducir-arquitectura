import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags, ApiUnprocessableEntityResponse } from '@nestjs/swagger';
import { IsDateString, IsIn, IsNumber, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { Rol, UsuarioActual } from '../../../compartido/dominio/rol';
import { Roles, Usuario } from '../../../compartido/seguridad/decoradores';
import { ConsultarPagosUseCase, RegistrarPagoUseCase, VerificarPagoUseCase } from '../aplicacion/casos-de-uso';
import { EstadoPago } from '../dominio/pago';

class RegistrarPagoDto {
  @ApiProperty({ example: '0012345678' }) @IsString() @Length(4, 30) numeroOperacion!: string;
  @ApiProperty({ example: 69.4 }) @IsNumber({ maxDecimalPlaces: 2 }) monto!: number;
  @ApiProperty({ example: '2026-11-18' }) @IsDateString() fechaPago!: string;
}

const ESTADOS = [EstadoPago.VERIFICADO, EstadoPago.OBSERVADO, EstadoPago.RECHAZADO] as const;
class VerificarPagoDto {
  @ApiProperty({ enum: ESTADOS }) @IsIn(ESTADOS) estado!: (typeof ESTADOS)[number];
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(250) observacion?: string;
}

@ApiTags('Pagos')
@ApiBearerAuth()
@Controller()
export class PagosController {
  constructor(
    private readonly registrar: RegistrarPagoUseCase,
    private readonly verificar: VerificarPagoUseCase,
    private readonly consultar: ConsultarPagosUseCase,
  ) {}

  @Post('expedientes/:id/pagos')
  @Roles(Rol.POSTULANTE)
  @ApiOperation({ summary: 'Registrar el recibo del SAT (RF05)' })
  @ApiUnprocessableEntityResponse({ description: 'El monto no es la tasa de la categoría' })
  crear(@Param('id', ParseIntPipe) id: number, @Body() dto: RegistrarPagoDto, @Usuario() usuario: UsuarioActual) {
    return this.registrar.ejecutar(id, dto.numeroOperacion, dto.monto, new Date(dto.fechaPago), usuario);
  }

  @Get('expedientes/:id/pagos')
  @ApiOperation({ summary: 'Pagos del expediente' })
  listar(@Param('id', ParseIntPipe) id: number, @Usuario() usuario: UsuarioActual) {
    return this.consultar.ejecutar(id, usuario);
  }

  @Patch('pagos/:id/verificacion')
  @Roles(Rol.GESTOR)
  @ApiOperation({ summary: 'Verificar, observar o rechazar un pago (RF06, auditable)' })
  verificarPago(@Param('id', ParseIntPipe) id: number, @Body() dto: VerificarPagoDto, @Usuario() gestor: UsuarioActual) {
    return this.verificar.ejecutar(id, dto.estado, dto.observacion ?? null, gestor);
  }
}
