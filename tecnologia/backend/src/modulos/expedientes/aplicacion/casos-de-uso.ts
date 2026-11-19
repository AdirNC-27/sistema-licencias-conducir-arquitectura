import { Inject, Injectable } from '@nestjs/common';
import { Categoria, TipoTramite } from '../../../compartido/dominio/categoria';
import { AccesoDenegadoError, ConflictoError, ReglaNegocioError } from '../../../compartido/dominio/errores';
import { Rol, UsuarioActual } from '../../../compartido/dominio/rol';
import { EXPEDIENTES_API, ExpedientesApi, FiltroExpedientes, REPOSITORIO_EXPEDIENTES, RepositorioExpedientes } from '../dominio/contratos';
import { Etapa } from '../dominio/etapa';
import { Expediente } from '../dominio/expediente';
import { calcularPlazo, EstadoPlazo } from '../dominio/plazo';

export interface ExpedienteVista {
  id: number;
  numero: string;
  postulanteId: number;
  tipoTramite: TipoTramite;
  categoria: Categoria;
  etapa: Etapa;
  creadoEn: Date;
  plazo: EstadoPlazo;
}

export function aVista(e: Expediente, hoy = new Date()): ExpedienteVista {
  return {
    id: e.id,
    numero: e.numero,
    postulanteId: e.postulanteId,
    tipoTramite: e.tipoTramite,
    categoria: e.categoria,
    etapa: e.etapa,
    creadoEn: e.creadoEn,
    plazo: calcularPlazo(e.creadoEn, hoy),
  };
}

/** RF02: el postulante registra su solicitud y obtiene un número de trámite. */
@Injectable()
export class CrearExpedienteUseCase {
  constructor(@Inject(REPOSITORIO_EXPEDIENTES) private readonly repositorio: RepositorioExpedientes) {}

  async ejecutar(usuario: UsuarioActual, tipoTramite: TipoTramite, categoria: Categoria): Promise<ExpedienteVista> {
    if (usuario.rol !== Rol.POSTULANTE || !usuario.postulanteId) {
      throw new AccesoDenegadoError('Solo un postulante registrado puede iniciar un trámite');
    }
    if (tipoTramite !== TipoTramite.EMISION) {
      throw new ReglaNegocioError('En esta versión solo se atiende la emisión (revalidación y duplicado: sprint 3)');
    }
    if (await this.repositorio.tieneTramiteActivo(usuario.postulanteId)) {
      throw new ConflictoError('Ya tiene un trámite en curso');
    }
    return aVista(await this.repositorio.crear({ postulanteId: usuario.postulanteId, tipoTramite, categoria }));
  }
}

/** RF10 y EQ-02: estado y plazo del expediente, solo para su dueño o el personal. */
@Injectable()
export class ConsultarExpedienteUseCase {
  constructor(@Inject(REPOSITORIO_EXPEDIENTES) private readonly repositorio: RepositorioExpedientes) {}

  async ejecutar(id: number, usuario: UsuarioActual): Promise<ExpedienteVista> {
    const expediente = await this.repositorio.buscarPorId(id);
    expediente.verificarAcceso(usuario);
    return aVista(expediente);
  }

  async mios(usuario: UsuarioActual): Promise<ExpedienteVista[]> {
    if (!usuario.postulanteId) return [];
    return (await this.repositorio.listarDePostulante(usuario.postulanteId)).map((e) => aVista(e));
  }

  async bandeja(filtro: FiltroExpedientes) {
    const { total, datos } = await this.repositorio.listar(filtro);
    return { total, pagina: filtro.pagina, tamano: filtro.tamano, datos: datos.map((e) => aVista(e)) };
  }
}

/** RF12: el supervisor autoriza la emisión cuando el expediente está conforme. */
@Injectable()
export class AutorizarEmisionUseCase {
  constructor(@Inject(EXPEDIENTES_API) private readonly expedientes: ExpedientesApi) {}

  async ejecutar(id: number, supervisor: UsuarioActual): Promise<ExpedienteVista> {
    return aVista(await this.expedientes.avanzarEtapa(id, Etapa.EMISION, supervisor.id));
  }
}
