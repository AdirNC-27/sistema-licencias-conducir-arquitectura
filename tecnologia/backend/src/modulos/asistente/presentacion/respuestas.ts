import { ApiProperty } from '@nestjs/swagger';
import { OrigenRespuesta } from '../dominio/consulta';
import { Audiencia, TemaContenido } from '../dominio/contenido';

export class ConsultaRespuesta {
  @ApiProperty({ example: 1 }) id!: number;
  @ApiProperty({ example: '¿Cuánto cuesta la licencia para mototaxi?' }) pregunta!: string;
  @ApiProperty({ example: 'La tasa para la categoría II-C es S/ 69.40 e incluye los dos exámenes.' }) respuesta!: string;
  @ApiProperty({ enum: OrigenRespuesta, enumName: 'OrigenRespuesta', description: 'IA: redactada por la IA con contenido aprobado; CONTENIDO: texto aprobado; ESTADO: datos del expediente; DERIVADA: la responde el gestor' })
  origen!: OrigenRespuesta;
  @ApiProperty({ example: false }) derivada!: boolean;
  @ApiProperty({ type: [Number], example: [3], description: 'Contenidos aprobados usados' }) fuentes!: number[];
  @ApiProperty({ example: '2026-11-24T15:10:00.000Z' }) creadoEn!: Date;
  @ApiProperty({ type: String, nullable: true, example: null }) respuestaGestor!: string | null;
  @ApiProperty({ type: String, format: 'date-time', nullable: true, example: null }) respondidaEn!: Date | null;
}

export class ConsultaDerivadaRespuesta extends ConsultaRespuesta {
  @ApiProperty({ example: 1 }) postulanteId!: number;
}

export class ContenidoRespuesta {
  @ApiProperty({ example: 1 }) id!: number;
  @ApiProperty({ enum: TemaContenido, enumName: 'TemaContenido' }) tema!: TemaContenido;
  @ApiProperty({ enum: Audiencia, enumName: 'Audiencia', description: 'POSTULANTE: responde al ciudadano; PERSONAL: procedimiento interno' }) audiencia!: Audiencia;
  @ApiProperty({ example: '¿Cuánto cuesta la licencia?' }) pregunta!: string;
  @ApiProperty({ example: 'La tasa del TUPA es S/ 69.90 para la II-B y S/ 69.40 para la II-C.' }) respuesta!: string;
  @ApiProperty({ example: 'precio, tasa, cuánto pago' }) palabrasClave!: string;
  @ApiProperty({ example: true }) activo!: boolean;
}

export class PendienteRespuesta {
  @ApiProperty({ example: 'PAGOS' }) codigo!: string;
  @ApiProperty({ example: '2 pagos por verificar en el SAT' }) texto!: string;
  @ApiProperty({ example: 2 }) cantidad!: number;
  @ApiProperty({ example: false, description: 'Vence pronto o bloquea a otra persona' }) urgente!: boolean;
  @ApiProperty({ example: '/gestor?etapa=PAGO', description: 'Pantalla del portal donde se atiende' }) ruta!: string;
}

export class ConsultaPersonalRespuesta {
  @ApiProperty({ example: '¿Qué tengo pendiente?' }) pregunta!: string;
  @ApiProperty({ example: 'Esto tienes pendiente:\n• 2 pagos por verificar en el SAT' }) respuesta!: string;
  @ApiProperty({ enum: OrigenRespuesta, enumName: 'OrigenRespuesta', description: 'ESTADO: pendientes calculados; IA o CONTENIDO: procedimiento aprobado; DERIVADA: sin contenido aprobado' })
  origen!: OrigenRespuesta;
  @ApiProperty({ type: [Number], example: [27] }) fuentes!: number[];
  @ApiProperty({ example: '2026-11-25T15:10:00.000Z' }) creadoEn!: Date;
}
