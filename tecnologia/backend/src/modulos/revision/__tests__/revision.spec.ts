import { Categoria } from '../../../compartido/dominio/categoria';
import { ConflictoError, RecursoNoEncontradoError, ReglaNegocioError } from '../../../compartido/dominio/errores';
import { Rol } from '../../../compartido/dominio/rol';
import { eventosFalsos, expediente, ExpedientesEnMemoria, usuario } from '../../../test-utils/fakes';
import { Etapa } from '../../expedientes/dominio/etapa';
import {
  AtenderObservacionUseCase,
  AutorizarEmisionUseCase,
  ConsultarRevisionUseCase,
  ObservarExpedienteUseCase,
  RegistrarLicenciaUseCase,
  RegistrarVerificacionUseCase,
} from '../aplicacion/casos-de-uso';
import { RepositorioRevision } from '../dominio/contratos';
import { EstadoObservacion, ObservacionExpediente } from '../dominio/observacion';
import { LicenciaEmitida, normalizarNumeroLicencia, pendientesDeEmision } from '../dominio/revision';
import { ResultadoVerificacion as R, TipoVerificacion as T, validarVerificacion, Verificacion, verificacionesObligatorias, vigentes } from '../dominio/verificacion';

class RepoRevision implements RepositorioRevision {
  verificaciones: Verificacion[] = [];
  observaciones: ObservacionExpediente[] = [];
  licencias: LicenciaEmitida[] = [];
  async registrarVerificacion(d: { expedienteId: number; tipo: T; resultado: R; detalle: string | null; gestorId: number }) {
    const v = { id: this.verificaciones.length + 1, ...d, registradoEn: new Date() };
    this.verificaciones.push(v);
    return v;
  }
  async verificacionesDe(e: number) {
    return this.verificaciones.filter((v) => v.expedienteId === e);
  }
  async crearObservacion(d: { expedienteId: number; motivo: string; supervisorId: number }) {
    const o = new ObservacionExpediente(this.observaciones.length + 1, d.expedienteId, d.motivo, d.supervisorId, new Date());
    this.observaciones.push(o);
    return o;
  }
  async buscarObservacion(id: number) {
    const o = this.observaciones.find((x) => x.id === id);
    if (!o) throw new RecursoNoEncontradoError('no');
    return o;
  }
  async observacionesDe(e: number) {
    return this.observaciones.filter((o) => o.expedienteId === e);
  }
  async observacionesAbiertas() {
    return this.observaciones.filter((o) => o.estado === EstadoObservacion.ABIERTA);
  }
  async guardarAtencion() {}
  async registrarLicencia(d: Omit<LicenciaEmitida, 'registradaEn'>) {
    const l = { ...d, registradaEn: new Date() };
    this.licencias.push(l);
    return l;
  }
  async licenciaDe(e: number) {
    return this.licencias.find((l) => l.expedienteId === e) ?? null;
  }
  async existeNumeroLicencia(n: string) {
    return this.licencias.some((l) => l.numero === n);
  }
}

const gestor = usuario(Rol.GESTOR, { id: 2 });
const supervisor = usuario(Rol.SUPERVISOR, { id: 4 });
const v = (id: number, tipo: T, resultado: R): Verificacion => ({ id, expedienteId: 1, tipo, resultado, detalle: null, gestorId: 2, registradoEn: new Date() });

