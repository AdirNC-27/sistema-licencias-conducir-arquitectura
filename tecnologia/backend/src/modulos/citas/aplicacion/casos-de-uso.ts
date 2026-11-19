import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConflictoError } from '../../../compartido/dominio/errores';
import { UsuarioActual } from '../../../compartido/dominio/rol';
import { CitaReservada, EVENTOS } from '../../../compartido/eventos/eventos';
import { EXPEDIENTES_API, ExpedientesApi } from '../../expedientes/dominio/contratos';
import { Etapa } from '../../expedientes/dominio/etapa';
import { REPOSITORIO_CITAS, RepositorioCitas } from '../dominio/contratos';
import { Cupo, TipoExamen, validarDiaDeExamen } from '../dominio/cupo';

const vistaCupo = (c: Cupo) => ({ id: c.id, fecha: c.fecha.toISOString().slice(0, 10), hora: c.hora, tipo: c.tipo, capacidad: c.capacidad, disponibles: c.disponibles });

/** RF21: el administrador habilita días y cupos según el tipo de examen. */
@Injectable()
export class ConfigurarCupoUseCase {
  constructor(@Inject(REPOSITORIO_CITAS) private readonly citas: RepositorioCitas) {}

  async ejecutar(fecha: Date, hora: string, tipo: TipoExamen, capacidad: number) {
    validarDiaDeExamen(tipo, fecha);
    return vistaCupo(await this.citas.crearCupo({ fecha, hora, tipo, capacidad }));
  }

  async listar(tipo: TipoExamen, desde: Date) {
    return (await this.citas.listarCupos(tipo, desde)).map(vistaCupo);
  }
}

/** RF07: el postulante elige su cita. Conocimientos en etapa CITA; manejo en EXAMEN_MANEJO. */
@Injectable()
export class ReservarCitaUseCase {
  constructor(
    @Inject(REPOSITORIO_CITAS) private readonly citas: RepositorioCitas,
    @Inject(EXPEDIENTES_API) private readonly expedientes: ExpedientesApi,
    private readonly eventos: EventEmitter2,
  ) {}

  async ejecutar(expedienteId: number, cupoId: number, usuario: UsuarioActual) {
    const expediente = await this.expedientes.obtener(expedienteId);
    expediente.verificarAcceso(usuario);
    const cupo = await this.citas.buscarCupo(cupoId);
    // Conocimientos: primera cita (CITA) o reintento (EXAMEN_CONOCIMIENTOS). Manejo: solo tras aprobar conocimientos.
    if (cupo.tipo === TipoExamen.CONOCIMIENTOS) expediente.exigirEtapa(Etapa.CITA, Etapa.EXAMEN_CONOCIMIENTOS);
    else expediente.exigirEtapa(Etapa.EXAMEN_MANEJO);
    const previas = await this.citas.citasDeExpediente(expedienteId);
    const hoy = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z');
    if (previas.some((c) => c.tipo === cupo.tipo && c.fecha.getTime() >= hoy.getTime())) {
      throw new ConflictoError(`Ya tiene una cita de ${cupo.tipo.toLowerCase()} programada`);
    }
    cupo.reservar(); // valida fecha y disponibilidad en el dominio
    const cita = await this.citas.reservar(cupoId, expedienteId);
    if (!cita) throw new ConflictoError('No hay cupos disponibles para ese horario');
    if (expediente.etapa === Etapa.CITA) await this.expedientes.avanzarEtapa(expedienteId, Etapa.CITA, usuario.id);
    const evento: CitaReservada = { expedienteId, postulanteId: expediente.postulanteId, tipo: cita.tipo, fecha: `${cita.fecha.toISOString().slice(0, 10)} ${cita.hora}` };
    this.eventos.emit(EVENTOS.CITA_RESERVADA, evento);
    return { id: cita.id, expedienteId, tipo: cita.tipo, fecha: cita.fecha.toISOString().slice(0, 10), hora: cita.hora };
  }
}

/** Citas programadas del expediente (dueño o personal). */
@Injectable()
export class ConsultarCitasUseCase {
  constructor(
    @Inject(REPOSITORIO_CITAS) private readonly citas: RepositorioCitas,
    @Inject(EXPEDIENTES_API) private readonly expedientes: ExpedientesApi,
  ) {}

  async ejecutar(expedienteId: number, usuario: UsuarioActual) {
    (await this.expedientes.obtener(expedienteId)).verificarAcceso(usuario);
    return (await this.citas.citasDeExpediente(expedienteId)).map((c) => ({ id: c.id, tipo: c.tipo, fecha: c.fecha.toISOString().slice(0, 10), hora: c.hora }));
  }
}
