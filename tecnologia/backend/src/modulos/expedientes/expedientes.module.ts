import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutorizarEmisionUseCase, ConsultarExpedienteUseCase, CrearExpedienteUseCase } from './aplicacion/casos-de-uso';
import { ExpedientesFacade } from './aplicacion/expedientes.facade';
import { EXPEDIENTES_API, REPOSITORIO_EXPEDIENTES } from './dominio/contratos';
import { ExpedienteOrmEntity } from './infraestructura/expediente.orm-entity';
import { RepositorioExpedientesTypeOrm } from './infraestructura/repositorio-expedientes.typeorm';
import { ExpedientesController } from './presentacion/expedientes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ExpedienteOrmEntity])],
  controllers: [ExpedientesController],
  providers: [
    CrearExpedienteUseCase,
    ConsultarExpedienteUseCase,
    AutorizarEmisionUseCase,
    { provide: REPOSITORIO_EXPEDIENTES, useClass: RepositorioExpedientesTypeOrm },
    { provide: EXPEDIENTES_API, useClass: ExpedientesFacade },
  ],
  exports: [EXPEDIENTES_API],
})
export class ExpedientesModule {}
