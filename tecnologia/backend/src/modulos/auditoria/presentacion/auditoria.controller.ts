import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { Repository } from 'typeorm';
import { Rol } from '../../../compartido/dominio/rol';
import { Roles } from '../../../compartido/seguridad/decoradores';
import { AuditoriaOrmEntity } from '../infraestructura/bitacora-auditoria.typeorm';
import { Contrato } from '../../../compartido/presentacion/contrato';
import { RegistroAuditoriaRespuesta } from './respuestas';

class FiltroAuditoriaDto {
  @ApiPropertyOptional({ example: 'evaluacion' }) @IsOptional() @IsString() entidad?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() entidadId?: number;
}

@ApiTags('Auditoría')
@ApiBearerAuth()
@Controller('auditoria')
export class AuditoriaController {
  constructor(@InjectRepository(AuditoriaOrmEntity) private readonly orm: Repository<AuditoriaOrmEntity>) {}

  @Get()
  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR)
  @Contrato({ resumen: 'Bitácora de solo lectura (RF17)', descripcion: 'Usuario, fecha, acción, valor anterior y nuevo. Últimos 200 registros.', exito: { descripcion: 'Registros de auditoría', tipo: RegistroAuditoriaRespuesta, lista: true }, errores: [400, 403] })
  listar(@Query() filtro: FiltroAuditoriaDto) {
    return this.orm.find({
      where: { ...(filtro.entidad ? { entidad: filtro.entidad } : {}), ...(filtro.entidadId ? { entidadId: filtro.entidadId } : {}) },
      order: { id: 'DESC' },
      take: 200,
    });
  }
}
