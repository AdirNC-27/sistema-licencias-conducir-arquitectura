import { ApiProperty } from '@nestjs/swagger';

export class RegistroAuditoriaRespuesta {
  @ApiProperty({ example: 15 }) id!: number;
  @ApiProperty({ example: 3, description: 'Usuario que realizó la acción' })
  usuarioId!: number;
  @ApiProperty({ example: 'VALIDAR_RESULTADO' }) accion!: string;
  @ApiProperty({ example: 'evaluacion' }) entidad!: string;
  @ApiProperty({ example: 1 }) entidadId!: number;
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    nullable: true,
    example: { estado: 'REGISTRADO' },
  })
  valorAnterior!: Record<string, unknown> | null;
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    nullable: true,
    example: { estado: 'VALIDADO' },
  })
  valorNuevo!: Record<string, unknown> | null;
  @ApiProperty({ type: String, nullable: true, example: null }) motivo!:
    string | null;
  @ApiProperty({ example: '2026-11-19T14:24:26.445Z' }) fecha!: Date;
}
