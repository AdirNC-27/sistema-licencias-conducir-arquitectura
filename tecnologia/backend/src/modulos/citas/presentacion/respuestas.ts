import { ApiProperty } from '@nestjs/swagger';
import { TipoExamen } from '../dominio/cupo';

export class CupoRespuesta {
  @ApiProperty({ example: 1 }) id!: number;
  @ApiProperty({ example: '2026-11-23' }) fecha!: string;
  @ApiProperty({ example: '08:30' }) hora!: string;
  @ApiProperty({ enum: TipoExamen, enumName: 'TipoExamen' }) tipo!: TipoExamen;
  @ApiProperty({ example: 15 }) capacidad!: number;
  @ApiProperty({ example: 12 }) disponibles!: number;
}

export class CitaRespuesta {
  @ApiProperty({ example: 1 }) id!: number;
  @ApiProperty({ enum: TipoExamen, enumName: 'TipoExamen' }) tipo!: TipoExamen;
  @ApiProperty({ example: '2026-11-23' }) fecha!: string;
  @ApiProperty({ example: '08:30' }) hora!: string;
}

export class CitaReservadaRespuesta extends CitaRespuesta {
  @ApiProperty({ example: 1 }) expedienteId!: number;
}
