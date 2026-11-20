import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { Categoria, TASA_EMISION, TipoTramite } from '../../../compartido/dominio/categoria';
import { Publico } from '../../../compartido/seguridad/decoradores';
import { REPOSITORIO_REQUISITOS, RepositorioRequisitos } from '../dominio/requisito';
import { Contrato } from '../../../compartido/presentacion/contrato';
import { RequisitosRespuesta } from './respuestas';

class ConsultaDto {
  @ApiPropertyOptional({ enum: TipoTramite, default: TipoTramite.EMISION }) @IsOptional() @IsEnum(TipoTramite) tramite: TipoTramite = TipoTramite.EMISION;
  @ApiPropertyOptional({ enum: Categoria, default: Categoria.II_B }) @IsOptional() @IsEnum(Categoria) categoria: Categoria = Categoria.II_B;
}

@ApiTags('Requisitos (TUPA)')
@Controller('requisitos')
export class RequisitosController {
  constructor(@Inject(REPOSITORIO_REQUISITOS) private readonly requisitos: RepositorioRequisitos) {}

  @Publico()
  @Get()
  @Contrato({ resumen: 'Requisitos del TUPA por trámite y categoría (RF22)', descripcion: 'Se responde desde la caché en memoria (ADR-009). No requiere sesión.', publico: true, exito: { descripcion: 'Requisitos, tasa y plazo', tipo: RequisitosRespuesta }, errores: [400] })
  async listar(@Query() consulta: ConsultaDto) {
    const requisitos = await this.requisitos.listar(consulta.tramite, consulta.categoria);
    return {
      tramite: consulta.tramite,
      categoria: consulta.categoria,
      tasa: consulta.tramite === TipoTramite.EMISION ? TASA_EMISION[consulta.categoria] : null,
      plazoDiasHabiles: 10,
      consultaOficial: 'https://licencias.mtc.gob.pe/#/index',
      requisitos: requisitos.map((r) => ({ orden: r.orden, descripcion: r.descripcion, documento: r.codigoDocumento })),
    };
  }
}
