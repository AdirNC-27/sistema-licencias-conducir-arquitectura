import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConflictoError, RecursoNoEncontradoError, ReglaNegocioError } from '../../../compartido/dominio/errores';
import { UsuarioActual } from '../../../compartido/dominio/rol';
import { EVENTOS, LicenciaRegistrada, OperacionAuditable } from '../../../compartido/eventos/eventos';
import { EXPEDIENTES_API, ExpedientesApi } from '../../expedientes/dominio/contratos';
import { Etapa } from '../../expedientes/dominio/etapa';
import { REPOSITORIO_REVISION, RepositorioRevision } from '../dominio/contratos';
import { EstadoObservacion, ObservacionExpediente } from '../dominio/observacion';
import { LicenciaEmitida, normalizarNumeroLicencia, pendientesDeEmision } from '../dominio/revision';
import { ResultadoVerificacion, TipoVerificacion, validarVerificacion, verificacionesObligatorias } from '../dominio/verificacion';

export const vistaObservacion = (o: ObservacionExpediente) => ({
  id: o.id,
  expedienteId: o.expedienteId,
  motivo: o.motivo,
  estado: o.estado,
  supervisorId: o.supervisorId,
  creadoEn: o.creadoEn,
  respuesta: o.respuesta,
  gestorId: o.gestorId,
  atendidaEn: o.atendidaEn,
});

const vistaLicencia = (l: LicenciaEmitida) => ({ expedienteId: l.expedienteId, numero: l.numero, gestorId: l.gestorId, registradaEn: l.registradaEn });

/** Base común: cada operación queda en la bitácora (ADR-006). */
abstract class OperacionRevision {
  constructor(
    @Inject(REPOSITORIO_REVISION) protected readonly repositorio: RepositorioRevision,
    @Inject(EXPEDIENTES_API) protected readonly expedientes: ExpedientesApi,
    protected readonly eventos: EventEmitter2,
  ) {}

  protected auditar(operacion: OperacionAuditable): void {
    this.eventos.emit(EVENTOS.OPERACION_AUDITABLE, operacion);
  }
}

/** RF24 y RF27 · HU29 y HU32: el gestor deja constancia de lo que vio en el portal oficial. */
@Injectable()
export class RegistrarVerificacionUseCase extends OperacionRevision {
  async ejecutar(expedienteId: number, tipo: TipoVerificacion, resultado: ResultadoVerificacion, detalle: string | null, gestor: UsuarioActual) {
    const expediente = await this.expedientes.obtener(expedienteId);
    if (expediente.etapa === Etapa.EMITIDA) throw new ConflictoError(`El expediente ${expediente.numero} ya fue emitido`);
    validarVerificacion(expediente.categoria, tipo, resultado, detalle);
    const v = await this.repositorio.registrarVerificacion({ expedienteId, tipo, resultado, detalle: detalle?.trim() || null, gestorId: gestor.id });
    this.auditar({ usuarioId: gestor.id, accion: 'VERIFICAR_PORTAL_OFICIAL', entidad: 'expediente', entidadId: expedienteId, valorAnterior: null, valorNuevo: { tipo, resultado, detalle: v.detalle } });
    return v;
  }
}

/** RF11 · HU21: el supervisor devuelve el expediente al gestor. Mientras esté abierta, no se emite. */
@Injectable()
export class ObservarExpedienteUseCase extends OperacionRevision {
  async ejecutar(expedienteId: number, motivo: string, supervisor: UsuarioActual) {
    const expediente = await this.expedientes.obtener(expedienteId);
    expediente.exigirEtapa(Etapa.EMISION);
    ObservacionExpediente.validarMotivo(motivo);
    const abiertas = (await this.repositorio.observacionesDe(expedienteId)).filter((o) => o.estado === EstadoObservacion.ABIERTA);
    if (abiertas.length > 0) throw new ConflictoError('El expediente ya tiene una observación sin atender');
    const o = await this.repositorio.crearObservacion({ expedienteId, motivo: motivo.trim(), supervisorId: supervisor.id });
    this.auditar({ usuarioId: supervisor.id, accion: 'OBSERVAR_EXPEDIENTE', entidad: 'expediente', entidadId: expedienteId, valorAnterior: null, valorNuevo: { estado: o.estado }, motivo: o.motivo });
    return vistaObservacion(o);
  }
}

