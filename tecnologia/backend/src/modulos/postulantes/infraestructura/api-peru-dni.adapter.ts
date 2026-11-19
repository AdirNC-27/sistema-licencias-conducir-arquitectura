import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RecursoNoEncontradoError, ReglaNegocioError } from '../../../compartido/dominio/errores';
import { VerificadorIdentidad } from '../dominio/contratos';
import { DatosIdentidad } from '../dominio/postulante';

interface RespuestaApiPeru {
  success: boolean;
  message?: string;
  data?: { numero: string; nombres: string; apellido_paterno: string; apellido_materno: string };
}

/** Patrón Adapter: traduce la respuesta de API Perú al formato del dominio (ADR-012). */
@Injectable()
export class ApiPeruDniAdapter implements VerificadorIdentidad {
  private readonly log = new Logger(ApiPeruDniAdapter.name);

  constructor(private readonly config: ConfigService) {}

  async consultar(dni: string): Promise<DatosIdentidad> {
    const token = this.config.get<string>('APIPERU_TOKEN');
    if (!token) throw new ReglaNegocioError('Falta configurar APIPERU_TOKEN para validar el DNI');
    const url = `${this.config.get<string>('APIPERU_URL', 'https://apiperu.dev/api')}/dni/${dni}`;
    const respuesta = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    const cuerpo = (await respuesta.json()) as RespuestaApiPeru;
    if (!respuesta.ok || !cuerpo.success || !cuerpo.data) {
      this.log.warn(`API Perú no validó el DNI ${dni}: ${cuerpo.message ?? respuesta.status}`);
      throw new RecursoNoEncontradoError('No se encontró el DNI en el servicio de identidad');
    }
    return {
      dni: cuerpo.data.numero,
      nombres: cuerpo.data.nombres,
      apellidoPaterno: cuerpo.data.apellido_paterno,
      apellidoMaterno: cuerpo.data.apellido_materno,
    };
  }
}
