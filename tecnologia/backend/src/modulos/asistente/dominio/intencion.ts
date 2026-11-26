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

const VERBOS = 'aprob|aprueb|valid|cambi|modific|elimin|borr|anul|registr|reprogram|sub|pon|asign|emit|cancel|agend|reserv|aument|corrig|correg|marc|verific|acept|entreg|envi|mand|revis|autoriz|habilit|desactiv';
const IMPERATIVO = /^(por favor |oye |hola |ia |asistente )*(aprueba|apruebame|apruebalo|valida|validame|validalo|cambia|cambiame|cambialo|modifica|modificame|elimina|eliminame|borra|borrame|anula|anulame|registra|registrame|reprograma|reprogramame|sube|subeme|ponme|ponle|asigname|emite|emiteme|cancela|cancelame|agenda|agendame|reserva|reservame|aumenta|aumentame|corrige|corrigeme|marca|verifica|acepta|aceptame|revisa|revisame|revisalo|revisalos|aprueben|apruebe|validen|valide|cambien|cambie|modifiquen|modifique|eliminen|borren|anulen|registren|registre|reprogramen|reprograme|suban|asignen|emitan|emita|cancelen|agenden|reserven|aumenten|corrijan|corrija|marquen|verifiquen|verifique|acepten|revisen|revise|autoriza|autorizalo|autorice|autoricen|observa|observalo|responde|respondele|desactiva|habilita)\b/;
const ENTREGA = /\b(dame|entregame|enviame|mandame|emiteme) (mi|la|el) (licencia|brevete|certificado|nota|aprobacion)\b/;
// Tú, usted y ustedes («puedes», «podría», «pueden»); «se puede…» es una pregunta, no un pedido.
const PETICION = new RegExp(`(?<!\\bse )\\b(puedes|podrias|podras|puede|pueden|podria|podrian|podra|podran|quiero que|necesito que|te pido que|haz que|hazme)( me| lo| la| le| mi)? (${VERBOS})\\w*`);
const MI_TRAMITE = /\b(mi|mis) (tramite|expediente|solicitud|proceso)\b/;
const PREGUNTA_ESTADO = /\b(estado|etapa|va|esta|avance|falta|sigue|listo|lista|demora|cuando|paso|ahora)\b/;
const ESTADO_DIRECTO = /\b(en que|que) etapa (estoy|voy|me encuentro)\b|\bque me falta\b|\b(estado|avance) de mi\b/;

export function clasificar(pregunta: string): Intencion {
  const t = normalizar(pregunta);
  if (IMPERATIVO.test(t) || ENTREGA.test(t) || PETICION.test(t)) return Intencion.ACCION;
  if ((MI_TRAMITE.test(t) && PREGUNTA_ESTADO.test(t)) || ESTADO_DIRECTO.test(t)) return Intencion.ESTADO;
  return Intencion.CONSULTA;
}

const PENDIENTES = /\b(pendientes?|que (me )?falta|que tengo|tengo que|por hacer|hacer hoy|me olvid\w*|olvide|resumen|tareas?|prioridad\w*|urgentes?|por atender|por revisar)\b/;

/** El personal pregunta qué tiene por hacer: se responde con sus pendientes, no con la IA. */
export function pidePendientes(pregunta: string): boolean {
  return PENDIENTES.test(normalizar(pregunta));
}

/** Antes de enviar texto a un servicio externo se ocultan DNI, celulares y correos (DA06). */
export function anonimizar(texto: string): string {
  return texto
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[correo]')
    .replace(/\b\d{8,9}\b/g, '[número]');
}

/** Si la redacción de la IA afirma haber hecho algo, se descarta (EQ-08: 0 acciones). */
export function afirmaAccion(respuesta: string): boolean {
  return /\b(he|hemos|ya) (aprobado|registrado|validado|modificado|cambiado|reprogramado|reservado|eliminado|anulado|emitido|enviado|verificado|autorizado|respondido|habilitado|desactivado)\b/.test(normalizar(respuesta));
}
