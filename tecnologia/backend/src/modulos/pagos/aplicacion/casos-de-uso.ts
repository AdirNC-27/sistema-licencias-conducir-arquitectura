import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConflictoError } from '../../../compartido/dominio/errores';
import { UsuarioActual } from '../../../compartido/dominio/rol';
import { EVENTOS, OperacionAuditable } from '../../../compartido/eventos/eventos';
import { EXPEDIENTES_API, ExpedientesApi } from '../../expedientes/dominio/contratos';
import { Etapa } from '../../expedientes/dominio/etapa';
import { EstadoPago, Pago, REPOSITORIO_PAGOS, RepositorioPagos } from '../dominio/pago';

const vista = (p: Pago) => ({ id: p.id, expedienteId: p.expedienteId, numeroOperacion: p.numeroOperacion, monto: p.monto, fechaPago: p.fechaPago, estado: p.estado, observacion: p.observacion });

/** RF05: el postulante registra los datos del recibo del SAT. */
@Injectable()
export class RegistrarPagoUseCase {
  constructor(
    @Inject(REPOSITORIO_PAGOS) private readonly pagos: RepositorioPagos,
    @Inject(EXPEDIENTES_API) private readonly expedientes: ExpedientesApi,
  ) {}

  async ejecutar(expedienteId: number, numeroOperacion: string, monto: number, fechaPago: Date, usuario: UsuarioActual) {
    const expediente = await this.expedientes.obtener(expedienteId);
    expediente.verificarAcceso(usuario);
    expediente.exigirEtapa(Etapa.PAGO);
    Pago.validarRegistro(expediente.categoria, monto, fechaPago);
    if (await this.pagos.existeOperacion(numeroOperacion)) throw new ConflictoError('Ese número de operación ya fue registrado');
    const pendientes = (await this.pagos.listarDeExpediente(expedienteId)).filter((p) => p.estado === EstadoPago.PENDIENTE);
    if (pendientes.length > 0) throw new ConflictoError('Ya tiene un pago pendiente de verificación');
    return vista(await this.pagos.registrar({ expedienteId, numeroOperacion, monto, fechaPago }));
  }
}

/** RF06: el gestor verifica el pago en el SAT. Verificado, el expediente pasa a CITA. */
@Injectable()
export class VerificarPagoUseCase {
  constructor(
    @Inject(REPOSITORIO_PAGOS) private readonly pagos: RepositorioPagos,
    @Inject(EXPEDIENTES_API) private readonly expedientes: ExpedientesApi,
    private readonly eventos: EventEmitter2,
  ) {}

  async ejecutar(pagoId: number, estado: Exclude<EstadoPago, EstadoPago.PENDIENTE>, observacion: string | null, gestor: UsuarioActual) {
    const pago = await this.pagos.buscarPorId(pagoId);
    const anterior = pago.verificar(estado, observacion);
    await this.pagos.guardarEstado(pago);
    const operacion: OperacionAuditable = {
      usuarioId: gestor.id,
      accion: 'VERIFICAR_PAGO',
      entidad: 'pago',
      entidadId: pago.id,
      valorAnterior: { estado: anterior },
      valorNuevo: { estado, observacion },
    };
    this.eventos.emit(EVENTOS.OPERACION_AUDITABLE, operacion);
    if (estado === EstadoPago.VERIFICADO) await this.expedientes.avanzarEtapa(pago.expedienteId, Etapa.PAGO, gestor.id);
    return vista(pago);
  }
}

@Injectable()
export class ConsultarPagosUseCase {
  constructor(
    @Inject(REPOSITORIO_PAGOS) private readonly pagos: RepositorioPagos,
    @Inject(EXPEDIENTES_API) private readonly expedientes: ExpedientesApi,
  ) {}

  async ejecutar(expedienteId: number, usuario: UsuarioActual) {
    (await this.expedientes.obtener(expedienteId)).verificarAcceso(usuario);
    return (await this.pagos.listarDeExpediente(expedienteId)).map(vista);
  }
}
