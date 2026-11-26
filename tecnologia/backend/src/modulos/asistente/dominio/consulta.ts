import { ConflictoError, ReglaNegocioError } from '../../../compartido/dominio/errores';

/** De dónde salió la respuesta: siempre se puede explicar por qué el asistente dijo lo que dijo. */
export enum OrigenRespuesta {
  /** Redactada por la IA de orientación a partir del contenido aprobado. */
  IA = 'IA',
  /** Texto del contenido aprobado, sin reescribir (IA no configurada o no disponible). */
  CONTENIDO = 'CONTENIDO',
  /** Datos del expediente del propio postulante. */
  ESTADO = 'ESTADO',
  /** Saludo, agradecimiento o mensaje fuera de lugar: Lucía responde sin consultar contenido ni derivar. */
  CONVERSACION = 'CONVERSACION',
  /** Sin respuesta confiable o pedido de acción: la contesta el gestor (RF15). */
  DERIVADA = 'DERIVADA',
}

export class ConsultaAsistente {
  constructor(
    readonly id: number,
    readonly postulanteId: number,
    readonly pregunta: string,
    readonly respuesta: string,
    readonly origen: OrigenRespuesta,
    readonly fuentes: number[],
    readonly creadoEn: Date,
    private respuestaGestorActual: string | null = null,
    private gestorActual: number | null = null,
    private respondidaEnActual: Date | null = null,
  ) {}

  get derivada(): boolean {
    return this.origen === OrigenRespuesta.DERIVADA;
  }
  get respuestaGestor(): string | null {
    return this.respuestaGestorActual;
  }
  get gestorId(): number | null {
    return this.gestorActual;
  }
  get respondidaEn(): Date | null {
    return this.respondidaEnActual;
  }

  /** RF15: el gestor responde la consulta derivada; el postulante la ve en su historial. */
  responder(texto: string, gestorId: number, ahora = new Date()): void {
    if (!this.derivada) throw new ReglaNegocioError('Solo se responden las consultas derivadas al gestor');
    if (this.respuestaGestorActual) throw new ConflictoError('La consulta ya fue respondida');
    if (texto.trim().length < 5) throw new ReglaNegocioError('Escriba una respuesta (al menos 5 caracteres)');
    this.respuestaGestorActual = texto.trim();
    this.gestorActual = gestorId;
    this.respondidaEnActual = ahora;
  }
}

export const LONGITUD_PREGUNTA = { minimo: 2, maximo: 300 };

export const MENSAJE_ACCION =
  'Solo puedo orientarte: no apruebo, registro ni modifico nada en tu trámite. Derivé tu consulta al gestor de trámites, que te responderá en este chat.';

export const MENSAJE_SIN_RESPUESTA =
  'No tengo información aprobada para responder eso con seguridad. Derivé tu consulta al gestor de trámites, que te responderá en este chat.';
