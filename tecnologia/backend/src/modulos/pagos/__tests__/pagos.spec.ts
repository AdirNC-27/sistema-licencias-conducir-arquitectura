import { Categoria } from '../../../compartido/dominio/categoria';
import { ConflictoError, RecursoNoEncontradoError, ReglaNegocioError } from '../../../compartido/dominio/errores';
import { Rol } from '../../../compartido/dominio/rol';
import { eventosFalsos, expediente, ExpedientesEnMemoria, usuario } from '../../../test-utils/fakes';
import { Etapa } from '../../expedientes/dominio/etapa';
import { ConsultarPagosUseCase, RegistrarPagoUseCase, VerificarPagoUseCase } from '../aplicacion/casos-de-uso';
import { EstadoPago, Pago, RepositorioPagos } from '../dominio/pago';

class RepoPagos implements RepositorioPagos {
  datos: Pago[] = [];
  async registrar(d: { expedienteId: number; numeroOperacion: string; monto: number; fechaPago: Date }) {
    const p = new Pago(this.datos.length + 1, d.expedienteId, d.numeroOperacion, d.monto, d.fechaPago, EstadoPago.PENDIENTE, null);
    this.datos.push(p);
    return p;
  }
  async buscarPorId(id: number) {
    const p = this.datos.find((x) => x.id === id);
    if (!p) throw new RecursoNoEncontradoError('no');
    return p;
  }
  async listarDeExpediente(e: number) {
    return this.datos.filter((x) => x.expedienteId === e);
  }
  async existeOperacion(n: string) {
    return this.datos.some((x) => x.numeroOperacion === n);
  }
  async guardarEstado() {}
}

describe('Pago · reglas (RF05, RF06)', () => {
  it('exige la tasa exacta de la categoría', () => {
    expect(() => Pago.validarRegistro(Categoria.II_B, 69.9, new Date('2026-11-10'))).not.toThrow();
    expect(() => Pago.validarRegistro(Categoria.II_C, 69.9, new Date('2026-11-10'))).toThrow(ReglaNegocioError);
    expect(() => Pago.validarRegistro(Categoria.II_C, 69.4, new Date('2099-01-01'))).toThrow(ReglaNegocioError);
  });

  it('un pago verificado no cambia y observar exige motivo', () => {
    const p = new Pago(1, 1, '001', 69.4, new Date(), EstadoPago.PENDIENTE, null);
    expect(() => p.verificar(EstadoPago.OBSERVADO, null)).toThrow(ReglaNegocioError);
    p.verificar(EstadoPago.OBSERVADO, 'Monto ilegible');
    expect(p.observacion).toBe('Monto ilegible');
    p.verificar(EstadoPago.VERIFICADO, null);
    expect(() => p.verificar(EstadoPago.RECHAZADO, 'x')).toThrow(ConflictoError);
  });
});

describe('Casos de uso de Pagos', () => {
  const postulante = usuario(Rol.POSTULANTE, { postulanteId: 10 });
  const gestor = usuario(Rol.GESTOR, { id: 2 });

  it('registra, verifica y avanza el expediente a CITA', async () => {
    const repo = new RepoPagos();
    const exp = new ExpedientesEnMemoria(expediente(Etapa.PAGO, Categoria.II_C));
    const pago = await new RegistrarPagoUseCase(repo, exp).ejecutar(1, 'OP-1', 69.4, new Date('2026-11-18'), postulante);
    const eventos = eventosFalsos();
    const v = await new VerificarPagoUseCase(repo, exp, eventos).ejecutar(pago.id, EstadoPago.VERIFICADO, null, gestor);
    expect(v.estado).toBe(EstadoPago.VERIFICADO);
    expect(exp.actual.etapa).toBe(Etapa.CITA);
    expect(eventos.emit).toHaveBeenCalledWith('auditoria.operacion', expect.objectContaining({ accion: 'VERIFICAR_PAGO' }));
    expect(await new ConsultarPagosUseCase(repo, exp).ejecutar(1, postulante)).toHaveLength(1);
  });

  it('rechaza operación repetida y un segundo pago pendiente', async () => {
    const repo = new RepoPagos();
    const exp = new ExpedientesEnMemoria(expediente(Etapa.PAGO, Categoria.II_C));
    const caso = new RegistrarPagoUseCase(repo, exp);
    await caso.ejecutar(1, 'OP-1', 69.4, new Date('2026-11-18'), postulante);
    await expect(caso.ejecutar(1, 'OP-1', 69.4, new Date('2026-11-18'), postulante)).rejects.toThrow(ConflictoError);
    await expect(caso.ejecutar(1, 'OP-2', 69.4, new Date('2026-11-18'), postulante)).rejects.toThrow(ConflictoError);
  });

  it('observar no hace avanzar el expediente', async () => {
    const repo = new RepoPagos();
    const exp = new ExpedientesEnMemoria(expediente(Etapa.PAGO, Categoria.II_B));
    const p = await new RegistrarPagoUseCase(repo, exp).ejecutar(1, 'OP-9', 69.9, new Date('2026-11-18'), postulante);
    await new VerificarPagoUseCase(repo, exp, eventosFalsos()).ejecutar(p.id, EstadoPago.OBSERVADO, 'ilegible', gestor);
    expect(exp.actual.etapa).toBe(Etapa.PAGO);
  });
});
