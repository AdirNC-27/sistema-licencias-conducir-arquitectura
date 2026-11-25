import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpedientesModule } from '../expedientes/expedientes.module';
import {
  AtenderObservacionUseCase,
  AutorizarEmisionUseCase,
  ConsultarRevisionUseCase,
  ObservarExpedienteUseCase,
  RegistrarLicenciaUseCase,
  RegistrarVerificacionUseCase,
} from './aplicacion/casos-de-uso';
import { REPOSITORIO_REVISION } from './dominio/contratos';
import { LicenciaOrmEntity, ObservacionOrmEntity, RepositorioRevisionTypeOrm, VerificacionOrmEntity } from './infraestructura/revision.typeorm';
import { RevisionController } from './presentacion/revision.controller';

/** Revisión del expediente y emisión (RF11, RF12, RF24, RF27). */
@Module({
  imports: [TypeOrmModule.forFeature([VerificacionOrmEntity, ObservacionOrmEntity, LicenciaOrmEntity]), ExpedientesModule],
  controllers: [RevisionController],
  providers: [
    RegistrarVerificacionUseCase,
    ObservarExpedienteUseCase,
    AtenderObservacionUseCase,
    AutorizarEmisionUseCase,
    RegistrarLicenciaUseCase,
    ConsultarRevisionUseCase,
    { provide: REPOSITORIO_REVISION, useClass: RepositorioRevisionTypeOrm },
  ],
})
export class RevisionModule {}
