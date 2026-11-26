import { normalizar } from './buscador';

/**
 * Lucía, la asistente virtual: responde saludos, agradecimientos, despedidas y preguntas sobre
 * ella misma con frases fijas (sin IA), y pone un límite amable a los mensajes ofensivos o sin
 * sentido. Todo lo demás sigue el camino del trámite (contenido aprobado, estado o derivación).
 */
export const NOMBRE_ASISTENTE = 'Lucía';

export enum TipoCharla {
  SALUDO = 'SALUDO',
  ANIMO = 'ANIMO',
  GRACIAS = 'GRACIAS',
  DESPEDIDA = 'DESPEDIDA',
  IDENTIDAD = 'IDENTIDAD',
  AYUDA = 'AYUDA',
  RISA = 'RISA',
  ACUERDO = 'ACUERDO',
  OFENSA = 'OFENSA',
  INCOHERENTE = 'INCOHERENTE',
}

/** Frases de charla, de la más específica a la más general. Se comparan sobre el texto normalizado. */
const FRASES: [TipoCharla, RegExp][] = [
  [TipoCharla.IDENTIDAD, /\b(quien eres|quien es usted|como te llamas|como se llama|cual es tu nombre|eres (un |una )?(robot|bot|humana?|persona|ia|maquina)|eres real|con quien (hablo|estoy hablando))\b/g],
  [TipoCharla.AYUDA, /\b(que puedes hacer|que sabes hacer|en que (me )?(puedes ayudar|ayudas)|como (me )?(puedes ayudar|funcionas)|que haces|ayuda|ayudame|menu|opciones|necesito ayuda)\b/g],
  [TipoCharla.ANIMO, /\b(como (estas|esta|te va|le va|andas)|que tal (estas|tu dia|todo)?|todo bien|(muy )?bien y (tu|usted))\b/g],
  [TipoCharla.GRACIAS, /\b(muchas gracias|mil gracias|gracias|grax|thanks|te agradezco|muy amable|ok gracias|listo gracias)\b/g],
  [TipoCharla.DESPEDIDA, /\b(adios|chau|chao|bye|hasta (luego|pronto|manana|la vista)|nos vemos|me voy|eso es todo)\b/g],
  [TipoCharla.SALUDO, /\b(hola+|holi|ola|buenas( tardes| noches)?|buenos dias|buen dia|hey|saludos|alo|que tal)\b/g],
  [TipoCharla.RISA, /\b(ja(ja)+|je(je)+|ji(ji)+|xd+|lol)\b/g],
  [TipoCharla.ACUERDO, /\b(ok|okey|vale|listo|perfecto|entendido|de acuerdo|ya|genial|excelente|claro|si|bueno)\b/g],
];
/** Palabras que acompañan a la charla y no cambian su sentido. */
const RELLENO = /\b(lucia|senorita|amiga|asistente|por favor|porfa|muy|y|tu|usted|oye|pues|nomas|nada mas|entonces)\b/g;

const OFENSAS =
  /\b(idiota|estupid[ao]|imbecil|tont[ao]|mierda|mrd|carajo|ctm|csm|conchatumadre|concha de tu madre|put[ao]|huevon|cojud[ao]|pendej[ao]|maldit[ao]s?|inutil|maricon|cabron|perr[ao] de|jodete|chupala|webon|tarad[ao]|mongol[ao]?)\b/;

/** Una palabra «parece palabra» si tiene vocal, no junta 5 consonantes ni repite una letra 3 veces. */
function pareceTexto(texto: string): boolean {
  const palabras = texto.split(' ').filter((p) => /[a-zñ]/.test(p));
  if (palabras.length === 0) return /\d/.test(texto); // solo números (un DNI, un monto) sí tienen sentido
  const validas = palabras.filter((p) => /[aeiou]/.test(p) && !/[^aeiou\d\s]{5}/.test(p) && !/(.)\1\1/.test(p));
  return validas.length / palabras.length >= 0.5;
}

export interface Charla {
  /** Tipo de charla si el mensaje es SOLO charla; null si trae una pregunta del trámite. */
  tipo: TipoCharla | null;
  /** El mensaje empezaba con un saludo: se responde la pregunta y se antepone el saludo. */
  saludo: boolean;
  /** Lo que queda para el flujo del trámite (sin el saludo inicial). */
  resto: string;
}

