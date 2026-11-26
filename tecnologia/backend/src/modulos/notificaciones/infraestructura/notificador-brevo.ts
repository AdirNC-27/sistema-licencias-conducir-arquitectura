import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Mensaje, ServicioNotificaciones } from '../dominio/servicio-notificaciones';

const URL_BREVO = 'https://api.brevo.com/v3/smtp/email';

/**
 * Adaptador de correo con la API HTTP de Brevo (300 correos diarios gratis), para el despliegue,
 * donde el SMTP de Gmail tiene límites. Implementa el mismo puerto que NotificadorCorreo (EQ-06).
 */
@Injectable()
export class NotificadorBrevo implements ServicioNotificaciones {
  private readonly log = new Logger(NotificadorBrevo.name);
  private readonly clave: string | undefined;
  private readonly remitente: { name: string; email: string };

  constructor(config: ConfigService) {
    this.clave = config.get<string>('BREVO_API_KEY');
    const texto = config.get<string>('SMTP_REMITENTE', 'Licencias MPH <no-responder@licencias.local>');
    const partes = /^(.*)<(.+)>$/.exec(texto.trim());
    this.remitente = partes ? { name: partes[1].trim(), email: partes[2].trim() } : { name: 'Licencias MPH', email: texto.trim() };
  }

  async enviar(m: Mensaje): Promise<boolean> {
    if (!this.clave) {
      this.log.warn(`BREVO_API_KEY no configurada: no se envió "${m.asunto}" a ${m.correo}`);
      return false;
    }
    try {
      const respuesta = await fetch(URL_BREVO, {
        method: 'POST',
        headers: { 'api-key': this.clave, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ sender: this.remitente, to: [{ email: m.correo }], subject: m.asunto, textContent: m.texto }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!respuesta.ok) {
        this.log.error(`Brevo rechazó el correo a ${m.correo}: HTTP ${respuesta.status}`);
        return false;
      }
      return true;
    } catch (error) {
      this.log.error(`No se pudo enviar el correo a ${m.correo}: ${(error as Error).message}`);
      return false;
    }
  }
}
