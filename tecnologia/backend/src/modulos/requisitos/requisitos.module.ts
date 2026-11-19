import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { REPOSITORIO_REQUISITOS } from './dominio/requisito';
import { RequisitoOrmEntity } from './infraestructura/requisito.orm-entity';
import { RepositorioRequisitosCacheado, RepositorioRequisitosTypeOrm } from './infraestructura/repositorios';
import { RequisitosController } from './presentacion/requisitos.controller';

/** Cambiar CACHE_REQUISITOS=false usa el repositorio sin caché (para comparar en k6, EQ-03). */
const usarCache = process.env.CACHE_REQUISITOS !== 'false';

@Module({
  imports: [TypeOrmModule.forFeature([RequisitoOrmEntity])],
  controllers: [RequisitosController],
  providers: [
    RepositorioRequisitosTypeOrm,
    RepositorioRequisitosCacheado,
    { provide: REPOSITORIO_REQUISITOS, useExisting: usarCache ? RepositorioRequisitosCacheado : RepositorioRequisitosTypeOrm },
  ],
  exports: [REPOSITORIO_REQUISITOS],
})
export class RequisitosModule {}
