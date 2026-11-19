import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EVENTOS, EtapaCambiada, OperacionAuditable } from '../../../compartido/eventos/eventos';
import { ExpedientesApi, REPOSITORIO_EXPEDIENTES, RepositorioExpedientes } from '../dominio/contratos';
import { Etapa } from '../dominio/etapa';
import { Expediente } from '../dominio/expediente';

/** Implementa ExpedientesApi. Cada cambio de etapa se audita y se notifica (patrón Observer). */
@Injectable()
export class ExpedientesFacade implements ExpedientesApi {
  constructor(
    @Inject(REPOSITORIO_EXPEDIENTES) private readonly repositorio: RepositorioExpedientes,
    private readonly eventos: EventEmitter2,
  ) {}

  obtener(id: number): Promise<Expediente> {
    return this.repositorio.buscarPorId(id);
  }

  async avanzarEtapa(id: number, desde: Etapa, usuarioId: number): Promise<Expediente> {
    const expediente = await this.repositorio.buscarPorId(id);
    const anterior = expediente.avanzarDesde(desde);
    await this.repositorio.guardarEtapa(expediente);
    const auditoria: OperacionAuditable = {
      usuarioId,
      accion: expediente.etapa === Etapa.EMITIDA ? 'AUTORIZAR_EMISION' : 'CAMBIAR_ETAPA',
      entidad: 'expediente',
      entidadId: expediente.id,
      valorAnterior: { etapa: anterior },
      valorNuevo: { etapa: expediente.etapa },
    };
    const cambio: EtapaCambiada = {
      expedienteId: expediente.id,
      numero: expediente.numero,
      postulanteId: expediente.postulanteId,
      etapaAnterior: anterior,
      etapaNueva: expediente.etapa,
    };
    this.eventos.emit(EVENTOS.OPERACION_AUDITABLE, auditoria);
    this.eventos.emit(EVENTOS.ETAPA_CAMBIADA, cambio);
    return expediente;
  }
}
