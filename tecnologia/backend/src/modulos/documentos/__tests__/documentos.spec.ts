import { Categoria } from '../../../compartido/dominio/categoria';
import { ConflictoError, RecursoNoEncontradoError, ReglaNegocioError } from '../../../compartido/dominio/errores';
import { Rol } from '../../../compartido/dominio/rol';
import { eventosFalsos, expediente, ExpedientesEnMemoria, usuario } from '../../../test-utils/fakes';
import { Etapa } from '../../expedientes/dominio/etapa';
import { ConsultarDocumentosUseCase, RevisarDocumentoUseCase, SubirDocumentoUseCase } from '../aplicacion/casos-de-uso';
import { ArchivoDocumento, RepositorioDocumentos } from '../dominio/contratos';
import { certificadoVigente, Documento, documentosObligatorios, EstadoDocumento, TipoDocumento } from '../dominio/documento';

const pdf: ArchivoDocumento = { nombre: 'a.pdf', tipoMime: 'application/pdf', contenido: Buffer.from('%PDF') };

class RepoDocs implements RepositorioDocumentos {
  datos: Documento[] = [];
  async registrar(d: { expedienteId: number; tipo: TipoDocumento; fechaEmision: Date | null }) {
    const doc = new Documento(this.datos.length + 1, d.expedienteId, d.tipo, EstadoDocumento.PENDIENTE, null, d.fechaEmision);
    this.datos.push(doc);
    return doc;
  }
  async buscarPorId(id: number) {
    const d = this.datos.find((x) => x.id === id);
    if (!d) throw new RecursoNoEncontradoError('no');
    return d;
  }
  async listarDeExpediente(e: number) {
    return this.datos.filter((x) => x.expedienteId === e);
  }
  async guardarRevision() {}
  async leerArchivo() {
    return pdf;
  }
}

describe('Documentos · reglas del TUPA', () => {
  it('la II-C exige además la constancia COFIPRO', () => {
    expect(documentosObligatorios(Categoria.II_B)).toHaveLength(3);
    expect(documentosObligatorios(Categoria.II_C)).toContain(TipoDocumento.CONSTANCIA_COFIPRO);
  });

  it('el certificado médico vence a los 6 meses (RF23)', () => {
    expect(certificadoVigente(new Date('2026-06-01'), new Date('2026-11-19'))).toBe(true);
    expect(certificadoVigente(new Date('2026-05-01'), new Date('2026-11-19'))).toBe(false);
  });

  it('no aprueba un certificado vencido; observar exige motivo; un aprobado no cambia', () => {
    const vencido = new Documento(1, 1, TipoDocumento.CERTIFICADO_MEDICO, EstadoDocumento.PENDIENTE, null, new Date('2025-01-01'));
    expect(() => vencido.revisar(EstadoDocumento.APROBADO, null)).toThrow(ReglaNegocioError);
    expect(() => vencido.revisar(EstadoDocumento.OBSERVADO, null)).toThrow(ReglaNegocioError);
    const foto = new Documento(2, 1, TipoDocumento.FOTOGRAFIA, EstadoDocumento.PENDIENTE, null, null);
    foto.revisar(EstadoDocumento.APROBADO, null);
    expect(() => foto.revisar(EstadoDocumento.OBSERVADO, 'x')).toThrow(ConflictoError);
  });
});

describe('Casos de uso de Documentos (RF03, RF04)', () => {
  const postulante = usuario(Rol.POSTULANTE, { postulanteId: 10 });
  const gestor = usuario(Rol.GESTOR, { id: 2 });
  const hoy = new Date();

  it('con todos los documentos aprobados el expediente pasa a PAGO', async () => {
    const repo = new RepoDocs();
    const exp = new ExpedientesEnMemoria(expediente(Etapa.DOCUMENTOS, Categoria.II_B));
    const subir = new SubirDocumentoUseCase(repo, exp);
    await subir.ejecutar(1, TipoDocumento.DECLARACION_JURADA, null, pdf, postulante);
    await subir.ejecutar(1, TipoDocumento.CERTIFICADO_MEDICO, hoy, pdf, postulante);
    await subir.ejecutar(1, TipoDocumento.FOTOGRAFIA, null, { ...pdf, tipoMime: 'image/png' }, postulante);
    const eventos = eventosFalsos();
    const revisar = new RevisarDocumentoUseCase(repo, exp, eventos);
    const [primero, ...resto] = repo.datos;
    await revisar.ejecutar(primero.id, EstadoDocumento.OBSERVADO, 'La firma no es legible', gestor);
    expect(eventos.emit).toHaveBeenCalledWith('auditoria.operacion', expect.objectContaining({ accion: 'OBSERVAR_DOCUMENTO', usuarioId: 2 }));
    expect(exp.actual.etapa).toBe(Etapa.DOCUMENTOS);
    await subir.ejecutar(1, TipoDocumento.DECLARACION_JURADA, null, pdf, postulante); // lo vuelve a adjuntar
    for (const d of [...resto, repo.datos[repo.datos.length - 1]]) await revisar.ejecutar(d.id, EstadoDocumento.APROBADO, null, gestor);
    expect(eventos.emit).toHaveBeenCalledWith('auditoria.operacion', expect.objectContaining({ accion: 'APROBAR_DOCUMENTO' }));
    expect(exp.actual.etapa).toBe(Etapa.PAGO);
    expect(await new ConsultarDocumentosUseCase(repo, exp).listar(1, postulante)).toHaveLength(4);
    expect((await new ConsultarDocumentosUseCase(repo, exp).archivo(1, gestor)).nombre).toBe('a.pdf');
  });

  it('valida tipo de archivo, tamaño, categoría, fecha del certificado y duplicados', async () => {
    const repo = new RepoDocs();
    const subir = new SubirDocumentoUseCase(repo, new ExpedientesEnMemoria(expediente(Etapa.DOCUMENTOS, Categoria.II_B)));
    await expect(subir.ejecutar(1, TipoDocumento.FOTOGRAFIA, null, { ...pdf, tipoMime: 'text/plain' }, postulante)).rejects.toThrow(ReglaNegocioError);
    await expect(subir.ejecutar(1, TipoDocumento.FOTOGRAFIA, null, { ...pdf, contenido: Buffer.alloc(3 * 1024 * 1024) }, postulante)).rejects.toThrow(ReglaNegocioError);
    await expect(subir.ejecutar(1, TipoDocumento.CONSTANCIA_COFIPRO, null, pdf, postulante)).rejects.toThrow(ReglaNegocioError);
    await expect(subir.ejecutar(1, TipoDocumento.CERTIFICADO_MEDICO, null, pdf, postulante)).rejects.toThrow(ReglaNegocioError);
    await subir.ejecutar(1, TipoDocumento.FOTOGRAFIA, null, pdf, postulante);
    await expect(subir.ejecutar(1, TipoDocumento.FOTOGRAFIA, null, pdf, postulante)).rejects.toThrow(ConflictoError);
  });
});
