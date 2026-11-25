import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AccesoDenegadoError, ReglaNegocioError } from '../../../compartido/dominio/errores';
import { UsuarioActual } from '../../../compartido/dominio/rol';
import { ConsultaRespondida, EVENTOS, OperacionAuditable } from '../../../compartido/eventos/eventos';
import { EXPEDIENTES_API, ExpedientesApi } from '../../expedientes/dominio/contratos';
import { buscarContenidos } from '../dominio/buscador';
import { ConsultaAsistente, LONGITUD_PREGUNTA, MENSAJE_ACCION, MENSAJE_SIN_RESPUESTA, OrigenRespuesta } from '../dominio/consulta';
import { ContenidoAprobado, DatosContenido, validarContenido } from '../dominio/contenido';
import { ASISTENTE_IA, AsistenteIA, REPOSITORIO_CONSULTAS, REPOSITORIO_CONTENIDOS, RepositorioConsultas, RepositorioContenidos } from '../dominio/contratos';
import { describirEstado } from '../dominio/estado-tramite';
import { afirmaAccion, anonimizar, clasificar, Intencion } from '../dominio/intencion';

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
  ) {}

  async preguntar(usuario: UsuarioActual, pregunta: string) {
    if (!usuario.postulanteId) throw new AccesoDenegadoError('El asistente atiende a los postulantes');
    const texto = pregunta.trim().replace(/\s+/g, ' ');
    if (texto.length < LONGITUD_PREGUNTA.minimo || texto.length > LONGITUD_PREGUNTA.maximo) {
      throw new ReglaNegocioError(`Escriba una pregunta de ${LONGITUD_PREGUNTA.minimo} a ${LONGITUD_PREGUNTA.maximo} caracteres`);
    }
    const decision = await this.decidir(texto, usuario.postulanteId);
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
      case Intencion.ESTADO:
        return { respuesta: describirEstado(await this.expedientes.ultimoDePostulante(postulanteId)), origen: OrigenRespuesta.ESTADO, fuentes: [] };
      case Intencion.CONSULTA: {
        const coincidencias = buscarContenidos(pregunta, await this.contenidos.activos());
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

/** RF15: el gestor atiende las consultas derivadas. */
@Injectable()
export class AtenderConsultasUseCase {
  constructor(
    @Inject(REPOSITORIO_CONSULTAS) private readonly consultas: RepositorioConsultas,
    private readonly eventos: EventEmitter2,
  ) {}

  async derivadas(soloPendientes: boolean) {
    return (await this.consultas.derivadas(soloPendientes)).map((c) => ({ ...vistaConsulta(c), postulanteId: c.postulanteId }));
  }

  async responder(consultaId: number, texto: string, gestor: UsuarioActual) {
    const consulta = await this.consultas.buscarPorId(consultaId);
    consulta.responder(texto, gestor.id);
    await this.consultas.guardarRespuestaGestor(consulta);
    const auditoria: OperacionAuditable = { usuarioId: gestor.id, accion: 'RESPONDER_CONSULTA', entidad: 'consulta_asistente', entidadId: consulta.id, valorAnterior: null, valorNuevo: { respuesta: consulta.respuestaGestor } };
    const evento: ConsultaRespondida = { consultaId: consulta.id, postulanteId: consulta.postulanteId, pregunta: consulta.pregunta };
    this.eventos.emit(EVENTOS.OPERACION_AUDITABLE, auditoria);
    this.eventos.emit(EVENTOS.CONSULTA_RESPONDIDA, evento);
    return { ...vistaConsulta(consulta), postulanteId: consulta.postulanteId };
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
