import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Mensaje, ServicioNotificaciones } from '../dominio/servicio-notificaciones';

/** Adaptador SMTP con Nodemailer. Sin SMTP_HOST configurado, solo deja el aviso interno. */
@Injectable()
export class NotificadorCorreo implements ServicioNotificaciones {
  private readonly log = new Logger(NotificadorCorreo.name);
  private readonly transporte: nodemailer.Transporter | null;
  private readonly remitente: string;

  constructor(config: ConfigService) {
    const host = config.get<string>('SMTP_HOST');
    this.remitente = config.get<string>('SMTP_REMITENTE', 'Licencias MPH <no-responder@licencias.local>');
    this.transporte = host
      ? nodemailer.createTransport({
          host,
          port: Number(config.get('SMTP_PUERTO', 587)),
          secure: Number(config.get('SMTP_PUERTO', 587)) === 465,
          auth: { user: config.get<string>('SMTP_USUARIO'), pass: config.get<string>('SMTP_CLAVE') },
        })
      : null;
  }

  async enviar(m: Mensaje): Promise<boolean> {
    if (!this.transporte) {
      this.log.warn(`SMTP no configurado: no se envió "${m.asunto}" a ${m.correo}`);
      return false;
    }
    try {
      await this.transporte.sendMail({ from: this.remitente, to: m.correo, subject: m.asunto, text: m.texto });
      return true;
    } catch (error) {
      this.log.error(`No se pudo enviar el correo a ${m.correo}: ${(error as Error).message}`);
      return false;
    }
  }
}
