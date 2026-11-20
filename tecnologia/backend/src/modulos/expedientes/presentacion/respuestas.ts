import { ApiProperty } from '@nestjs/swagger';
import { Categoria, TipoTramite } from '../../../compartido/dominio/categoria';
import { Etapa } from '../dominio/etapa';

export class PlazoRespuesta {
  @ApiProperty({ example: 3 }) diasTranscurridos!: number;
  @ApiProperty({ example: 7 }) diasRestantes!: number;
  @ApiProperty({ example: false }) vencido!: boolean;
  @ApiProperty({
    example: 30,
    description: 'Avance del plazo legal de 10 días hábiles (0 a 100)',
  })
  porcentaje!: number;
}

export class ExpedienteRespuesta {
  @ApiProperty({ example: 1 }) id!: number;
  @ApiProperty({ example: 'EXP-2026-00001' }) numero!: string;
  @ApiProperty({ example: 1 }) postulanteId!: number;
  @ApiProperty({ enum: TipoTramite, enumName: 'TipoTramite' })
  tipoTramite!: TipoTramite;
  @ApiProperty({ enum: Categoria, enumName: 'Categoria' })
  categoria!: Categoria;
  @ApiProperty({ enum: Etapa, enumName: 'Etapa' }) etapa!: Etapa;
  @ApiProperty({ example: '2026-11-19T14:24:15.255Z' }) creadoEn!: Date;
  @ApiProperty({ type: PlazoRespuesta }) plazo!: PlazoRespuesta;
}

export class PaginaExpedientesRespuesta {
  @ApiProperty({ example: 42 }) total!: number;
  @ApiProperty({ example: 1 }) pagina!: number;
  @ApiProperty({ example: 20 }) tamano!: number;
  @ApiProperty({ type: [ExpedienteRespuesta] }) datos!: ExpedienteRespuesta[];
}
