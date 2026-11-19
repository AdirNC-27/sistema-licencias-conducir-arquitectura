import { Inject, Injectable } from '@nestjs/common';
import { ReglaNegocioError } from '../../../compartido/dominio/errores';
import { UsuarioActual } from '../../../compartido/dominio/rol';
import { EXPEDIENTES_API, ExpedientesApi } from '../../expedientes/dominio/contratos';
import { Etapa } from '../../expedientes/dominio/etapa';
import { REGISTRO_AUDITORIA, RegistroAuditoria } from '../../auditoria/dominio/registro-auditoria';
import { CalificacionStrategy, DatosCalificacion } from '../dominio/calificacion/calificacion.strategy';
import { ESTRATEGIAS_CALIFICACION, REPOSITORIO_EVALUACIONES, RepositorioEvaluaciones } from '../dominio/contratos/contratos';
import { Evaluacion } from '../dominio/modelo/evaluacion';
import { EstadoResultado, TipoEvaluacion } from '../dominio/modelo/tipos';

export const vistaEvaluacion = (e: Evaluacion) => ({
  id: e.id,
  expedienteId: e.expedienteId,
  tipo: e.tipo,
  estado: e.estado,
  intentos: e.intentos,
  intentosRestantes: Evaluacion.MAXIMO_INTENTOS - e.intentos,
  resultadoActual: e.resultado,
  historial: e.historial,
  bloqueada: e.estaBloqueada(),
});

const ETAPA_DEL_EXAMEN: Record<TipoEvaluacion, Etapa> = {
  [TipoEvaluacion.CONOCIMIENTOS]: Etapa.EXAMEN_CONOCIMIENTOS,
  [TipoEvaluacion.MANEJO]: Etapa.EXAMEN_MANEJO,
};

function estrategiaPara(estrategias: CalificacionStrategy[], tipo: TipoEvaluacion): CalificacionStrategy {
  const encontrada = estrategias.find((e) => e.tipo === tipo);
  if (!encontrada) throw new ReglaNegocioError(`No hay calificación para ${tipo}`);
  return encontrada;
}

/** RF08: el evaluador registra el resultado de un intento (máximo 3). */
@Injectable()
export class RegistrarResultadoUseCase {
  constructor(
    @Inject(REPOSITORIO_EVALUACIONES) private readonly repositorio: RepositorioEvaluaciones,
    @Inject(EXPEDIENTES_API) private readonly expedientes: ExpedientesApi,
    @Inject(REGISTRO_AUDITORIA) private readonly auditoria: RegistroAuditoria,
    @Inject(ESTRATEGIAS_CALIFICACION) private readonly estrategias: CalificacionStrategy[],
  ) {}

  async ejecutar(expedienteId: number, tipo: TipoEvaluacion, datos: DatosCalificacion, evaluador: UsuarioActual) {
    const expediente = await this.expedientes.obtener(expedienteId);
    expediente.exigirEtapa(ETAPA_DEL_EXAMEN[tipo]); // manejo solo después de aprobar conocimientos
    const evaluacion = await this.repositorio.buscarOCrear(expedienteId, tipo);
    evaluacion.registrar(estrategiaPara(this.estrategias, tipo).calificar(datos));
    await this.repositorio.guardar(evaluacion);
    await this.auditoria.registrar({
      usuarioId: evaluador.id,
      accion: 'REGISTRAR_RESULTADO',
      entidad: 'evaluacion',
      entidadId: evaluacion.id,
      valorAnterior: null,
      valorNuevo: { intento: evaluacion.intentos, resultado: evaluacion.resultado },
    });
    return vistaEvaluacion(evaluacion);
  }
}

