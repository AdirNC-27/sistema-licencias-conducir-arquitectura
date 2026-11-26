import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AccesoDenegadoError, ReglaNegocioError } from '../../../compartido/dominio/errores';
import { esPersonal, UsuarioActual } from '../../../compartido/dominio/rol';
import { ConsultaRespondida, EVENTOS, OperacionAuditable } from '../../../compartido/eventos/eventos';
import { EXPEDIENTES_API, ExpedientesApi } from '../../expedientes/dominio/contratos';
import { buscarContenidos } from '../dominio/buscador';
import { ConsultaAsistente, LONGITUD_PREGUNTA, MENSAJE_ACCION, MENSAJE_SIN_RESPUESTA, OrigenRespuesta } from '../dominio/consulta';
import { Audiencia, ContenidoAprobado, DatosContenido, validarContenido } from '../dominio/contenido';
import { ASISTENTE_IA, AsistenteIA, LECTURA_PENDIENTES, LecturaPendientes, REPOSITORIO_CONSULTAS, REPOSITORIO_CONTENIDOS, RepositorioConsultas, RepositorioContenidos } from '../dominio/contratos';
import { describirEstado } from '../dominio/estado-tramite';
import { analizarCharla, primerNombre, Publico, responderCharla, saludoBreve } from '../dominio/conversacion';
import { afirmaAccion, anonimizar, clasificar, Intencion, pidePendientes } from '../dominio/intencion';
import { describirPendientes, Pendiente, pendientesDelPersonal, recordatoriosDelPostulante } from '../dominio/pendientes';

export const vistaConsulta = (c: ConsultaAsistente) => ({
  id: c.id,
  pregunta: c.pregunta,
  respuesta: c.respuesta,
  origen: c.origen,
  derivada: c.derivada,
  fuentes: c.fuentes,
  creadoEn: c.creadoEn,
  respuestaGestor: c.respuestaGestor,
  respondidaEn: c.respondidaEn,
});

interface Decision {
  respuesta: string;
  origen: OrigenRespuesta;
  fuentes: number[];
}

/**
 * RF14 y RF15 · HU11: el postulante pregunta y el asistente decide, en este orden:
 * 1) si pide una acción, deriva; 2) si pregunta por su trámite, responde con su expediente;
 * 3) si hay contenido aprobado que lo responda, la IA lo redacta (o se entrega tal cual);
 * 4) si no, deriva al gestor. La IA nunca decide sola ni ve datos personales.
 */
@Injectable()
export class ConsultarAsistenteUseCase {
  private readonly log = new Logger(ConsultarAsistenteUseCase.name);

  constructor(
    @Inject(REPOSITORIO_CONTENIDOS) private readonly contenidos: RepositorioContenidos,
    @Inject(REPOSITORIO_CONSULTAS) private readonly consultas: RepositorioConsultas,
    @Inject(ASISTENTE_IA) private readonly ia: AsistenteIA,
    @Inject(EXPEDIENTES_API) private readonly expedientes: ExpedientesApi,
    @Inject(LECTURA_PENDIENTES) private readonly lectura: LecturaPendientes,
  ) {}

  async preguntar(usuario: UsuarioActual, pregunta: string) {
    if (!usuario.postulanteId) throw new AccesoDenegadoError('El asistente atiende a los postulantes');
    const texto = pregunta.trim().replace(/\s+/g, ' ');
    if (texto.length < LONGITUD_PREGUNTA.minimo || texto.length > LONGITUD_PREGUNTA.maximo) {
      throw new ReglaNegocioError(`Escriba una pregunta de ${LONGITUD_PREGUNTA.minimo} a ${LONGITUD_PREGUNTA.maximo} caracteres`);
    }
    const postulanteId = usuario.postulanteId;
    const decision = await conLucia(texto, usuario, 'POSTULANTE', (resto) => this.decidir(resto, postulanteId));
    const consulta = await this.consultas.registrar({ postulanteId: usuario.postulanteId, pregunta: texto, ...decision });
    return vistaConsulta(consulta);
  }

  async historial(usuario: UsuarioActual) {
    if (!usuario.postulanteId) return [];
    return (await this.consultas.dePostulante(usuario.postulanteId, 50)).map(vistaConsulta);
  }

