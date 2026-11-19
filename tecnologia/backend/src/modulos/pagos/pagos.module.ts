import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpedientesModule } from '../expedientes/expedientes.module';
import { ConsultarPagosUseCase, RegistrarPagoUseCase, VerificarPagoUseCase } from './aplicacion/casos-de-uso';
import { REPOSITORIO_PAGOS } from './dominio/pago';
import { PagoOrmEntity, RepositorioPagosTypeOrm } from './infraestructura/pagos.typeorm';
import { PagosController } from './presentacion/pagos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PagoOrmEntity]), ExpedientesModule],
  controllers: [PagosController],
  providers: [RegistrarPagoUseCase, VerificarPagoUseCase, ConsultarPagosUseCase, { provide: REPOSITORIO_PAGOS, useClass: RepositorioPagosTypeOrm }],
})
export class PagosModule {}
