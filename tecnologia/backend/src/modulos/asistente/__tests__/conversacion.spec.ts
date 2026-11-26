import { analizarCharla, primerNombre, responderCharla, TipoCharla } from '../dominio/conversacion';

describe('Lucía: charla con frases fijas, sin IA', () => {
  it.each([
    ['hola', TipoCharla.SALUDO],
    ['¡Hola Lucía!', TipoCharla.SALUDO],
    ['Buenas tardes', TipoCharla.SALUDO],
    ['¿Cómo estás?', TipoCharla.ANIMO],
    ['bien y tú', TipoCharla.ANIMO],
    ['Muchas gracias, Lucía', TipoCharla.GRACIAS],
    ['ok', TipoCharla.ACUERDO],
    ['chau', TipoCharla.DESPEDIDA],
    ['¿Quién eres?', TipoCharla.IDENTIDAD],
    ['¿Eres un robot?', TipoCharla.IDENTIDAD],
    ['ayuda', TipoCharla.AYUDA],
    ['¿Qué puedes hacer?', TipoCharla.AYUDA],
    ['jajaja', TipoCharla.RISA],
    ['eres una idiota', TipoCharla.OFENSA],
    ['hola, ¿cuánto cuesta? tonta', TipoCharla.OFENSA],
    ['asdfgh', TipoCharla.INCOHERENTE],
    ['kkkkkk', TipoCharla.INCOHERENTE],
  ])('«%s» es %s', (mensaje, tipo) => {
    expect(analizarCharla(mensaje).tipo).toBe(tipo);
  });

  it('un saludo con pregunta deja la pregunta para el flujo del trámite', () => {
    expect(analizarCharla('Hola, ¿cuánto cuesta la licencia?')).toEqual({ tipo: null, saludo: true, resto: '¿cuánto cuesta la licencia?' });
    expect(analizarCharla('Buenos días Lucía, quiero sacar mi licencia de moto')).toEqual({ tipo: null, saludo: true, resto: 'quiero sacar mi licencia de moto' });
  });

  it('las preguntas del trámite y los pedidos de acción no son charla', () => {
    for (const q of ['¿Cuánto cuesta la licencia?', 'Aprueba mi expediente por favor', 'Ya pagué, ¿pueden verificar mi pago?', '¿Qué es el MTC?', 'Mi DNI es 45892014', '¿Cuál es la capital de Francia?']) {
      expect(analizarCharla(q)).toEqual({ tipo: null, saludo: false, resto: q });
    }
  });

  it('responde con su nombre, el del usuario y lo que puede hacer según el público', () => {
    expect(responderCharla(TipoCharla.SALUDO, 'POSTULANTE', 'Juan')).toBe('¡Hola, Juan! Soy Lucía, la asistente virtual de la Municipalidad Provincial de Huamanga. ¿En qué te ayudo con tu licencia?');
    expect(responderCharla(TipoCharla.SALUDO, 'PERSONAL')).toContain('¿En qué te ayudo hoy?');
    expect(responderCharla(TipoCharla.OFENSA, 'POSTULANTE')).toMatch(/^Lo siento, no puedo ayudarte con ese tipo de mensajes/);
    expect(responderCharla(TipoCharla.AYUDA, 'PERSONAL')).toContain('lo que tienes pendiente');
    expect(responderCharla(TipoCharla.IDENTIDAD, 'POSTULANTE')).toContain('No puedo aprobar ni cambiar nada');
    for (const tipo of Object.values(TipoCharla)) {
      expect(responderCharla(tipo, 'POSTULANTE', 'Ana').length).toBeGreaterThan(10);
      expect(responderCharla(tipo, 'PERSONAL').length).toBeGreaterThan(10);
    }
  });

  it('primer nombre para saludar', () => {
    expect(primerNombre('JUAN CARLOS QUISPE')).toBe('Juan');
    expect(primerNombre('gestor')).toBe('Gestor');
    expect(primerNombre(undefined)).toBeUndefined();
    expect(primerNombre('  ')).toBeUndefined();
  });
});