  private async decidir(pregunta: string, postulanteId: number): Promise<Decision> {
    const derivar: Decision = { respuesta: MENSAJE_SIN_RESPUESTA, origen: OrigenRespuesta.DERIVADA, fuentes: [] };
    switch (clasificar(pregunta)) {
      case Intencion.ACCION:
        return { ...derivar, respuesta: MENSAJE_ACCION };
      case Intencion.ESTADO: {
        const hoy = new Date();
        const estado = describirEstado(await this.expedientes.ultimoDePostulante(postulanteId), hoy);
        const urgentes = recordatoriosDelPostulante(await this.lectura.datosPostulante(postulanteId, hoy), hoy).filter((r) => r.urgente);
        const recordatorio = urgentes.length ? ` Importante: ${urgentes.slice(0, 2).map((r) => r.texto).join(' ')}` : '';
        return { respuesta: `${estado}${recordatorio}`.slice(0, 1500), origen: OrigenRespuesta.ESTADO, fuentes: [] };
      }
      case Intencion.CONSULTA: {
        const coincidencias = buscarContenidos(pregunta, (await this.contenidos.activos()).filter((c) => c.audiencia === Audiencia.POSTULANTE));
        if (coincidencias.length === 0) return derivar;
        const elegidos = coincidencias.map((c) => c.contenido);
        const fuentes = elegidos.map((c) => c.id);
        const directa: Decision = { respuesta: elegidos[0].respuesta, origen: OrigenRespuesta.CONTENIDO, fuentes: [fuentes[0]] };
        if (!this.ia.disponible) return directa;
        const redaccion = await this.ia.redactar(anonimizar(pregunta), elegidos);
        if (!redaccion) return directa; // la IA no respondió: se entrega el contenido aprobado
        if (!redaccion.confiable) return derivar;
        if (afirmaAccion(redaccion.respuesta)) {
          this.log.warn('La IA afirmó haber realizado una acción; se entrega el contenido aprobado');
          return directa;
        }
        return { respuesta: redaccion.respuesta, origen: OrigenRespuesta.IA, fuentes };
      }
    }
  }
}

/**
 * Lucía atiende primero la charla (saludos, gracias, mensajes ofensivos o sin sentido) con frases
 * fijas; si el mensaje trae una pregunta del trámite, sigue el flujo normal y antepone el saludo.
 */
async function conLucia(texto: string, usuario: UsuarioActual, publico: Publico, flujo: (resto: string) => Promise<Decision>): Promise<Decision> {
  const charla = analizarCharla(texto);
  const nombre = primerNombre(usuario.nombre);
  if (charla.tipo) return { respuesta: responderCharla(charla.tipo, publico, nombre), origen: OrigenRespuesta.CONVERSACION, fuentes: [] };
  const decision = await flujo(charla.resto);
  return charla.saludo ? { ...decision, respuesta: `${saludoBreve(nombre)}${decision.respuesta}`.slice(0, 1500) } : decision;
}

/** Lo que cada usuario tiene por hacer: pendientes del personal o recordatorios del postulante. */
@Injectable()
export class ConsultarPendientesUseCase {
  constructor(@Inject(LECTURA_PENDIENTES) private readonly lectura: LecturaPendientes) {}

  async ejecutar(usuario: UsuarioActual, hoy = new Date()): Promise<Pendiente[]> {
    if (esPersonal(usuario)) return pendientesDelPersonal(usuario.rol, await this.lectura.indicadoresPersonal(hoy), hoy);
    if (!usuario.postulanteId) return [];
    return recordatoriosDelPostulante(await this.lectura.datosPostulante(usuario.postulanteId, hoy), hoy);
  }
}

export const MENSAJE_SIN_CONTENIDO_PERSONAL =
  'No tengo un procedimiento aprobado para esa pregunta. El administrador puede agregarlo en «Contenido del asistente».';
export const MENSAJE_ACCION_PERSONAL = 'No ejecuto acciones: hazlo desde la pantalla correspondiente del portal, donde queda registrado en la auditoría.';

/**
 * La IA de orientación para el personal: responde «¿qué tengo pendiente?» con los datos del sistema
 * y las dudas de procedimiento con el contenido aprobado para el personal. Igual que con el
 * postulante, nunca ejecuta nada. No se guarda la conversación: no hay datos de ciudadanos en ella.
 */
@Injectable()
export class ConsultarAsistentePersonalUseCase {
  private readonly log = new Logger(ConsultarAsistentePersonalUseCase.name);

  constructor(
    @Inject(REPOSITORIO_CONTENIDOS) private readonly contenidos: RepositorioContenidos,
    @Inject(ASISTENTE_IA) private readonly ia: AsistenteIA,
    private readonly pendientes: ConsultarPendientesUseCase,
  ) {}

  async preguntar(usuario: UsuarioActual, pregunta: string) {
    if (!esPersonal(usuario)) throw new AccesoDenegadoError('Esta conversación es para el personal municipal');
    const texto = pregunta.trim().replace(/\s+/g, ' ');
    if (texto.length < LONGITUD_PREGUNTA.minimo || texto.length > LONGITUD_PREGUNTA.maximo) {
      throw new ReglaNegocioError(`Escriba una pregunta de ${LONGITUD_PREGUNTA.minimo} a ${LONGITUD_PREGUNTA.maximo} caracteres`);
    }
    return { pregunta: texto, ...(await conLucia(texto, usuario, 'PERSONAL', (resto) => this.decidir(resto, usuario))), creadoEn: new Date() };
  }

