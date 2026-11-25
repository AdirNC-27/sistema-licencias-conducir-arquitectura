import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpedientesModule } from '../expedientes/expedientes.module';
import { AtenderConsultasUseCase, ConsultarAsistenteUseCase, GestionarContenidosUseCase } from './aplicacion/casos-de-uso';
import { ASISTENTE_IA, REPOSITORIO_CONSULTAS, REPOSITORIO_CONTENIDOS } from './dominio/contratos';
import { AdaptadorIAGemini } from './infraestructura/adaptador-ia-gemini';
import { ConsultaOrmEntity, ContenidoOrmEntity, RepositorioConsultasTypeOrm, RepositorioContenidosTypeOrm } from './infraestructura/asistente.typeorm';
import { AsistenteController } from './presentacion/asistente.controller';

/** Asistente virtual con la IA de orientación (RF14, RF15, HU25). Solo lee; no escribe en el trámite. */
@Module({
  imports: [TypeOrmModule.forFeature([ContenidoOrmEntity, ConsultaOrmEntity]), ExpedientesModule],
  controllers: [AsistenteController],
  providers: [
    ConsultarAsistenteUseCase,
    AtenderConsultasUseCase,
    GestionarContenidosUseCase,
    { provide: REPOSITORIO_CONTENIDOS, useClass: RepositorioContenidosTypeOrm },
    { provide: REPOSITORIO_CONSULTAS, useClass: RepositorioConsultasTypeOrm },
    { provide: ASISTENTE_IA, useClass: AdaptadorIAGemini }, // otro proveedor = otro adaptador (EQ-06)
  ],
})
export class AsistenteModule {}
