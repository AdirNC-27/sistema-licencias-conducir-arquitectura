import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdentidadModule } from '../identidad/identidad.module';
import { RegistrarPostulanteUseCase } from './aplicacion/registrar-postulante.use-case';
import { REPOSITORIO_POSTULANTES, VERIFICADOR_IDENTIDAD } from './dominio/contratos';
import { ApiPeruDniAdapter } from './infraestructura/api-peru-dni.adapter';
import { PostulanteOrmEntity } from './infraestructura/postulante.orm-entity';
import { RepositorioPostulantesTypeOrm } from './infraestructura/repositorio-postulantes.typeorm';
import { PostulantesController } from './presentacion/postulantes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PostulanteOrmEntity]), IdentidadModule],
  controllers: [PostulantesController],
  providers: [
    RegistrarPostulanteUseCase,
    { provide: VERIFICADOR_IDENTIDAD, useClass: ApiPeruDniAdapter },
    { provide: REPOSITORIO_POSTULANTES, useClass: RepositorioPostulantesTypeOrm },
  ],
  exports: [REPOSITORIO_POSTULANTES],
})
export class PostulantesModule {}
