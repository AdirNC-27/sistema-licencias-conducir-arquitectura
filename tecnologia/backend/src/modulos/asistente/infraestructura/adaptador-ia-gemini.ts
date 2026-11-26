import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Audiencia, ContenidoAprobado } from '../dominio/contenido';
import { AsistenteIA, RedaccionIA } from '../dominio/contratos';

interface RespuestaGemini {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
  error?: { message?: string };
}

const REGLAS = [
  'Reglas obligatorias:',
  '1. Usa SOLO la información del CONTENIDO APROBADO. No agregues montos, plazos, requisitos, lugares ni horarios que no estén ahí.',
  '2. Si el contenido no responde la pregunta, o la pregunta es ajena al trámite, devuelve "confiable": false.',
  '3. No puedes aprobar, registrar, modificar, reprogramar ni verificar nada, y nunca digas que lo hiciste o que lo harás.',
];

export const INSTRUCCIONES_IA = [
  'Eres Lucía, la IA de orientación del Sistema de Licencias de Conducir Clase B de la Municipalidad Provincial de Huamanga.',
  'Respondes a ciudadanos que tramitan la licencia II-B (motocicletas) o II-C (mototaxis).',
  ...REGLAS,
  '4. Responde en español sencillo, de tú, en un máximo de 3 oraciones.',
  'Devuelve solo un objeto JSON con esta forma: {"respuesta": "texto", "confiable": true}',
].join('\n');

/** Para el personal municipal: mismo límite (solo contenido aprobado), con tono de procedimiento interno. */
export const INSTRUCCIONES_IA_PERSONAL = [
  'Eres Lucía, la IA de orientación del Sistema de Licencias de Conducir Clase B de la Municipalidad Provincial de Huamanga.',
  'Respondes al personal municipal (gestor de trámites, evaluador, supervisor o administrador) sobre cómo usar el sistema y las reglas del trámite.',
  ...REGLAS,
  '4. Responde en español claro, de tú, con pasos concretos, en un máximo de 4 oraciones.',
  'Devuelve solo un objeto JSON con esta forma: {"respuesta": "texto", "confiable": true}',
].join('\n');

/**
 * Adaptador de la IA de orientación con la API de Gemini (ADR-015). Cambiar de proveedor es escribir
 * otro adaptador de AsistenteIA y cambiar una línea del módulo (EQ-06). Sin IA_API_KEY el asistente
 * sigue funcionando: entrega el contenido aprobado sin reescribirlo.
 */
@Injectable()
export class AdaptadorIAGemini implements AsistenteIA {
  private readonly log = new Logger(AdaptadorIAGemini.name);
  private readonly clave: string | undefined;
  private readonly modelo: string;
  private readonly url: string;
  private readonly espera: number;

  constructor(config: ConfigService) {
    this.clave = config.get<string>('IA_API_KEY') || undefined;
    this.modelo = config.get<string>('IA_MODELO', 'gemini-3.1-flash-lite');
    this.url = config.get<string>('IA_URL', 'https://generativelanguage.googleapis.com/v1beta');
    this.espera = Number(config.get('IA_TIEMPO_ESPERA_MS', 8000));
  }

  get disponible(): boolean {
    return Boolean(this.clave);
  }

  async redactar(pregunta: string, contenidos: ContenidoAprobado[], audiencia = Audiencia.POSTULANTE): Promise<RedaccionIA | null> {
    if (!this.clave) return null;
    const contexto = contenidos.map((c, i) => `[${i + 1}] Pregunta: ${c.pregunta}\nRespuesta aprobada: ${c.respuesta}`).join('\n\n');
    try {
      const respuesta = await fetch(`${this.url}/models/${this.modelo}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.clave },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: audiencia === Audiencia.PERSONAL ? INSTRUCCIONES_IA_PERSONAL : INSTRUCCIONES_IA }] },
          contents: [{ role: 'user', parts: [{ text: `CONTENIDO APROBADO:\n${contexto}\n\n${audiencia === Audiencia.PERSONAL ? 'PREGUNTA DEL PERSONAL' : 'PREGUNTA DEL CIUDADANO'}: ${pregunta}` }] }],
          generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 400 },
        }),
        signal: AbortSignal.timeout(this.espera),
      });
      const cuerpo = (await respuesta.json()) as RespuestaGemini;
      if (!respuesta.ok) {
        this.log.warn(`La IA respondió ${respuesta.status}: ${cuerpo.error?.message ?? 'sin detalle'}`);
        return null;
      }
      return interpretar(cuerpo.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '');
    } catch (error) {
      this.log.warn(`No se pudo consultar la IA: ${(error as Error).message}`);
      return null;
    }
  }
}

/** Acepta el JSON aunque venga dentro de un bloque de código; cualquier otra cosa se descarta. */
export function interpretar(texto: string): RedaccionIA | null {
  const inicio = texto.indexOf('{');
  const fin = texto.lastIndexOf('}');
  if (inicio < 0 || fin <= inicio) return null;
  try {
    const datos = JSON.parse(texto.slice(inicio, fin + 1)) as Partial<RedaccionIA>;
    if (typeof datos.respuesta !== 'string' || typeof datos.confiable !== 'boolean') return null;
    const respuesta = datos.respuesta.trim();
    if (datos.confiable && (respuesta.length < 5 || respuesta.length > 1200)) return null;
    return { respuesta, confiable: datos.confiable };
  } catch {
    return null;
  }
}
