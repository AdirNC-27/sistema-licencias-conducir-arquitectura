import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsIn, IsNumber, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { Rol, UsuarioActual } from '../../../compartido/dominio/rol';
import { Roles, Usuario } from '../../../compartido/seguridad/decoradores';
import { ConsultarPagosUseCase, RegistrarPagoUseCase, VerificarPagoUseCase } from '../aplicacion/casos-de-uso';
import { EstadoPago } from '../dominio/pago';
import { Contrato } from '../../../compartido/presentacion/contrato';
import { PagoRespuesta } from './respuestas';

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
  @Contrato({ resumen: 'Registrar el recibo pagado en el SAT Huamanga (RF05)', exito: { estado: 201, descripcion: 'Pago registrado en estado PENDIENTE', tipo: PagoRespuesta }, errores: [400, [403, 'El expediente pertenece a otro postulante'], [404, 'No existe el expediente'], [409, 'Etapa incorrecta, número de operación repetido o pago pendiente de verificación'], [422, 'El monto no es la tasa de la categoría o la fecha es futura']] })
  crear(@Param('id', ParseIntPipe) id: number, @Body() dto: RegistrarPagoDto, @Usuario() usuario: UsuarioActual) {
    return this.registrar.ejecutar(id, dto.numeroOperacion, dto.monto, new Date(dto.fechaPago), usuario);
  }

  @Get('expedientes/:id/pagos')
  @Contrato({ resumen: 'Pagos del expediente', exito: { descripcion: 'Pagos del expediente', tipo: PagoRespuesta, lista: true }, errores: [400, [403, 'El expediente pertenece a otro postulante'], [404, 'No existe el expediente']] })
  listar(@Param('id', ParseIntPipe) id: number, @Usuario() usuario: UsuarioActual) {
    return this.consultar.ejecutar(id, usuario);
  }

  @Patch('pagos/:id/verificacion')
  @Roles(Rol.GESTOR)
  @Contrato({ resumen: 'Verificar, observar o rechazar un pago (RF06, auditable)', descripcion: 'Al verificarlo, el expediente pasa a la etapa CITA.', exito: { descripcion: 'Pago revisado', tipo: PagoRespuesta }, errores: [400, 403, [404, 'No existe el pago'], [409, 'El pago ya fue verificado'], [422, 'Indique el motivo']] })
  verificarPago(@Param('id', ParseIntPipe) id: number, @Body() dto: VerificarPagoDto, @Usuario() gestor: UsuarioActual) {
    return this.verificar.ejecutar(id, dto.estado, dto.observacion ?? null, gestor);
  }
}