describe('Verificaciones en portales oficiales · reglas (RF24, RF27)', () => {
  it('la II-B solo exige el certificado en el SNC; la II-C agrega COFIPRO y sanciones', () => {
    expect(verificacionesObligatorias(Categoria.II_B)).toEqual([T.SNC_CERTIFICADO_MEDICO]);
    expect(verificacionesObligatorias(Categoria.II_C)).toEqual([T.SNC_CERTIFICADO_MEDICO, T.SNC_COFIPRO, T.SANCIONES]);
  });

  it('rechaza una verificación que no corresponde a la categoría y exige detalle si no es conforme', () => {
    expect(() => validarVerificacion(Categoria.II_B, T.SNC_COFIPRO, R.CONFORME, null)).toThrow(ReglaNegocioError);
    expect(() => validarVerificacion(Categoria.II_C, T.SANCIONES, R.NO_CONFORME, '  ')).toThrow(ReglaNegocioError);
    expect(() => validarVerificacion(Categoria.II_C, T.SANCIONES, R.NO_CONFORME, 'Papeleta G-58 pendiente')).not.toThrow();
  });

  it('la constancia vigente de cada tipo es la última registrada', () => {
    const ultimas = vigentes([v(2, T.SANCIONES, R.CONFORME), v(1, T.SANCIONES, R.NO_CONFORME)]);
    expect(ultimas.get(T.SANCIONES)?.resultado).toBe(R.CONFORME);
  });

  it('lista lo pendiente: faltantes, no conformes y observaciones abiertas (RF27: sanciones pendientes bloquean)', () => {
    const abierta = new ObservacionExpediente(1, 1, 'Revise la COFIPRO del SNC', 4, new Date());
    const pendientes = pendientesDeEmision(Categoria.II_C, [v(1, T.SNC_CERTIFICADO_MEDICO, R.CONFORME), v(2, T.SANCIONES, R.NO_CONFORME)], [abierta]);
    expect(pendientes).toEqual([
      'Falta verificar: Constancia COFIPRO registrada en el SNC',
      'No conforme: Sin multas ni sanciones pendientes',
      'Hay una observación del supervisor sin atender',
    ]);
    expect(pendientesDeEmision(Categoria.II_B, [v(1, T.SNC_CERTIFICADO_MEDICO, R.CONFORME)], [])).toEqual([]);
  });

  it('normaliza el número de licencia y rechaza formatos inválidos', () => {
    expect(normalizarNumeroLicencia(' q45892014 ')).toBe('Q45892014');
    expect(() => normalizarNumeroLicencia('12')).toThrow(ReglaNegocioError);
    expect(() => normalizarNumeroLicencia('Q 4589 2014')).toThrow(ReglaNegocioError);
  });
});

describe('Observación del supervisor · reglas (RF11)', () => {
  it('exige un motivo y una respuesta claros, y solo se atiende una vez', () => {
    expect(() => ObservacionExpediente.validarMotivo('mal')).toThrow(ReglaNegocioError);
    const o = new ObservacionExpediente(1, 1, 'La COFIPRO no coincide con el DNI', 4, new Date());
    expect(() => o.atender('ok', 2)).toThrow(ReglaNegocioError);
    o.atender('Se registró la constancia correcta del SNC', 2, new Date('2026-11-24T10:00:00Z'));
    expect(o.estado).toBe(EstadoObservacion.ATENDIDA);
    expect(o.gestorId).toBe(2);
    expect(o.atendidaEn?.toISOString()).toBe('2026-11-24T10:00:00.000Z');
    expect(() => o.atender('Otra respuesta del gestor', 2)).toThrow(ConflictoError);
  });
});