/** RF09: corregir antes de la validación, sin consumir intento. */
@Injectable()
export class CorregirResultadoUseCase {
  constructor(
    @Inject(REPOSITORIO_EVALUACIONES) private readonly repositorio: RepositorioEvaluaciones,
    @Inject(REGISTRO_AUDITORIA) private readonly auditoria: RegistroAuditoria,
    @Inject(ESTRATEGIAS_CALIFICACION) private readonly estrategias: CalificacionStrategy[],
  ) {}

  async ejecutar(evaluacionId: number, datos: DatosCalificacion, motivo: string, evaluador: UsuarioActual) {
    const evaluacion = await this.repositorio.buscarPorId(evaluacionId);
    try {
      const anterior = evaluacion.corregir(estrategiaPara(this.estrategias, evaluacion.tipo).calificar(datos));
      await this.repositorio.guardar(evaluacion);
      await this.auditoria.registrar({
        usuarioId: evaluador.id,
        accion: 'CORREGIR_RESULTADO',
        entidad: 'evaluacion',
        entidadId: evaluacion.id,
        valorAnterior: anterior,
        valorNuevo: evaluacion.resultado,
        motivo,
      });
      return vistaEvaluacion(evaluacion);
    } catch (error) {
      // EQ-09: el intento de modificar un resultado validado también queda registrado
      await this.auditoria.registrar({
        usuarioId: evaluador.id,
        accion: 'INTENTO_MODIFICAR_BLOQUEADO',
        entidad: 'evaluacion',
        entidadId: evaluacion.id,
        valorAnterior: evaluacion.resultado,
        valorNuevo: datos,
        motivo,
      });
      throw error;
    }
  }
}

/** RF09 y DA04: el supervisor valida; el resultado queda bloqueado y, si aprobó, el expediente avanza. */
@Injectable()
export class ValidarResultadoUseCase {
  constructor(
    @Inject(REPOSITORIO_EVALUACIONES) private readonly repositorio: RepositorioEvaluaciones,
    @Inject(EXPEDIENTES_API) private readonly expedientes: ExpedientesApi,
    @Inject(REGISTRO_AUDITORIA) private readonly auditoria: RegistroAuditoria,
  ) {}

  async ejecutar(evaluacionId: number, supervisor: UsuarioActual) {
    const evaluacion = await this.repositorio.buscarPorId(evaluacionId);
    evaluacion.validar();
    await this.repositorio.guardar(evaluacion);
    await this.auditoria.registrar({
      usuarioId: supervisor.id,
      accion: 'VALIDAR_RESULTADO',
      entidad: 'evaluacion',
      entidadId: evaluacion.id,
      valorAnterior: { estado: 'REGISTRADO' },
      valorNuevo: { estado: evaluacion.estado, historial: evaluacion.historial },
    });
    if (evaluacion.fueAprobada()) {
      await this.expedientes.avanzarEtapa(evaluacion.expedienteId, ETAPA_DEL_EXAMEN[evaluacion.tipo], supervisor.id);
    }
    return vistaEvaluacion(evaluacion);
  }
}

@Injectable()
export class ConsultarEvaluacionesUseCase {
  constructor(
    @Inject(REPOSITORIO_EVALUACIONES) private readonly repositorio: RepositorioEvaluaciones,
    @Inject(EXPEDIENTES_API) private readonly expedientes: ExpedientesApi,
  ) {}

  /** RF19: el postulante solo ve resultados ya validados; el personal ve todo. */
  async ejecutar(expedienteId: number, usuario: UsuarioActual) {
    (await this.expedientes.obtener(expedienteId)).verificarAcceso(usuario);
    const vistas = (await this.repositorio.listarDeExpediente(expedienteId)).map(vistaEvaluacion);
    return usuario.rol === 'POSTULANTE' ? vistas.map((v) => ({ ...v, resultadoActual: null })) : vistas;
  }

  /** Bandeja del supervisor: resultados registrados que esperan validación. */
  async pendientesDeValidar() {
    return (await this.repositorio.listarPorEstado(EstadoResultado.REGISTRADO)).map(vistaEvaluacion);
  }
}
