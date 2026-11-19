import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ApiOperation, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { Categoria, TASA_EMISION, TipoTramite } from '../../../compartido/dominio/categoria';
import { Publico } from '../../../compartido/seguridad/decoradores';
import { REPOSITORIO_REQUISITOS, RepositorioRequisitos } from '../dominio/requisito';

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
  @ApiOperation({ summary: 'Requisitos del TUPA por trámite y categoría, con caché en memoria (RF22, ADR-009)' })
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
