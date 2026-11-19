import { ConflictoError, ReglaNegocioError } from '../../../compartido/dominio/errores';
import { Rol } from '../../../compartido/dominio/rol';
import { eventosFalsos, expediente, ExpedientesEnMemoria, usuario } from '../../../test-utils/fakes';
import { Etapa } from '../../expedientes/dominio/etapa';
import { ConfigurarCupoUseCase, ReservarCitaUseCase } from '../aplicacion/casos-de-uso';
import { Cita, RepositorioCitas } from '../dominio/contratos';
import { Cupo, TipoExamen, validarDiaDeExamen } from '../dominio/cupo';

const fecha = (iso: string) => new Date(`${iso}T00:00:00Z`);
const futuro = (diaSemana: number) => {
  const d = new Date();
  const f = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 7));
  while (f.getUTCDay() !== diaSemana) f.setUTCDate(f.getUTCDate() + 1);
  return f;
};

describe('Cupos · días y capacidad (RF21)', () => {
  it('conocimientos solo de lunes a miércoles; manejo de martes a viernes', () => {
    expect(() => validarDiaDeExamen(TipoExamen.CONOCIMIENTOS, fecha('2026-11-23'))).not.toThrow(); // lunes
    expect(() => validarDiaDeExamen(TipoExamen.CONOCIMIENTOS, fecha('2026-11-26'))).toThrow(ReglaNegocioError); // jueves
    expect(() => validarDiaDeExamen(TipoExamen.MANEJO, fecha('2026-11-23'))).toThrow(ReglaNegocioError); // lunes
    expect(() => validarDiaDeExamen(TipoExamen.MANEJO, fecha('2026-11-27'))).not.toThrow(); // viernes
  });

  it('no reserva sin cupos ni en fechas pasadas', () => {
    expect(() => new Cupo(1, futuro(1), '08:30', TipoExamen.CONOCIMIENTOS, 1, 1).reservar()).toThrow(ConflictoError);
    expect(() => new Cupo(1, fecha('2020-01-06'), '08:30', TipoExamen.CONOCIMIENTOS, 5, 0).reservar()).toThrow(ReglaNegocioError);
    const c = new Cupo(1, futuro(1), '08:30', TipoExamen.CONOCIMIENTOS, 2, 1);
    c.reservar();
    expect(c.disponibles).toBe(0);
    expect(() => new Cupo(1, futuro(1), '08:30', TipoExamen.CONOCIMIENTOS, 0, 0)).toThrow(ReglaNegocioError);
  });
});

class RepoCitas implements RepositorioCitas {
  cupos: Cupo[] = [];
  citas: Cita[] = [];
  tomadoPorOtro = false;
  async crearCupo(d: { fecha: Date; hora: string; tipo: TipoExamen; capacidad: number }) {
    const c = new Cupo(this.cupos.length + 1, d.fecha, d.hora, d.tipo, d.capacidad, 0);
    this.cupos.push(c);
    return c;
  }
  async buscarCupo(id: number) {
    return this.cupos.find((c) => c.id === id)!;
  }
  async listarCupos(tipo: TipoExamen) {
    return this.cupos.filter((c) => c.tipo === tipo);
  }
  async reservar(cupoId: number, expedienteId: number) {
    if (this.tomadoPorOtro) return null;
    const c = await this.buscarCupo(cupoId);
    const cita = { id: this.citas.length + 1, expedienteId, cupoId, tipo: c.tipo, fecha: c.fecha, hora: c.hora };
    this.citas.push(cita);
    return cita;
  }
  async citasDeExpediente(expedienteId: number) {
    return this.citas.filter((c) => c.expedienteId === expedienteId);
  }
}

describe('Casos de uso de Citas (RF07)', () => {
  const postulante = usuario(Rol.POSTULANTE, { postulanteId: 10 });

  it('configura cupos y lista disponibles', async () => {
    const repo = new RepoCitas();
    const caso = new ConfigurarCupoUseCase(repo);
    const cupo = await caso.ejecutar(futuro(1), '08:30', TipoExamen.CONOCIMIENTOS, 15);
    expect(cupo.disponibles).toBe(15);
    expect(await caso.listar(TipoExamen.CONOCIMIENTOS, new Date())).toHaveLength(1);
    await expect(caso.ejecutar(futuro(4), '08:30', TipoExamen.CONOCIMIENTOS, 15)).rejects.toThrow(ReglaNegocioError);
  });

  it('reserva conocimientos, avanza a EXAMEN_CONOCIMIENTOS y emite el recordatorio', async () => {
    const repo = new RepoCitas();
    await repo.crearCupo({ fecha: futuro(1), hora: '08:30', tipo: TipoExamen.CONOCIMIENTOS, capacidad: 5 });
    const expedientes = new ExpedientesEnMemoria(expediente(Etapa.CITA));
    const eventos = eventosFalsos();
    const r = await new ReservarCitaUseCase(repo, expedientes, eventos).ejecutar(1, 1, postulante);
    expect(r.tipo).toBe(TipoExamen.CONOCIMIENTOS);
    expect(expedientes.actual.etapa).toBe(Etapa.EXAMEN_CONOCIMIENTOS);
    expect(eventos.emit).toHaveBeenCalledWith('cita.reservada', expect.objectContaining({ postulanteId: 10 }));
  });

  it('no permite manejo antes de aprobar conocimientos, ni dos citas futuras, ni perder la carrera por el último cupo', async () => {
    const repo = new RepoCitas();
    await repo.crearCupo({ fecha: futuro(2), hora: '08:00', tipo: TipoExamen.MANEJO, capacidad: 5 });
    await repo.crearCupo({ fecha: futuro(1), hora: '08:30', tipo: TipoExamen.CONOCIMIENTOS, capacidad: 5 });
    const enCita = new ReservarCitaUseCase(repo, new ExpedientesEnMemoria(expediente(Etapa.CITA)), eventosFalsos());
    await expect(enCita.ejecutar(1, 1, postulante)).rejects.toThrow(ConflictoError);

    const enManejo = new ReservarCitaUseCase(repo, new ExpedientesEnMemoria(expediente(Etapa.EXAMEN_MANEJO)), eventosFalsos());
    await enManejo.ejecutar(1, 1, postulante);
    await expect(enManejo.ejecutar(1, 1, postulante)).rejects.toThrow(ConflictoError);

    const repo2 = new RepoCitas();
    await repo2.crearCupo({ fecha: futuro(1), hora: '08:30', tipo: TipoExamen.CONOCIMIENTOS, capacidad: 5 });
    repo2.tomadoPorOtro = true;
    await expect(new ReservarCitaUseCase(repo2, new ExpedientesEnMemoria(expediente(Etapa.CITA)), eventosFalsos()).ejecutar(1, 1, postulante)).rejects.toThrow(ConflictoError);
  });
});
