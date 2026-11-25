import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CitaReservada, ConsultaRespondida, EtapaCambiada, EVENTOS, LicenciaRegistrada } from '../../../compartido/eventos/eventos';
import { REPOSITORIO_POSTULANTES, RepositorioPostulantes } from '../../postulantes/dominio/contratos';
import { NOMBRE_ETAPA, REPOSITORIO_AVISOS, RepositorioAvisos, SERVICIO_NOTIFICACIONES, ServicioNotificaciones } from '../dominio/servicio-notificaciones';

/** Patrón Observer (RF13): reacciona a los eventos sin que los otros módulos conozcan este. */
@Injectable()
export class NotificarListener {
  constructor(
    @Inject(SERVICIO_NOTIFICACIONES) private readonly servicio: ServicioNotificaciones,
    @Inject(REPOSITORIO_POSTULANTES) private readonly postulantes: RepositorioPostulantes,
    @Inject(REPOSITORIO_AVISOS) private readonly avisos: RepositorioAvisos,
  ) {}

  @OnEvent(EVENTOS.ETAPA_CAMBIADA, { async: true, promisify: true })
  async alCambiarEtapa(e: EtapaCambiada): Promise<void> {
    await this.avisar(e.postulanteId, `Tu trámite ${e.numero} avanzó`, `Tu expediente ${e.numero} pasó a la etapa: ${NOMBRE_ETAPA[e.etapaNueva] ?? e.etapaNueva}.`);
  }

  /** Recordatorio de la cita: ataca el problema principal, la postergación de exámenes. */
  @OnEvent(EVENTOS.CITA_RESERVADA, { async: true, promisify: true })
  async alReservarCita(e: CitaReservada): Promise<void> {
    await this.avisar(
      e.postulanteId,
      `Recordatorio: examen de ${e.tipo.toLowerCase()}`,
      `Tu examen de ${e.tipo.toLowerCase()} es el ${e.fecha}. Tienes 3 intentos sin pagar de nuevo; no lo postergues: el certificado médico vence a los 6 meses.`,
    );
  }

  /** RF24: el número de la licencia registrada para su carga en el SNC. */
  @OnEvent(EVENTOS.LICENCIA_REGISTRADA, { async: true, promisify: true })
  async alRegistrarLicencia(e: LicenciaRegistrada): Promise<void> {
    await this.avisar(e.postulanteId, `Tu licencia ${e.numeroLicencia} fue registrada`, `La licencia del trámite ${e.numeroExpediente} quedó registrada con el número ${e.numeroLicencia} para su carga en el SNC del MTC.`);
  }

  /** RF15: el gestor respondió una consulta que el asistente le derivó. */
  @OnEvent(EVENTOS.CONSULTA_RESPONDIDA, { async: true, promisify: true })
  async alResponderConsulta(e: ConsultaRespondida): Promise<void> {
    const pregunta = e.pregunta.length > 80 ? `${e.pregunta.slice(0, 77)}...` : e.pregunta;
    await this.avisar(e.postulanteId, 'El gestor respondió tu consulta', `El gestor de trámites respondió tu consulta «${pregunta}». Puedes leer la respuesta en el asistente.`);
  }

  private async avisar(postulanteId: number, asunto: string, texto: string): Promise<void> {
    const postulante = await this.postulantes.buscarPorId(postulanteId);
    const enviado = postulante ? await this.servicio.enviar({ correo: postulante.correo, asunto, texto }) : false;
    await this.avisos.guardar({ postulanteId, asunto, texto, enviadoPorCorreo: enviado });
  }
}
