import { normalizar } from './buscador';

/**
 * Qué pide la persona. El asistente solo orienta (RC06): si pide una acción, se deriva al gestor
 * sin pasar por la IA; si pregunta por su propio trámite, responde con los datos del expediente.
 */
export enum Intencion {
  ACCION = 'ACCION',
  ESTADO = 'ESTADO',
  CONSULTA = 'CONSULTA',
}

const VERBOS = 'aprob|aprueb|valid|cambi|modific|elimin|borr|anul|registr|reprogram|sub|pon|asign|emit|cancel|agend|reserv|aument|corrig|correg|marc|verific|acept|entreg|envi|mand';
const IMPERATIVO = /^(por favor |oye |hola |ia |asistente )*(aprueba|apruebame|apruebalo|valida|validame|validalo|cambia|cambiame|cambialo|modifica|modificame|elimina|eliminame|borra|borrame|anula|anulame|registra|registrame|reprograma|reprogramame|sube|subeme|ponme|ponle|asigname|emite|emiteme|cancela|cancelame|agenda|agendame|reserva|reservame|aumenta|aumentame|corrige|corrigeme|marca|verifica|acepta|aceptame)\b/;
const ENTREGA = /\b(dame|entregame|enviame|mandame|emiteme) (mi|la|el) (licencia|brevete|certificado|nota|aprobacion)\b/;
const PETICION = new RegExp(`\\b(puedes|podrias|podras|quiero que|necesito que|te pido que|haz que|hazme)( me| lo| la| le| mi)? (${VERBOS})\\w*`);
const MI_TRAMITE = /\b(mi|mis) (tramite|expediente|solicitud|proceso)\b/;
const PREGUNTA_ESTADO = /\b(estado|etapa|va|esta|avance|falta|sigue|listo|lista|demora|cuando|paso|ahora)\b/;
const ESTADO_DIRECTO = /\b(en que|que) etapa (estoy|voy|me encuentro)\b|\bque me falta\b|\b(estado|avance) de mi\b/;

export function clasificar(pregunta: string): Intencion {
  const t = normalizar(pregunta);
  if (IMPERATIVO.test(t) || ENTREGA.test(t) || PETICION.test(t)) return Intencion.ACCION;
  if ((MI_TRAMITE.test(t) && PREGUNTA_ESTADO.test(t)) || ESTADO_DIRECTO.test(t)) return Intencion.ESTADO;
  return Intencion.CONSULTA;
}

/** Antes de enviar texto a un servicio externo se ocultan DNI, celulares y correos (DA06). */
export function anonimizar(texto: string): string {
  return texto
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[correo]')
    .replace(/\b\d{8,9}\b/g, '[número]');
}

/** Si la redacción de la IA afirma haber hecho algo, se descarta (EQ-08: 0 acciones). */
export function afirmaAccion(respuesta: string): boolean {
  return /\b(he|hemos|ya) (aprobado|registrado|validado|modificado|cambiado|reprogramado|reservado|eliminado|anulado|emitido|enviado)\b/.test(normalizar(respuesta));
}
