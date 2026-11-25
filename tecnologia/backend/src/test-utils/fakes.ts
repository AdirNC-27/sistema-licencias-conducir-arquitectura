import { Categoria, TipoTramite } from '../compartido/dominio/categoria';
import { RecursoNoEncontradoError } from '../compartido/dominio/errores';
import { Rol, UsuarioActual } from '../compartido/dominio/rol';
import { OperacionAuditable } from '../compartido/eventos/eventos';
import { RegistroAuditoria } from '../modulos/auditoria/dominio/registro-auditoria';
import { ExpedientesApi } from '../modulos/expedientes/dominio/contratos';
import { Etapa } from '../modulos/expedientes/dominio/etapa';
import { Expediente } from '../modulos/expedientes/dominio/expediente';

export const usuario = (rol: Rol, extra: Partial<UsuarioActual> = {}): UsuarioActual => ({ id: 1, usuario: rol.toLowerCase(), rol, postulanteId: null, ...extra });

export const expediente = (etapa: Etapa, categoria = Categoria.II_C, postulanteId = 10) =>
  new Expediente(1, 'EXP-2026-00001', postulanteId, TipoTramite.EMISION, categoria, etapa, new Date('2026-11-16T12:00:00Z'));

/** Fachada de expedientes en memoria para probar casos de uso sin base de datos. */
export class ExpedientesEnMemoria implements ExpedientesApi {
  avances: { id: number; desde: Etapa }[] = [];
  constructor(public actual: Expediente) {}
  async obtener(id: number): Promise<Expediente> {
    if (id !== this.actual.id) throw new RecursoNoEncontradoError('no existe');
    return this.actual;
  }
  async ultimoDePostulante(postulanteId: number): Promise<Expediente | null> {
    return this.actual.postulanteId === postulanteId ? this.actual : null;
  }
  async avanzarEtapa(id: number, desde: Etapa): Promise<Expediente> {
    this.actual.avanzarDesde(desde);
    this.avances.push({ id, desde });
    return this.actual;
  }
}

export class AuditoriaEnMemoria implements RegistroAuditoria {
  registros: OperacionAuditable[] = [];
  async registrar(o: OperacionAuditable): Promise<void> {
    this.registros.push(o);
  }
}

export const eventosFalsos = () => ({ emit: jest.fn() }) as unknown as import('@nestjs/event-emitter').EventEmitter2;
