import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { Repository } from 'typeorm';
import { Rol } from '../../../compartido/dominio/rol';
import { Roles } from '../../../compartido/seguridad/decoradores';
import { AuditoriaOrmEntity } from '../infraestructura/bitacora-auditoria.typeorm';

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
  @ApiOperation({ summary: 'Bitácora de solo lectura (RF17): usuario, fecha, acción, valor anterior y nuevo' })
  listar(@Query() filtro: FiltroAuditoriaDto) {
    return this.orm.find({
      where: { ...(filtro.entidad ? { entidad: filtro.entidad } : {}), ...(filtro.entidadId ? { entidadId: filtro.entidadId } : {}) },
      order: { id: 'DESC' },
      take: 200,
    });
  }
}
