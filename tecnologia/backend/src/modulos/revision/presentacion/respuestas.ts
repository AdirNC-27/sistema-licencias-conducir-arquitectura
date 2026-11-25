import { ApiProperty } from '@nestjs/swagger';
import { Etapa } from '../../expedientes/dominio/etapa';
import { EstadoObservacion } from '../dominio/observacion';
import { ResultadoVerificacion, TipoVerificacion } from '../dominio/verificacion';

export class VerificacionRespuesta {
  @ApiProperty({ example: 1 }) id!: number;
  @ApiProperty({ example: 1 }) expedienteId!: number;
  @ApiProperty({ enum: TipoVerificacion, enumName: 'TipoVerificacion' }) tipo!: TipoVerificacion;
  @ApiProperty({ enum: ResultadoVerificacion, enumName: 'ResultadoVerificacion' }) resultado!: ResultadoVerificacion;
  @ApiProperty({ type: String, nullable: true, example: 'Certificado N.° 0045821 de la clínica San Juan, vigente' }) detalle!: string | null;
  @ApiProperty({ example: 2 }) gestorId!: number;
  @ApiProperty({ example: '2026-11-24T15:10:00.000Z' }) registradoEn!: Date;
}

export class ObservacionRespuesta {
  @ApiProperty({ example: 1 }) id!: number;
  @ApiProperty({ example: 1 }) expedienteId!: number;
  @ApiProperty({ example: 'La constancia COFIPRO del SNC no coincide con el DNI del postulante' }) motivo!: string;
  @ApiProperty({ enum: EstadoObservacion, enumName: 'EstadoObservacion' }) estado!: EstadoObservacion;
  @ApiProperty({ example: 4 }) supervisorId!: number;
  @ApiProperty({ example: '2026-11-24T15:10:00.000Z' }) creadoEn!: Date;
  @ApiProperty({ type: String, nullable: true, example: null }) respuesta!: string | null;
  @ApiProperty({ type: Number, nullable: true, example: null }) gestorId!: number | null;
  @ApiProperty({ type: String, format: 'date-time', nullable: true, example: null }) atendidaEn!: Date | null;
}

export class ObservacionBandejaRespuesta extends ObservacionRespuesta {
  @ApiProperty({ example: 'EXP-2026-00001' }) numeroExpediente!: string;
}

export class LicenciaRespuesta {
  @ApiProperty({ example: 1 }) expedienteId!: number;
  @ApiProperty({ example: 'Q45892014' }) numero!: string;
  @ApiProperty({ example: 2 }) gestorId!: number;
  @ApiProperty({ example: '2026-11-24T15:10:00.000Z' }) registradaEn!: Date;
}

export class RevisionRespuesta {
  @ApiProperty({ example: 1 }) expedienteId!: number;
  @ApiProperty({ enum: Etapa, enumName: 'Etapa' }) etapa!: Etapa;
  @ApiProperty({ enum: TipoVerificacion, enumName: 'TipoVerificacion', isArray: true, description: 'Según la categoría: la II-C agrega COFIPRO y sanciones' })
  verificacionesObligatorias!: TipoVerificacion[];
  @ApiProperty({ type: [VerificacionRespuesta], description: 'Historial; la vigente de cada tipo es la última' }) verificaciones!: VerificacionRespuesta[];
  @ApiProperty({ type: [ObservacionRespuesta] }) observaciones!: ObservacionRespuesta[];
  @ApiProperty({ type: LicenciaRespuesta, nullable: true }) licencia!: LicenciaRespuesta | null;
  @ApiProperty({ type: [String], example: ['Falta verificar: Sin multas ni sanciones pendientes'] }) pendientes!: string[];
  @ApiProperty({ example: false, description: 'Etapa EMISION y nada pendiente' }) listoParaEmitir!: boolean;
}

export class EmisionRespuesta {
  @ApiProperty({ example: 1 }) expedienteId!: number;
  @ApiProperty({ example: 'EXP-2026-00001' }) numero!: string;
  @ApiProperty({ enum: Etapa, enumName: 'Etapa', example: Etapa.EMITIDA }) etapa!: Etapa;
}
