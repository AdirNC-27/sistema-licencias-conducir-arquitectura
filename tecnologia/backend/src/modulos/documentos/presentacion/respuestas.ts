import { ApiProperty } from '@nestjs/swagger';
import { EstadoDocumento, TipoDocumento } from '../dominio/documento';

export class DocumentoRespuesta {
  @ApiProperty({ example: 1 }) id!: number;
  @ApiProperty({ example: 1 }) expedienteId!: number;
  @ApiProperty({ enum: TipoDocumento, enumName: 'TipoDocumento' })
  tipo!: TipoDocumento;
  @ApiProperty({ enum: EstadoDocumento, enumName: 'EstadoDocumento' })
  estado!: EstadoDocumento;
  @ApiProperty({ type: String, nullable: true, example: null }) observacion!:
    string | null;
}

export class RevisionDocumentoRespuesta extends DocumentoRespuesta {
  @ApiProperty({
    example: false,
    description:
      'true cuando todos los documentos quedaron aprobados y el expediente pasó a PAGO',
  })
  expedienteCompleto!: boolean;
}
