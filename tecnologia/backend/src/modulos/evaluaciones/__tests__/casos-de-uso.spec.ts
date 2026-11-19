import { ConflictoError, RecursoNoEncontradoError, ReglaNegocioError } from '../../../compartido/dominio/errores';
import { Rol } from '../../../compartido/dominio/rol';
import { AuditoriaEnMemoria, expediente, ExpedientesEnMemoria, usuario } from '../../../test-utils/fakes';
import { Etapa } from '../../expedientes/dominio/etapa';
import { ConsultarEvaluacionesUseCase, CorregirResultadoUseCase, RegistrarResultadoUseCase, ValidarResultadoUseCase } from '../aplicacion/casos-de-uso';
import { CalificacionConocimientos, CalificacionManejo } from '../dominio/calificacion/calificacion.strategy';
import { RepositorioEvaluaciones } from '../dominio/contratos/contratos';
import { ResultadoBloqueadoError } from '../dominio/modelo/errores';
import { Evaluacion } from '../dominio/modelo/evaluacion';
import { EstadoResultado, TipoEvaluacion } from '../dominio/modelo/tipos';

class RepoEnMemoria implements RepositorioEvaluaciones {
  datos = new Map<number, Evaluacion>();
  async buscarPorId(id: number) {
    const e = this.datos.get(id);
    if (!e) throw new RecursoNoEncontradoError('no');
    return e;
  }
  async buscarOCrear(expedienteId: number, tipo: TipoEvaluacion) {
    const e = [...this.datos.values()].find((x) => x.expedienteId === expedienteId && x.tipo === tipo);
    if (e) return e;
    const nueva = new Evaluacion(this.datos.size + 1, expedienteId, tipo);
    this.datos.set(nueva.id, nueva);
    return nueva;
  }
  async listarDeExpediente(expedienteId: number) {
    return [...this.datos.values()].filter((x) => x.expedienteId === expedienteId);
  }
  async listarPorEstado(estado: EstadoResultado) {
    return [...this.datos.values()].filter((x) => x.estado === estado);
  }
  async guardar() {}
}

describe('Casos de uso de Evaluaciones', () => {
  const evaluador = usuario(Rol.EVALUADOR, { id: 2 });
  const supervisor = usuario(Rol.SUPERVISOR, { id: 3 });
  const estrategias = [new CalificacionConocimientos(14), new CalificacionManejo(14)];
  let repo: RepoEnMemoria;
  let expedientes: ExpedientesEnMemoria;
  let auditoria: AuditoriaEnMemoria;
  let registrar: RegistrarResultadoUseCase;
  let corregir: CorregirResultadoUseCase;
  let validar: ValidarResultadoUseCase;

  beforeEach(() => {
    repo = new RepoEnMemoria();
    expedientes = new ExpedientesEnMemoria(expediente(Etapa.EXAMEN_CONOCIMIENTOS));
    auditoria = new AuditoriaEnMemoria();
    registrar = new RegistrarResultadoUseCase(repo, expedientes, auditoria, estrategias);
    corregir = new CorregirResultadoUseCase(repo, auditoria, estrategias);
    validar = new ValidarResultadoUseCase(repo, expedientes, auditoria);
  });

  it('registra, valida y hace avanzar el expediente a EXAMEN_MANEJO', async () => {
    const r = await registrar.ejecutar(1, TipoEvaluacion.CONOCIMIENTOS, { puntaje: 17 }, evaluador);
    expect(r.estado).toBe(EstadoResultado.REGISTRADO);
    const v = await validar.ejecutar(r.id, supervisor);
    expect(v.bloqueada).toBe(true);
    expect(expedientes.actual.etapa).toBe(Etapa.EXAMEN_MANEJO);
    expect(auditoria.registros.map((a) => a.accion)).toEqual(['REGISTRAR_RESULTADO', 'VALIDAR_RESULTADO']);
  });

  it('no registra manejo si el expediente aún está en conocimientos', async () => {
    await expect(registrar.ejecutar(1, TipoEvaluacion.MANEJO, { puntaje: 18 }, evaluador)).rejects.toThrow(ConflictoError);
  });

  it('un desaprobado validado no hace avanzar el expediente', async () => {
    const r = await registrar.ejecutar(1, TipoEvaluacion.CONOCIMIENTOS, { puntaje: 8 }, evaluador);
    await validar.ejecutar(r.id, supervisor);
    expect(expedientes.actual.etapa).toBe(Etapa.EXAMEN_CONOCIMIENTOS);
  });

  it('corrige antes de validar y lo deja en auditoría con motivo', async () => {
    const r = await registrar.ejecutar(1, TipoEvaluacion.CONOCIMIENTOS, { puntaje: 10 }, evaluador);
    const c = await corregir.ejecutar(r.id, { puntaje: 15 }, 'Error de digitación', evaluador);
    expect(c.resultadoActual?.puntaje).toBe(15);
    expect(auditoria.registros.at(-1)).toMatchObject({ accion: 'CORREGIR_RESULTADO', motivo: 'Error de digitación' });
  });

  it('rechaza corregir un validado y registra el intento en auditoría (EQ-09)', async () => {
    const r = await registrar.ejecutar(1, TipoEvaluacion.CONOCIMIENTOS, { puntaje: 16 }, evaluador);
    await validar.ejecutar(r.id, supervisor);
    await expect(corregir.ejecutar(r.id, { puntaje: 20 }, 'cambio', evaluador)).rejects.toThrow(ResultadoBloqueadoError);
    expect(auditoria.registros.at(-1)?.accion).toBe('INTENTO_MODIFICAR_BLOQUEADO');
    expect((await repo.buscarPorId(r.id)).resultado?.puntaje).toBe(16);
  });

  it('el postulante solo ve resultados validados (RF19)', async () => {
    await registrar.ejecutar(1, TipoEvaluacion.CONOCIMIENTOS, { puntaje: 10 }, evaluador);
    const consultar = new ConsultarEvaluacionesUseCase(repo, expedientes);
    const propio = await consultar.ejecutar(1, usuario(Rol.POSTULANTE, { postulanteId: 10 }));
    expect(propio[0].resultadoActual).toBeNull();
    const personal = await consultar.ejecutar(1, supervisor);
    expect(personal[0].resultadoActual?.puntaje).toBe(10);
    expect(await consultar.pendientesDeValidar()).toHaveLength(1);
  });

  it('falla si no hay estrategia para el tipo de examen', async () => {
    const sinEstrategias = new RegistrarResultadoUseCase(repo, expedientes, auditoria, []);
    await expect(sinEstrategias.ejecutar(1, TipoEvaluacion.CONOCIMIENTOS, { puntaje: 15 }, evaluador)).rejects.toThrow(ReglaNegocioError);
  });
});
