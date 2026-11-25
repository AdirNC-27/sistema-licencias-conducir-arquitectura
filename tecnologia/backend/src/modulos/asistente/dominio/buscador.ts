import { ContenidoAprobado } from './contenido';

/**
 * Búsqueda del contenido aprobado que responde una pregunta. Lógica pura y explicable: normaliza
 * el texto, agrupa sinónimos del trámite y mide qué parte de la pregunta cubre cada contenido,
 * dando más peso a las palabras poco frecuentes. Una pregunta ajena al trámite (sus palabras no
 * aparecen en ningún contenido) obtiene una cobertura baja y se deriva al gestor (RF15).
 */
export const UMBRAL_COBERTURA = 0.4;

const STOPWORDS = new Set(
  (
    'a al algo algun alguna como con cual cuales de del el ella en es esa ese eso esta este esto estoy ' +
    'hay la las le les lo los me mi mis muy no nos o para pero por que quiero quisiera se ser si sin sobre ' +
    'su sus te tengo tiene tienen tu un una uno unos y ya yo hola buenas buenos tardes noches gracias ' +
    'favor puedo podria debo deberia necesito saber decir dime informacion hacer hago son va voy fue ' +
    'quien quienes cuanto cuanta cuantos cuantas igual dan dar daran pasa dni'
  ).split(' '),
);

/** Formas en que la gente pregunta → concepto del trámite. */
const SINONIMOS: Record<string, string[]> = {
  pago: ['pagar', 'pago', 'pagos', 'pague', 'pagado', 'abonar', 'abono', 'deposito', 'depositar'],
  costo: ['cuesta', 'cuestan', 'costo', 'costos', 'precio', 'tasa', 'monto', 'cobran', 'soles'],
  examen: ['examen', 'examenes', 'prueba', 'pruebas', 'evaluacion', 'evaluaciones'],
  manejo: ['manejo', 'manejar', 'conduccion', 'conducir', 'practico', 'circuito', 'habilidades'],
  conocimiento: ['conocimientos', 'conocimiento', 'teorico', 'teoria', 'reglas', 'reglamento', 'preguntas'],
  intento: ['intento', 'intentos', 'oportunidad', 'oportunidades', 'desaprobar', 'desapruebo', 'desaprobe', 'jalo', 'jale', 'repetir', 'reprobar', 'repruebo'],
  certificado: ['certificado', 'medico', 'salud', 'clinica', 'psicosomatico'],
  cita: ['cita', 'citas', 'turno', 'turnos', 'horario', 'horarios', 'programar', 'reservar', 'reserva', 'cupo', 'cupos', 'agenda'],
  requisito: ['requisito', 'requisitos', 'necesita', 'requiere', 'piden', 'pide', 'pido', 'obligatorio', 'obligatoria', 'necesario', 'exigen', 'papeles', 'tramitar', 'sacar', 'saco', 'obtener', 'llevar', 'llevo', 'presentar', 'traer'],
  plazo: ['plazo', 'demora', 'demoran', 'tarda', 'tardan', 'tiempo', 'habiles', 'cuando', 'rapido', 'sale', 'salga', 'listo', 'lista', 'entregan'],
  mototaxi: ['mototaxi', 'mototaxis', 'mototaxista', 'profesional', 'trimoto'],
  moto: ['moto', 'motos', 'motocicleta', 'motocicletas', 'lineal', 'particular'],
  cofipro: ['cofipro', 'curso', 'capacitacion', 'escuela', 'constancia'],
  foto: ['foto', 'fotos', 'fotografia', 'fotografias', 'carne'],
  observado: ['observado', 'observada', 'observacion', 'observaron', 'rechazado', 'rechazaron', 'rechazo', 'corregir', 'subsanar'],
  licencia: ['licencia', 'licencias', 'brevete', 'brevetes', 'tramite', 'tramites'],
  sancion: ['multa', 'multas', 'papeleta', 'papeletas', 'sancion', 'sanciones', 'infraccion', 'infracciones'],
  archivo: ['pdf', 'jpg', 'png', 'archivo', 'archivos', 'formato', 'formatos', 'subir', 'adjuntar', 'escanear', 'megas', 'mb', 'peso'],
  vigencia: ['vigencia', 'vence', 'vencimiento', 'caduca', 'dura', 'vigente', 'meses', 'valido', 'valida', 'validez', 'vale'],
  dia: ['dia', 'dias', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'sabados', 'domingo', 'domingos', 'semana', 'fecha', 'fechas'],
  edad: ['edad', 'anos', 'menor', 'mayor'],
  lugar: ['donde', 'lugar', 'direccion', 'oficina', 'mac', 'presencial', 'atencion', 'atienden'],
  declaracion: ['declaracion', 'jurada', 'formulario', 'solicitud'],
  aviso: ['aviso', 'avisos', 'correo', 'notificacion', 'notificaciones', 'recordatorio', 'email'],
};

