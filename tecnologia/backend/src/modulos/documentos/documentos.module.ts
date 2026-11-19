import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpedientesModule } from '../expedientes/expedientes.module';
import { ConsultarDocumentosUseCase, RevisarDocumentoUseCase, SubirDocumentoUseCase } from './aplicacion/casos-de-uso';
import { REPOSITORIO_DOCUMENTOS } from './dominio/contratos';
import { DocumentoOrmEntity } from './infraestructura/documento.orm-entity';
import { RepositorioDocumentosTypeOrm } from './infraestructura/repositorio-documentos.typeorm';
import { DocumentosController } from './presentacion/documentos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentoOrmEntity]), ExpedientesModule],
  controllers: [DocumentosController],
  providers: [SubirDocumentoUseCase, RevisarDocumentoUseCase, ConsultarDocumentosUseCase, { provide: REPOSITORIO_DOCUMENTOS, useClass: RepositorioDocumentosTypeOrm }],
})
export class DocumentosModule {}
