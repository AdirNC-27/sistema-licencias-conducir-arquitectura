import { ApiProperty } from '@nestjs/swagger';
import { Categoria, TipoTramite } from '../../../compartido/dominio/categoria';

export class RequisitoRespuesta {
  @ApiProperty({ example: 2 }) orden!: number;
  @ApiProperty({
    example:
      'Certificado médico de una clínica autorizada por el MTC, registrado en el SNC (vigencia de 6 meses)',
  })
  descripcion!: string;
  @ApiProperty({
    type: String,
    nullable: true,
    example: 'CERTIFICADO_MEDICO',
    description:
      'Tipo de documento que se adjunta; null si no se adjunta archivo',
  })
  documento!: string | null;
}

export class RequisitosRespuesta {
  @ApiProperty({ enum: TipoTramite, enumName: 'TipoTramite' })
  tramite!: TipoTramite;
  @ApiProperty({ enum: Categoria, enumName: 'Categoria' })
  categoria!: Categoria;
  @ApiProperty({
    type: Number,
    nullable: true,
    example: 69.4,
    description: 'Tasa en soles según el TUPA',
  })
  tasa!: number | null;
  @ApiProperty({ example: 10 }) plazoDiasHabiles!: number;
  @ApiProperty({ example: 'https://licencias.mtc.gob.pe/#/index' })
  consultaOficial!: string;
  @ApiProperty({ type: [RequisitoRespuesta] })
  requisitos!: RequisitoRespuesta[];
}
