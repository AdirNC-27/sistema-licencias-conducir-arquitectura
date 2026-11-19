import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpedientesModule } from '../expedientes/expedientes.module';
import { ConfigurarCupoUseCase, ReservarCitaUseCase } from './aplicacion/casos-de-uso';
import { REPOSITORIO_CITAS } from './dominio/contratos';
import { CitaOrmEntity, CupoOrmEntity, RepositorioCitasTypeOrm } from './infraestructura/citas.typeorm';
import { CitasController } from './presentacion/citas.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CupoOrmEntity, CitaOrmEntity]), ExpedientesModule],
  controllers: [CitasController],
  providers: [ConfigurarCupoUseCase, ReservarCitaUseCase, { provide: REPOSITORIO_CITAS, useClass: RepositorioCitasTypeOrm }],
})
export class CitasModule {}
