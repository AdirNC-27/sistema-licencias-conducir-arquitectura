import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecursoNoEncontradoError } from '../../../compartido/dominio/errores';
import { ArchivoDocumento, RepositorioDocumentos } from '../dominio/contratos';
import { Documento, TipoDocumento } from '../dominio/documento';
import { DocumentoOrmEntity } from './documento.orm-entity';

@Injectable()
export class RepositorioDocumentosTypeOrm implements RepositorioDocumentos {
  constructor(@InjectRepository(DocumentoOrmEntity) private readonly orm: Repository<DocumentoOrmEntity>) {}

  async registrar(datos: { expedienteId: number; tipo: TipoDocumento; fechaEmision: Date | null; archivo: ArchivoDocumento }): Promise<Documento> {
    const fila = await this.orm.save(
      this.orm.create({
        expedienteId: datos.expedienteId,
        tipo: datos.tipo,
        fechaEmision: datos.fechaEmision ? datos.fechaEmision.toISOString().slice(0, 10) : null,
        nombreArchivo: datos.archivo.nombre.slice(0, 150),
        tipoMime: datos.archivo.tipoMime,
        contenido: datos.archivo.contenido,
      }),
    );
    return fila.aDominio();
  }

  async buscarPorId(id: number): Promise<Documento> {
    const fila = await this.orm.findOneBy({ id });
    if (!fila) throw new RecursoNoEncontradoError(`No existe el documento ${id}`);
    return fila.aDominio();
  }

  async listarDeExpediente(expedienteId: number): Promise<Documento[]> {
    return (await this.orm.find({ where: { expedienteId }, order: { id: 'ASC' } })).map((f) => f.aDominio());
  }

  async guardarRevision(documento: Documento): Promise<void> {
    await this.orm.update({ id: documento.id }, { estado: documento.estado, observacion: documento.observacion });
  }

  async leerArchivo(id: number): Promise<ArchivoDocumento> {
    const fila = await this.orm.findOne({ where: { id }, select: { id: true, nombreArchivo: true, tipoMime: true, contenido: true } });
    if (!fila) throw new RecursoNoEncontradoError(`No existe el documento ${id}`);
    return { nombre: fila.nombreArchivo, tipoMime: fila.tipoMime, contenido: fila.contenido };
  }
}