const CONCEPTO = new Map<string, string>(Object.entries(SINONIMOS).flatMap(([concepto, formas]) => formas.map((f) => [f, concepto])));

export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\bmoto[\s-]+taxis?\b/g, ' mototaxi ')
    .replace(/\bii[\s-]?c\b/g, ' mototaxi ')
    .replace(/\bii[\s-]?b\b/g, ' moto ')
    .replace(/[^a-z0-9ñ\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Raíz sencilla: concepto del trámite si es sinónimo; si no, las primeras 5 letras. */
function raiz(palabra: string): string {
  const concepto = CONCEPTO.get(palabra) ?? CONCEPTO.get(palabra.replace(/(es|s)$/, ''));
  if (concepto) return concepto;
  return palabra.length > 5 ? palabra.slice(0, 5) : palabra.replace(/(es|s)$/, '');
}

export function terminos(texto: string): string[] {
  const palabras = normalizar(texto)
    .split(' ')
    .filter((p) => p.length > 1 && !STOPWORDS.has(p) && !/^\d+$/.test(p));
  return [...new Set(palabras.map(raiz))];
}

export interface Coincidencia {
  contenido: ContenidoAprobado;
  cobertura: number;
}

/** Temas vecinos que este trámite no atiende: se derivan aunque compartan palabras (precio, mototaxi). */
const FUERA_DE_ALCANCE = /\b(soat|revision tecnica|placa|placas|tarjeta de propiedad|pasaporte|categoria a|a i|a ii|auto|autos|carro|carros|camion|bus|taxi|colectivo)\b/;

export function fueraDeAlcance(pregunta: string): boolean {
  return FUERA_DE_ALCANCE.test(normalizar(pregunta));
}

export function buscarContenidos(pregunta: string, contenidos: ContenidoAprobado[], maximo = 3): Coincidencia[] {
  if (fueraDeAlcance(pregunta)) return [];
  const consulta = terminos(pregunta);
  if (consulta.length === 0 || contenidos.length === 0) return [];
  const indice = contenidos.map((c) => ({
    contenido: c,
    principal: new Set(terminos(`${c.pregunta} ${c.palabrasClave}`)),
    secundario: new Set(terminos(c.respuesta)),
  }));
  const frecuencia = (t: string) => indice.filter((i) => i.principal.has(t) || i.secundario.has(t)).length;
  const peso = new Map(consulta.map((t) => [t, Math.log(1 + contenidos.length / Math.max(frecuencia(t), 0.5))]));
  const total = consulta.reduce((s, t) => s + (peso.get(t) ?? 0), 0);

  return indice
    .map(({ contenido, principal, secundario }) => {
      const obtenido = consulta.reduce((s, t) => s + (peso.get(t) ?? 0) * (principal.has(t) ? 1 : secundario.has(t) ? 0.5 : 0), 0);
      return { contenido, cobertura: Math.round((obtenido / total) * 1000) / 1000 };
    })
    .filter((c) => c.cobertura >= UMBRAL_COBERTURA)
    .sort((a, b) => b.cobertura - a.cobertura || a.contenido.id - b.contenido.id)
    .slice(0, maximo);
}