/** RF11: el gestor corrige y deja constancia; el supervisor vuelve a revisar. */
@Injectable()
export class AtenderObservacionUseCase extends OperacionRevision {
  async ejecutar(observacionId: number, respuesta: string, gestor: UsuarioActual) {
    const o = await this.repositorio.buscarObservacion(observacionId);
    o.atender(respuesta, gestor.id);
    await this.repositorio.guardarAtencion(o);
    this.auditar({ usuarioId: gestor.id, accion: 'ATENDER_OBSERVACION', entidad: 'expediente', entidadId: o.expedienteId, valorAnterior: { estado: EstadoObservacion.ABIERTA }, valorNuevo: { estado: o.estado, respuesta: o.respuesta } });
    return vistaObservacion(o);
  }
}

/** RF12: el supervisor autoriza la emisión solo si no queda nada pendiente. */
@Injectable()
export class AutorizarEmisionUseCase extends OperacionRevision {
  async ejecutar(expedienteId: number, supervisor: UsuarioActual) {
    const expediente = await this.expedientes.obtener(expedienteId);
    expediente.exigirEtapa(Etapa.EMISION);
    const [verificaciones, observaciones] = await Promise.all([this.repositorio.verificacionesDe(expedienteId), this.repositorio.observacionesDe(expedienteId)]);
    const pendientes = pendientesDeEmision(expediente.categoria, verificaciones, observaciones);
    if (pendientes.length > 0) throw new ReglaNegocioError(`No se puede autorizar la emisión: ${pendientes.join('; ')}`);
    return this.expedientes.avanzarEtapa(expedienteId, Etapa.EMISION, supervisor.id);
  }
}

/** RF24: el gestor registra la licencia emitida para su carga en el SNC. */
@Injectable()
export class RegistrarLicenciaUseCase extends OperacionRevision {
  async ejecutar(expedienteId: number, numero: string, gestor: UsuarioActual) {
    const expediente = await this.expedientes.obtener(expedienteId);
    expediente.exigirEtapa(Etapa.EMITIDA);
    const limpio = normalizarNumeroLicencia(numero);
    if (await this.repositorio.licenciaDe(expedienteId)) throw new ConflictoError('La licencia de este expediente ya fue registrada');
    if (await this.repositorio.existeNumeroLicencia(limpio)) throw new ConflictoError(`El número de licencia ${limpio} ya está registrado`);
    const licencia = await this.repositorio.registrarLicencia({ expedienteId, numero: limpio, gestorId: gestor.id });
    this.auditar({ usuarioId: gestor.id, accion: 'REGISTRAR_LICENCIA_SNC', entidad: 'expediente', entidadId: expedienteId, valorAnterior: null, valorNuevo: { numero: limpio } });
    const evento: LicenciaRegistrada = { expedienteId, numeroExpediente: expediente.numero, postulanteId: expediente.postulanteId, numeroLicencia: limpio };
    this.eventos.emit(EVENTOS.LICENCIA_REGISTRADA, evento);
    return vistaLicencia(licencia);
  }
}

/** RF11 · HU20: vista completa para el supervisor y el gestor. */
@Injectable()
export class ConsultarRevisionUseCase extends OperacionRevision {
  async revision(expedienteId: number) {
    const expediente = await this.expedientes.obtener(expedienteId);
    const [verificaciones, observaciones, licencia] = await Promise.all([
      this.repositorio.verificacionesDe(expedienteId),
      this.repositorio.observacionesDe(expedienteId),
      this.repositorio.licenciaDe(expedienteId),
    ]);
    const pendientes = pendientesDeEmision(expediente.categoria, verificaciones, observaciones);
    return {
      expedienteId,
      etapa: expediente.etapa,
      verificacionesObligatorias: verificacionesObligatorias(expediente.categoria),
      verificaciones,
      observaciones: observaciones.map(vistaObservacion),
      licencia: licencia ? vistaLicencia(licencia) : null,
      pendientes,
      listoParaEmitir: expediente.etapa === Etapa.EMISION && pendientes.length === 0,
    };
  }

  /** EQ-02: el postulante solo ve la licencia de su propio expediente. */
  async licencia(expedienteId: number, usuario: UsuarioActual) {
    (await this.expedientes.obtener(expedienteId)).verificarAcceso(usuario);
    const licencia = await this.repositorio.licenciaDe(expedienteId);
    if (!licencia) throw new RecursoNoEncontradoError('La licencia aún no fue registrada');
    return vistaLicencia(licencia);
  }

  /** Bandeja del gestor: expedientes devueltos por el supervisor. */
  async observacionesAbiertas() {
    const abiertas = await this.repositorio.observacionesAbiertas();
    return Promise.all(abiertas.map(async (o) => ({ ...vistaObservacion(o), numeroExpediente: (await this.expedientes.obtener(o.expedienteId)).numero })));
  }
}