  private async decidir(pregunta: string, usuario: UsuarioActual): Promise<Decision> {
    const accion = clasificar(pregunta) === Intencion.ACCION;
    if (!accion && pidePendientes(pregunta)) {
      return { respuesta: describirPendientes(await this.pendientes.ejecutar(usuario), true), origen: OrigenRespuesta.ESTADO, fuentes: [] };
    }
    const activos = await this.contenidos.activos();
    // Primero los procedimientos internos; si no, las reglas públicas del trámite.
    const coincidencias = buscarContenidos(pregunta, activos.filter((c) => c.audiencia === Audiencia.PERSONAL));
    const elegidos = (coincidencias.length ? coincidencias : buscarContenidos(pregunta, activos.filter((c) => c.audiencia === Audiencia.POSTULANTE))).map((c) => c.contenido);
    if (elegidos.length === 0) {
      return { respuesta: accion ? MENSAJE_ACCION_PERSONAL : MENSAJE_SIN_CONTENIDO_PERSONAL, origen: OrigenRespuesta.DERIVADA, fuentes: [] };
    }
    const prefijo = accion ? `${MENSAJE_ACCION_PERSONAL} ` : '';
    const directa: Decision = { respuesta: `${prefijo}${elegidos[0].respuesta}`, origen: OrigenRespuesta.CONTENIDO, fuentes: [elegidos[0].id] };
    if (!this.ia.disponible) return directa;
    const redaccion = await this.ia.redactar(anonimizar(pregunta), elegidos, Audiencia.PERSONAL);
    if (!redaccion) return directa;
    if (!redaccion.confiable) return { respuesta: MENSAJE_SIN_CONTENIDO_PERSONAL, origen: OrigenRespuesta.DERIVADA, fuentes: [] };
    if (afirmaAccion(redaccion.respuesta)) {
      this.log.warn('La IA afirmó haber realizado una acción; se entrega el contenido aprobado');
      return directa;
    }
    return { respuesta: `${prefijo}${redaccion.respuesta}`, origen: OrigenRespuesta.IA, fuentes: elegidos.map((c) => c.id) };
  }
}

/** RF15: el gestor atiende las consultas derivadas. */
@Injectable()
export class AtenderConsultasUseCase {
  constructor(
    @Inject(REPOSITORIO_CONSULTAS) private readonly consultas: RepositorioConsultas,
    private readonly eventos: EventEmitter2,
    @Inject(LECTURA_PENDIENTES) private readonly lectura: LecturaPendientes,
  ) {}

  async derivadas(soloPendientes: boolean) {
    return this.conPostulante(await this.consultas.derivadas(soloPendientes));
  }

  /** Agrega nombre y DNI para que el gestor sepa a quién responde. */
  private async conPostulante(consultas: ConsultaAsistente[]) {
    const quienes = await this.lectura.identificarPostulantes(consultas.map((c) => c.postulanteId));
    return consultas.map((c) => ({ ...vistaConsulta(c), postulanteId: c.postulanteId, postulanteNombre: quienes.get(c.postulanteId)?.nombre ?? null, postulanteDni: quienes.get(c.postulanteId)?.dni ?? null }));
  }

  async responder(consultaId: number, texto: string, gestor: UsuarioActual) {
    const consulta = await this.consultas.buscarPorId(consultaId);
    consulta.responder(texto, gestor.id);
    await this.consultas.guardarRespuestaGestor(consulta);
    const auditoria: OperacionAuditable = { usuarioId: gestor.id, accion: 'RESPONDER_CONSULTA', entidad: 'consulta_asistente', entidadId: consulta.id, valorAnterior: null, valorNuevo: { respuesta: consulta.respuestaGestor } };
    const evento: ConsultaRespondida = { consultaId: consulta.id, postulanteId: consulta.postulanteId, pregunta: consulta.pregunta };
    this.eventos.emit(EVENTOS.OPERACION_AUDITABLE, auditoria);
    this.eventos.emit(EVENTOS.CONSULTA_RESPONDIDA, evento);
    return (await this.conPostulante([consulta]))[0];
  }
}

/** HU25: el administrador mantiene el contenido aprobado que usa el asistente. */
@Injectable()
export class GestionarContenidosUseCase {
  constructor(
    @Inject(REPOSITORIO_CONTENIDOS) private readonly contenidos: RepositorioContenidos,
    private readonly eventos: EventEmitter2,
  ) {}

  listar(): Promise<ContenidoAprobado[]> {
    return this.contenidos.todos();
  }

  async crear(datos: DatosContenido, administrador: UsuarioActual): Promise<ContenidoAprobado> {
    const creado = await this.contenidos.crear(validarContenido(datos));
    this.auditar(administrador, creado.id, null, creado);
    return creado;
  }

  async actualizar(id: number, datos: DatosContenido, administrador: UsuarioActual): Promise<ContenidoAprobado> {
    const anterior = await this.contenidos.buscarPorId(id);
    const actualizado = await this.contenidos.actualizar({ id, ...validarContenido(datos) });
    this.auditar(administrador, id, anterior, actualizado);
    return actualizado;
  }

  private auditar(usuario: UsuarioActual, id: number, anterior: ContenidoAprobado | null, nuevo: ContenidoAprobado): void {
    const operacion: OperacionAuditable = { usuarioId: usuario.id, accion: 'GESTIONAR_CONTENIDO', entidad: 'contenido_asistente', entidadId: id, valorAnterior: anterior, valorNuevo: nuevo };
    this.eventos.emit(EVENTOS.OPERACION_AUDITABLE, operacion);
  }
}