export function analizarCharla(mensaje: string): Charla {
  const texto = normalizar(mensaje).replace(/[^a-zñ0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (OFENSAS.test(texto)) return { tipo: TipoCharla.OFENSA, saludo: false, resto: '' };

  let quedan = ` ${texto} `;
  const encontrados: TipoCharla[] = [];
  for (const [tipo, patron] of FRASES) {
    const sin = quedan.replace(patron, ' ');
    if (sin !== quedan) encontrados.push(tipo);
    quedan = sin;
  }
  if (encontrados.length && quedan.replace(RELLENO, ' ').trim() === '') return { tipo: encontrados[0], saludo: false, resto: '' };
  if (!pareceTexto(texto)) return { tipo: TipoCharla.INCOHERENTE, saludo: false, resto: '' };

  // «Hola, ¿cuánto cuesta?»: se quita el saludo del inicio y se responde la pregunta.
  const inicio = mensaje.match(/^\s*[¡!]*\s*(hola+|holi|buenas( tardes| noches)?|buenos d[ií]as|buen d[ií]a|saludos|al[oó])\b[\s,.!¡]*((lucía|lucia)\b[\s,.!]*)?/i);
  if (inicio && inicio[0].length < mensaje.length) return { tipo: null, saludo: true, resto: mensaje.slice(inicio[0].length).trim() };
  return { tipo: null, saludo: false, resto: mensaje };
}

export type Publico = 'POSTULANTE' | 'PERSONAL';

const TEMAS: Record<Publico, string> = {
  POSTULANTE: 'requisitos para moto (II-B) o mototaxi (II-C), documentos, el pago de la tasa, citas y exámenes, y el estado de tu trámite',
  PERSONAL: 'lo que tienes pendiente y cómo hacer cada paso del trámite en el sistema',
};

/** Respuesta fija de Lucía para cada tipo de charla. */
export function responderCharla(tipo: TipoCharla, publico: Publico, nombre?: string): string {
  const a = nombre ? `, ${nombre}` : '';
  const objetivo = publico === 'POSTULANTE' ? '¿En qué te ayudo con tu licencia?' : '¿En qué te ayudo hoy?';
  switch (tipo) {
    case TipoCharla.SALUDO:
      return `¡Hola${a}! Soy ${NOMBRE_ASISTENTE}, la asistente virtual de la Municipalidad Provincial de Huamanga. ${objetivo}`;
    case TipoCharla.ANIMO:
      return `¡Hola${a}! Muy bien, gracias por preguntar. ${objetivo}`;
    case TipoCharla.ACUERDO:
      return `¡Perfecto${a}! ¿Hay algo más en lo que te pueda ayudar?`;
    case TipoCharla.GRACIAS:
      return `¡De nada${a}! Si tienes otra duda, aquí estoy.`;
    case TipoCharla.DESPEDIDA:
      return publico === 'POSTULANTE' ? `¡Hasta pronto${a}! Mucho éxito con tu licencia.` : `¡Hasta pronto${a}! Buen turno.`;
    case TipoCharla.IDENTIDAD:
      return publico === 'POSTULANTE'
        ? `Soy ${NOMBRE_ASISTENTE}, la IA de orientación de la Municipalidad. Respondo con la información oficial del trámite y, si no tengo una respuesta segura, paso tu consulta al gestor. No puedo aprobar ni cambiar nada de tu trámite.`
        : `Soy ${NOMBRE_ASISTENTE}, la IA de orientación del sistema. Te recuerdo lo pendiente y te explico los procedimientos aprobados. No ejecuto acciones: esas se hacen desde cada pantalla.`;
    case TipoCharla.AYUDA:
      return `Puedo ayudarte con ${TEMAS[publico]}. Elige una opción o escríbeme tu pregunta.`;
    case TipoCharla.RISA:
      return `😄 ${objetivo}`;
    case TipoCharla.OFENSA:
      return `Lo siento, no puedo ayudarte con ese tipo de mensajes. Estoy aquí para orientarte con respeto sobre ${TEMAS[publico]}.`;
    case TipoCharla.INCOHERENTE:
      return `No logré entender tu mensaje. Puedo ayudarte con ${TEMAS[publico]}. Elige una opción o escríbelo con otras palabras.`;
  }
}

/** Saludo que se antepone cuando el mensaje traía saludo y pregunta. */
export const saludoBreve = (nombre?: string) => `¡Hola${nombre ? `, ${nombre}` : ''}! `;

/** Primer nombre con mayúscula inicial («JUAN CARLOS» → «Juan»). */
export function primerNombre(nombre?: string): string | undefined {
  const primero = nombre?.trim().split(/\s+/)[0];
  return primero ? primero.charAt(0).toUpperCase() + primero.slice(1).toLowerCase() : undefined;
}
