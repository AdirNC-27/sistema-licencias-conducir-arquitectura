import { EVENTOS } from '../../../compartido/eventos/eventos';
import { Categoria, TipoTramite } from '../../../compartido/dominio/categoria';
import { AccesoDenegadoError, ConflictoError, ReglaNegocioError } from '../../../compartido/dominio/errores';
import { Rol } from '../../../compartido/dominio/rol';
import { eventosFalsos, expediente, usuario } from '../../../test-utils/fakes';
import { CambiarCategoriaUseCase, ConsultarExpedienteUseCase, CrearExpedienteUseCase } from '../aplicacion/casos-de-uso';
import { ExpedientesFacade } from '../aplicacion/expedientes.facade';
import { RepositorioExpedientes } from '../dominio/contratos';
import { Etapa, ORDEN_ETAPAS, siguienteEtapa } from '../dominio/etapa';
import { Expediente } from '../dominio/expediente';
import { calcularPlazo, diasHabilesEntre } from '../dominio/plazo';

describe('Expediente · etapas en orden (RF20)', () => {
  it('avanza solo desde la etapa esperada', () => {
    const e = expediente(Etapa.DOCUMENTOS);
    expect(e.avanzarDesde(Etapa.DOCUMENTOS)).toBe(Etapa.DOCUMENTOS);
    expect(e.etapa).toBe(Etapa.PAGO);
  });

  it('no permite saltarse una etapa', () => {
    expect(() => expediente(Etapa.DOCUMENTOS).avanzarDesde(Etapa.PAGO)).toThrow(ConflictoError);
  });

  it('no avanza después de EMITIDA', () => {
    expect(() => expediente(Etapa.EMITIDA).avanzarDesde(Etapa.EMITIDA)).toThrow(ConflictoError);
    expect(siguienteEtapa(Etapa.EMITIDA)).toBeNull();
    expect(ORDEN_ETAPAS).toHaveLength(7);
  });

  it('exigirEtapa rechaza operaciones fuera de etapa', () => {
    expect(() => expediente(Etapa.PAGO).exigirEtapa(Etapa.CITA)).toThrow(ConflictoError);
    expect(() => expediente(Etapa.PAGO).exigirEtapa(Etapa.CITA, Etapa.PAGO)).not.toThrow();
  });
});

describe('Expediente · privacidad (EQ-02)', () => {
  it('el dueño y el personal pueden verlo; otro postulante no', () => {
    const e = expediente(Etapa.PAGO, Categoria.II_B, 10);
    expect(() => e.verificarAcceso(usuario(Rol.POSTULANTE, { postulanteId: 10 }))).not.toThrow();
    expect(() => e.verificarAcceso(usuario(Rol.GESTOR))).not.toThrow();
    expect(() => e.verificarAcceso(usuario(Rol.POSTULANTE, { postulanteId: 99 }))).toThrow(AccesoDenegadoError);
  });
});

describe('Plazo legal de 10 días hábiles (RF10)', () => {
  it('cuenta solo de lunes a viernes', () => {
    // lunes 16 → lunes 23 de noviembre de 2026 = 5 días hábiles
    expect(diasHabilesEntre(new Date('2026-11-16T10:00:00Z'), new Date('2026-11-23T10:00:00Z'))).toBe(5);
  });

  it('marca vencido después de 10 días hábiles', () => {
    const p = calcularPlazo(new Date('2026-11-02T10:00:00Z'), new Date('2026-11-18T10:00:00Z'));
    expect(p.diasTranscurridos).toBe(12);
    expect(p.vencido).toBe(true);
    expect(p.diasRestantes).toBe(0);
    expect(p.porcentaje).toBe(100);
  });
});

class RepoEnMemoria implements RepositorioExpedientes {
  datos: Expediente[] = [];
  activo = false;
  async crear(d: { postulanteId: number; tipoTramite: TipoTramite; categoria: Categoria }) {
    const e = new Expediente(this.datos.length + 1, `EXP-2026-0000${this.datos.length + 1}`, d.postulanteId, d.tipoTramite, d.categoria, Etapa.DOCUMENTOS, new Date());
    this.datos.push(e);
    return e;
  }
  async buscarPorId(id: number) {
    return this.datos.find((e) => e.id === id)!;
  }
  async listar() {
    return { total: this.datos.length, datos: this.datos };
  }
  async listarDePostulante(p: number) {
    return this.datos.filter((e) => e.postulanteId === p);
  }
  async guardarEtapa() {}
  guardadas: Categoria[] = [];
  async guardarCategoria(e: Expediente) {
    this.guardadas.push(e.categoria);
  }
  async tieneTramiteActivo() {
    return this.activo;
  }
}