describe('Casos de uso de Revisión', () => {
  const preparar = (etapa = Etapa.EMISION, categoria = Categoria.II_C) => {
    const repo = new RepoRevision();
    const exp = new ExpedientesEnMemoria(expediente(etapa, categoria));
    const eventos = eventosFalsos();
    return { repo, exp, eventos };
  };

  it('no autoriza la emisión sin verificaciones; con todo conforme, autoriza y audita', async () => {
    const { repo, exp, eventos } = preparar();
    const autorizar = new AutorizarEmisionUseCase(repo, exp, eventos);
    await expect(autorizar.ejecutar(1, supervisor)).rejects.toThrow(ReglaNegocioError);

    const verificar = new RegistrarVerificacionUseCase(repo, exp, eventos);
    for (const tipo of [T.SNC_CERTIFICADO_MEDICO, T.SNC_COFIPRO, T.SANCIONES]) await verificar.ejecutar(1, tipo, R.CONFORME, '  ', gestor);
    expect(repo.verificaciones[0].detalle).toBeNull();
    expect(eventos.emit).toHaveBeenCalledWith('auditoria.operacion', expect.objectContaining({ accion: 'VERIFICAR_PORTAL_OFICIAL' }));

    const consultar = new ConsultarRevisionUseCase(repo, exp, eventos);
    expect((await consultar.revision(1)).listoParaEmitir).toBe(true);
    await autorizar.ejecutar(1, supervisor);
    expect(exp.actual.etapa).toBe(Etapa.EMITIDA);
    await expect(verificar.ejecutar(1, T.SANCIONES, R.CONFORME, null, gestor)).rejects.toThrow(ConflictoError);
  });

  it('una sanción pendiente impide la emisión (RF27)', async () => {
    const { repo, exp, eventos } = preparar();
    const verificar = new RegistrarVerificacionUseCase(repo, exp, eventos);
    await verificar.ejecutar(1, T.SNC_CERTIFICADO_MEDICO, R.CONFORME, null, gestor);
    await verificar.ejecutar(1, T.SNC_COFIPRO, R.CONFORME, null, gestor);
    await verificar.ejecutar(1, T.SANCIONES, R.NO_CONFORME, 'Multa pendiente en el récord del conductor', gestor);
    await expect(new AutorizarEmisionUseCase(repo, exp, eventos).ejecutar(1, supervisor)).rejects.toThrow(/Sin multas ni sanciones/);
  });

  it('el supervisor observa, la emisión se bloquea y el gestor atiende (RF11)', async () => {
    const { repo, exp, eventos } = preparar(Etapa.EMISION, Categoria.II_B);
    await new RegistrarVerificacionUseCase(repo, exp, eventos).ejecutar(1, T.SNC_CERTIFICADO_MEDICO, R.CONFORME, null, gestor);
    const observar = new ObservarExpedienteUseCase(repo, exp, eventos);
    const o = await observar.ejecutar(1, '  El certificado del SNC es de otra clínica  ', supervisor);
    expect(o.motivo).toBe('El certificado del SNC es de otra clínica');
    await expect(observar.ejecutar(1, 'Segunda observación sobre lo mismo', supervisor)).rejects.toThrow(ConflictoError);

    const consultar = new ConsultarRevisionUseCase(repo, exp, eventos);
    expect(await consultar.observacionesAbiertas()).toEqual([expect.objectContaining({ id: o.id, numeroExpediente: 'EXP-2026-00001' })]);
    await expect(new AutorizarEmisionUseCase(repo, exp, eventos).ejecutar(1, supervisor)).rejects.toThrow(/observación/);

    const atendida = await new AtenderObservacionUseCase(repo, exp, eventos).ejecutar(o.id, 'Se volvió a consultar el SNC: certificado correcto', gestor);
    expect(atendida.estado).toBe(EstadoObservacion.ATENDIDA);
    expect(eventos.emit).toHaveBeenCalledWith('auditoria.operacion', expect.objectContaining({ accion: 'ATENDER_OBSERVACION' }));
    await new AutorizarEmisionUseCase(repo, exp, eventos).ejecutar(1, supervisor);
    expect(exp.actual.etapa).toBe(Etapa.EMITIDA);
  });

  it('solo se observa en la etapa EMISION', async () => {
    const { repo, exp, eventos } = preparar(Etapa.PAGO);
    await expect(new ObservarExpedienteUseCase(repo, exp, eventos).ejecutar(1, 'Falta revisar el pago del SAT', supervisor)).rejects.toThrow(ConflictoError);
  });

  it('registra la licencia una sola vez, con número único, y avisa al postulante (RF24)', async () => {
    const { repo, exp, eventos } = preparar(Etapa.EMITIDA);
    const registrar = new RegistrarLicenciaUseCase(repo, exp, eventos);
    const l = await registrar.ejecutar(1, 'q45892014', gestor);
    expect(l.numero).toBe('Q45892014');
    expect(eventos.emit).toHaveBeenCalledWith('licencia.registrada', expect.objectContaining({ numeroLicencia: 'Q45892014', postulanteId: 10 }));
    await expect(registrar.ejecutar(1, 'Q00000001', gestor)).rejects.toThrow(ConflictoError);

    const consultar = new ConsultarRevisionUseCase(repo, exp, eventos);
    expect((await consultar.licencia(1, usuario(Rol.POSTULANTE, { postulanteId: 10 }))).numero).toBe('Q45892014');
    await expect(consultar.licencia(1, usuario(Rol.POSTULANTE, { postulanteId: 99 }))).rejects.toThrow('No tiene acceso');
  });

  it('no registra la licencia antes de la emisión ni con un número repetido', async () => {
    const { repo, exp, eventos } = preparar(Etapa.EMISION);
    await expect(new RegistrarLicenciaUseCase(repo, exp, eventos).ejecutar(1, 'Q45892014', gestor)).rejects.toThrow(ConflictoError);
    const emitido = preparar(Etapa.EMITIDA);
    emitido.repo.licencias.push({ expedienteId: 7, numero: 'Q45892014', gestorId: 2, registradaEn: new Date() });
    await expect(new RegistrarLicenciaUseCase(emitido.repo, emitido.exp, emitido.eventos).ejecutar(1, 'Q45892014', gestor)).rejects.toThrow(/ya está registrado/);
    await expect(new ConsultarRevisionUseCase(repo, exp, eventos).licencia(1, gestor)).rejects.toThrow(RecursoNoEncontradoError);
  });
});
