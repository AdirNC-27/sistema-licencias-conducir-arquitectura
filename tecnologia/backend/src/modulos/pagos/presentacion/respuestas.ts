import { ApiProperty } from '@nestjs/swagger';
import { EstadoPago } from '../dominio/pago';

export class PagoRespuesta {
  @ApiProperty({ example: 1 }) id!: number;
  @ApiProperty({ example: 1 }) expedienteId!: number;
  @ApiProperty({ example: '0012345678' }) numeroOperacion!: string;
  @ApiProperty({ example: 69.4 }) monto!: number;
  @ApiProperty({ example: '2026-11-19T00:00:00.000Z' }) fechaPago!: Date;
  @ApiProperty({ enum: EstadoPago, enumName: 'EstadoPago' })
  estado!: EstadoPago;
  @ApiProperty({ type: String, nullable: true, example: null }) observacion!:
    string | null;
}