describe('Casos de uso de Expedientes', () => {
  const postulante = usuario(Rol.POSTULANTE, { postulanteId: 10 });

  it('crea una solicitud de emisión en etapa DOCUMENTOS (RF02)', async () => {
    const repo = new RepoEnMemoria();
    const v = await new CrearExpedienteUseCase(repo).ejecutar(postulante, TipoTramite.EMISION, Categoria.II_C);
    expect(v.etapa).toBe(Etapa.DOCUMENTOS);
    expect(v.plazo.diasRestantes).toBe(10);
  });

  it('rechaza un segundo trámite activo, otro tipo de trámite o un usuario que no es postulante', async () => {
    const repo = new RepoEnMemoria();
    const caso = new CrearExpedienteUseCase(repo);
    repo.activo = true;
    await expect(caso.ejecutar(postulante, TipoTramite.EMISION, Categoria.II_B)).rejects.toThrow(ConflictoError);
    await expect(caso.ejecutar(postulante, TipoTramite.DUPLICADO, Categoria.II_B)).rejects.toThrow(ReglaNegocioError);
    await expect(caso.ejecutar(usuario(Rol.GESTOR), TipoTramite.EMISION, Categoria.II_B)).rejects.toThrow(AccesoDenegadoError);
  });

  it('el postulante cambia la categoría en DOCUMENTOS y queda auditado con su motivo', async () => {
    const repo = new RepoEnMemoria();
    await new CrearExpedienteUseCase(repo).ejecutar(postulante, TipoTramite.EMISION, Categoria.II_C);
    const eventos = eventosFalsos();
    const v = await new CambiarCategoriaUseCase(repo, eventos).ejecutar(1, postulante, Categoria.II_B, 'Me equivoqué de categoría');
    expect(v.categoria).toBe(Categoria.II_B);
    expect(repo.guardadas).toEqual([Categoria.II_B]);
    expect(eventos.emit).toHaveBeenCalledWith(EVENTOS.OPERACION_AUDITABLE, expect.objectContaining({
      accion: 'CAMBIAR_CATEGORIA', valorAnterior: { categoria: Categoria.II_C }, valorNuevo: { categoria: Categoria.II_B }, motivo: 'Me equivoqué de categoría',
    }));
  });

  it('no cambia la categoría fuera de DOCUMENTOS, a la misma categoría, ni para otro usuario', () => {
    const e = expediente(Etapa.DOCUMENTOS);
    const dueno = usuario(Rol.POSTULANTE, { postulanteId: e.postulanteId });
    expect(() => e.cambiarCategoria(e.categoria, dueno)).toThrow(ReglaNegocioError);
    expect(() => e.cambiarCategoria(Categoria.II_B, usuario(Rol.GESTOR))).toThrow(AccesoDenegadoError);
    expect(() => e.cambiarCategoria(Categoria.II_B, usuario(Rol.POSTULANTE, { postulanteId: 999 }))).toThrow(AccesoDenegadoError);
    expect(() => expediente(Etapa.PAGO).cambiarCategoria(Categoria.II_B, dueno)).toThrow(ConflictoError);
  });

  it('consulta, lista y bandeja', async () => {
    const repo = new RepoEnMemoria();
    await new CrearExpedienteUseCase(repo).ejecutar(postulante, TipoTramite.EMISION, Categoria.II_C);
    const consultar = new ConsultarExpedienteUseCase(repo);
    expect((await consultar.ejecutar(1, postulante)).numero).toBe('EXP-2026-00001');
    expect(await consultar.mios(postulante)).toHaveLength(1);
    expect(await consultar.mios(usuario(Rol.GESTOR))).toHaveLength(0);
    expect((await consultar.bandeja({ pagina: 1, tamano: 20 })).total).toBe(1);
  });

  it('la fachada avanza, audita, notifica y devuelve el último trámite del postulante', async () => {
    const repo = new RepoEnMemoria();
    await repo.crear({ postulanteId: 10, tipoTramite: TipoTramite.EMISION, categoria: Categoria.II_B });
    const eventos = eventosFalsos();
    const fachada = new ExpedientesFacade(repo, eventos);
    await fachada.avanzarEtapa(1, Etapa.DOCUMENTOS, 5);
    expect(eventos.emit).toHaveBeenCalledTimes(2);
    expect((await fachada.obtener(1)).etapa).toBe(Etapa.PAGO);
    expect((await fachada.ultimoDePostulante(10))?.numero).toBe('EXP-2026-00001');
    expect(await fachada.ultimoDePostulante(99)).toBeNull();
  });
});
