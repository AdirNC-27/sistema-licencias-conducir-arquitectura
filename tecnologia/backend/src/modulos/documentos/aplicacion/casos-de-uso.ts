import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConflictoError, ReglaNegocioError } from '../../../compartido/dominio/errores';
import { UsuarioActual } from '../../../compartido/dominio/rol';
import { EVENTOS, OperacionAuditable } from '../../../compartido/eventos/eventos';
import { EXPEDIENTES_API, ExpedientesApi } from '../../expedientes/dominio/contratos';
import { Etapa } from '../../expedientes/dominio/etapa';
import { ArchivoDocumento, REPOSITORIO_DOCUMENTOS, RepositorioDocumentos } from '../dominio/contratos';
import { Documento, documentosObligatorios, EstadoDocumento, TipoDocumento } from '../dominio/documento';

const TAMANO_MAXIMO = 2 * 1024 * 1024;
const TIPOS_PERMITIDOS = ['application/pdf', 'image/jpeg', 'image/png'];

const vista = (d: Documento) => ({ id: d.id, expedienteId: d.expedienteId, tipo: d.tipo, estado: d.estado, observacion: d.observacion });

/** RF03: el postulante adjunta un documento de su expediente. */
@Injectable()
export class SubirDocumentoUseCase {
  constructor(
    @Inject(REPOSITORIO_DOCUMENTOS) private readonly documentos: RepositorioDocumentos,
    @Inject(EXPEDIENTES_API) private readonly expedientes: ExpedientesApi,
  ) {}

  async ejecutar(expedienteId: number, tipo: TipoDocumento, fechaEmision: Date | null, archivo: ArchivoDocumento, usuario: UsuarioActual) {
    const expediente = await this.expedientes.obtener(expedienteId);
    expediente.verificarAcceso(usuario);
    expediente.exigirEtapa(Etapa.DOCUMENTOS);
    if (!documentosObligatorios(expediente.categoria).includes(tipo)) throw new ReglaNegocioError(`${tipo} no corresponde a la categoría ${expediente.categoria}`);
    if (!TIPOS_PERMITIDOS.includes(archivo.tipoMime)) throw new ReglaNegocioError('Solo se aceptan PDF, JPG o PNG');
    if (archivo.contenido.length > TAMANO_MAXIMO) throw new ReglaNegocioError('El archivo supera 2 MB');
    if (tipo === TipoDocumento.CERTIFICADO_MEDICO && !fechaEmision) throw new ReglaNegocioError('Indique la fecha de emisión del certificado');
    const existentes = await this.documentos.listarDeExpediente(expedienteId);
    if (existentes.some((d) => d.tipo === tipo && d.estado !== EstadoDocumento.OBSERVADO)) {
      throw new ConflictoError(`Ya registró ${tipo}`);
    }
    return vista(await this.documentos.registrar({ expedienteId, tipo, fechaEmision, archivo }));
  }
}

/** RF04: el gestor aprueba u observa. Con todos aprobados, el expediente pasa a PAGO (RF20). */
@Injectable()
export class RevisarDocumentoUseCase {
  constructor(
    @Inject(REPOSITORIO_DOCUMENTOS) private readonly documentos: RepositorioDocumentos,
    @Inject(EXPEDIENTES_API) private readonly expedientes: ExpedientesApi,
    private readonly eventos: EventEmitter2,
  ) {}

  async ejecutar(documentoId: number, estado: EstadoDocumento.APROBADO | EstadoDocumento.OBSERVADO, observacion: string | null, gestor: UsuarioActual) {
    const documento = await this.documentos.buscarPorId(documentoId);
    const anterior = documento.revisar(estado, observacion);
    await this.documentos.guardarRevision(documento);
    const operacion: OperacionAuditable = {
      usuarioId: gestor.id,
      accion: estado === EstadoDocumento.APROBADO ? 'APROBAR_DOCUMENTO' : 'OBSERVAR_DOCUMENTO',
      entidad: 'documento',
      entidadId: documento.id,
      valorAnterior: { estado: anterior },
      valorNuevo: { estado, observacion },
    };
    this.eventos.emit(EVENTOS.OPERACION_AUDITABLE, operacion);

    const expediente = await this.expedientes.obtener(documento.expedienteId);
    const aprobados = (await this.documentos.listarDeExpediente(expediente.id)).filter((d) => d.estado === EstadoDocumento.APROBADO).map((d) => d.tipo);
    const completo = documentosObligatorios(expediente.categoria).every((t) => aprobados.includes(t));
    if (completo && expediente.etapa === Etapa.DOCUMENTOS) await this.expedientes.avanzarEtapa(expediente.id, Etapa.DOCUMENTOS, gestor.id);
    return { ...vista(documento), expedienteCompleto: completo };
  }
}

@Injectable()
export class ConsultarDocumentosUseCase {
  constructor(
    @Inject(REPOSITORIO_DOCUMENTOS) private readonly documentos: RepositorioDocumentos,
    @Inject(EXPEDIENTES_API) private readonly expedientes: ExpedientesApi,
  ) {}

  async listar(expedienteId: number, usuario: UsuarioActual) {
    (await this.expedientes.obtener(expedienteId)).verificarAcceso(usuario);
    return (await this.documentos.listarDeExpediente(expedienteId)).map(vista);
  }

  /** EQ-02: el archivo solo se entrega al dueño del expediente o al personal, nunca por URL pública. */
  async archivo(documentoId: number, usuario: UsuarioActual): Promise<ArchivoDocumento> {
    const documento = await this.documentos.buscarPorId(documentoId);
    (await this.expedientes.obtener(documento.expedienteId)).verificarAcceso(usuario);
    return this.documentos.leerArchivo(documentoId);
  }
}
