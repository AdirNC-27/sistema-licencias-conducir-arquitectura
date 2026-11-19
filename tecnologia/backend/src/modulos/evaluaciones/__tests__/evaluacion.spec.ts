import { ConflictoError } from '../../../compartido/dominio/errores';
import { CalificacionConocimientos, CalificacionManejo } from '../dominio/calificacion/calificacion.strategy';
import { IntentosAgotadosError, ResultadoBloqueadoError } from '../dominio/modelo/errores';
import { Evaluacion } from '../dominio/modelo/evaluacion';
import { EstadoResultado, Resultado, TipoEvaluacion } from '../dominio/modelo/tipos';

const nueva = (tipo = TipoEvaluacion.CONOCIMIENTOS) => new Evaluacion(1, 10, tipo);
const aprobado = new Resultado(16, true);
const desaprobado = new Resultado(9, false);

describe('Evaluacion · reglas del dominio (RF08, RF09, DA04)', () => {
  it('registra el primer intento y queda REGISTRADO', () => {
    const e = nueva();
    e.registrar(aprobado);
    expect(e.estado).toBe(EstadoResultado.REGISTRADO);
    expect(e.intentos).toBe(1);
  });

  it('permite corregir antes de validar sin consumir intento (RF09)', () => {
    const e = nueva();
    e.registrar(desaprobado);
    const anterior = e.corregir(aprobado);
    expect(anterior).toBe(desaprobado);
    expect(e.resultado).toBe(aprobado);
    expect(e.intentos).toBe(1);
  });

  it('al validar un aprobado lo bloquea: no se puede corregir ni volver a validar (EQ-09)', () => {
    const e = nueva();
    e.registrar(aprobado);
    e.validar();
    expect(e.estado).toBe(EstadoResultado.VALIDADO);
    expect(e.estaBloqueada()).toBe(true);
    expect(() => e.corregir(new Resultado(20, true))).toThrow(ResultadoBloqueadoError);
    expect(() => e.validar()).toThrow(ResultadoBloqueadoError);
    expect(() => e.registrar(aprobado)).toThrow(ResultadoBloqueadoError);
  });

  it('un desaprobado validado guarda el historial y habilita el siguiente intento', () => {
    const e = nueva();
    e.registrar(desaprobado);
    e.validar();
    expect(e.estado).toBe(EstadoResultado.PENDIENTE);
    expect(e.historial).toEqual([{ numero: 1, puntaje: 9, aprobado: false, observaciones: null }]);
    e.registrar(aprobado);
    expect(e.intentos).toBe(2);
  });

  it('rechaza el cuarto intento (RF08)', () => {
    const e = nueva();
    for (let i = 0; i < 3; i++) {
      e.registrar(desaprobado);
      e.validar();
    }
    expect(e.estado).toBe(EstadoResultado.AGOTADO);
    expect(() => e.registrar(aprobado)).toThrow(IntentosAgotadosError);
  });

  it('no permite registrar otro intento mientras hay uno sin validar', () => {
    const e = nueva();
    e.registrar(desaprobado);
    expect(() => e.registrar(aprobado)).toThrow(ConflictoError);
  });

  it('no valida si no hay resultado registrado', () => {
    expect(() => nueva().validar()).toThrow(ConflictoError);
  });

  it('no corrige si no hay resultado registrado', () => {
    expect(() => nueva().corregir(aprobado)).toThrow(ResultadoBloqueadoError);
  });
});

describe('Calificación · patrón Strategy', () => {
  it('conocimientos aprueba con la nota mínima', () => {
    const c = new CalificacionConocimientos(14);
    expect(c.calificar({ puntaje: 14 }).aprobado).toBe(true);
    expect(c.calificar({ puntaje: 13 }).aprobado).toBe(false);
  });

  it('manejo desaprueba con falta eliminatoria aunque tenga buena nota', () => {
    const m = new CalificacionManejo(14);
    expect(m.calificar({ puntaje: 18 }).aprobado).toBe(true);
    expect(m.calificar({ puntaje: 18, faltaEliminatoria: true }).aprobado).toBe(false);
  });

  it('la nota mínima es configurable (RF16)', () => {
    expect(new CalificacionConocimientos(16).calificar({ puntaje: 15 }).aprobado).toBe(false);
    expect(new CalificacionConocimientos().calificar({ puntaje: 14, observaciones: 'ok' }).observaciones).toBe('ok');
    expect(new CalificacionManejo().calificar({ puntaje: 13 }).aprobado).toBe(false);
  });
});
