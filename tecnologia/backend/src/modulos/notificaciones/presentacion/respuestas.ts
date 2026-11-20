import { ApiProperty } from '@nestjs/swagger';

export class AvisoRespuesta {
  @ApiProperty({ example: 8 }) id!: number;
  @ApiProperty({ example: 1 }) postulanteId!: number;
  @ApiProperty({ example: 'Tu trámite EXP-2026-00001 avanzó' }) asunto!: string;
  @ApiProperty({
    example: 'Tu expediente EXP-2026-00001 pasó a la etapa: pago.',
  })
  texto!: string;
  @ApiProperty({ example: true }) enviadoPorCorreo!: boolean;
  @ApiProperty({ example: false }) leida!: boolean;
  @ApiProperty({ example: '2026-11-19T14:24:26.447Z' }) creadoEn!: Date;
}
