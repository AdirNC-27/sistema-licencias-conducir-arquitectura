import { ApiProperty } from '@nestjs/swagger';
import { EstadoResultado, TipoEvaluacion } from '../dominio/modelo/tipos';

export class ResultadoRespuesta {
  @ApiProperty({ example: 16, description: 'Nota de 0 a 20' }) puntaje!: number;
  @ApiProperty({ example: true }) aprobado!: boolean;
  @ApiProperty({ type: String, nullable: true, example: null }) observaciones!:
    string | null;
}

export class IntentoRespuesta extends ResultadoRespuesta {
  @ApiProperty({ example: 1, description: 'Número de intento (1 a 3)' })
  numero!: number;
}

export class EvaluacionRespuesta {
  @ApiProperty({ example: 1 }) id!: number;
  @ApiProperty({ example: 1 }) expedienteId!: number;
  @ApiProperty({ enum: TipoEvaluacion, enumName: 'TipoEvaluacion' })
  tipo!: TipoEvaluacion;
  @ApiProperty({ enum: EstadoResultado, enumName: 'EstadoResultado' })
  estado!: EstadoResultado;
  @ApiProperty({ example: 1 }) intentos!: number;
  @ApiProperty({ example: 2 }) intentosRestantes!: number;
  @ApiProperty({
    type: ResultadoRespuesta,
    nullable: true,
    description: 'null para el postulante (RF19) o si aún no hay resultado',
  })
  resultadoActual!: ResultadoRespuesta | null;
  @ApiProperty({ type: [IntentoRespuesta] }) historial!: IntentoRespuesta[];
  @ApiProperty({
    example: true,
    description:
      'true cuando el supervisor validó el resultado: ya no se puede modificar',
  })
  bloqueada!: boolean;
}
