import { ConfigService } from '@nestjs/config';
import { Audiencia, TemaContenido } from '../dominio/contenido';
import { AdaptadorIAGemini, INSTRUCCIONES_IA, interpretar } from '../infraestructura/adaptador-ia-gemini';

const contenido = { id: 3, tema: TemaContenido.PAGOS, audiencia: Audiencia.POSTULANTE, pregunta: '¿Cuánto cuesta la licencia?', respuesta: 'S/ 69.90 la II-B y S/ 69.40 la II-C.', palabrasClave: '', activo: true };
const config = (valores: Record<string, string>) => new ConfigService(valores);
const respuestaGemini = (texto: string, ok = true, estado = 200) =>
  ({ ok, status: estado, json: async () => (ok ? { candidates: [{ content: { parts: [{ text: texto }] } }] } : { error: { message: 'cuota agotada' } }) }) as Response;

describe('Adaptador de la IA de orientación (Gemini)', () => {
  afterEach(() => jest.restoreAllMocks());

  it('sin IA_API_KEY no está disponible y no llama a ningún servicio', async () => {
    const llamada = jest.spyOn(global, 'fetch');
    const ia = new AdaptadorIAGemini(config({}));
    expect(ia.disponible).toBe(false);
    expect(await ia.redactar('¿Cuánto cuesta?', [contenido])).toBeNull();
    expect(llamada).not.toHaveBeenCalled();
  });

  it('envía las reglas, el contenido aprobado y la pregunta; interpreta la respuesta JSON', async () => {
    const llamada = jest.spyOn(global, 'fetch').mockResolvedValue(respuestaGemini('```json\n{"respuesta": "Cuesta S/ 69.40 para mototaxi.", "confiable": true}\n```'));
    const ia = new AdaptadorIAGemini(config({ IA_API_KEY: 'clave', IA_MODELO: 'modelo-x' }));
    expect(await ia.redactar('¿Cuánto cuesta la II-C?', [contenido])).toEqual({ respuesta: 'Cuesta S/ 69.40 para mototaxi.', confiable: true });
    const [url, opciones] = llamada.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/models/modelo-x:generateContent');
    expect((opciones.headers as Record<string, string>)['x-goog-api-key']).toBe('clave');
    const cuerpo = JSON.parse(opciones.body as string);
    expect(cuerpo.systemInstruction.parts[0].text).toBe(INSTRUCCIONES_IA);
    expect(cuerpo.contents[0].parts[0].text).toContain('S/ 69.90 la II-B y S/ 69.40 la II-C.');
    expect(cuerpo.contents[0].parts[0].text).toContain('¿Cuánto cuesta la II-C?');
  });

  it('si el servicio falla, responde con error o tarda demasiado, devuelve null', async () => {
    const ia = new AdaptadorIAGemini(config({ IA_API_KEY: 'clave' }));
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(respuestaGemini('', false, 429));
    expect(await ia.redactar('¿Cuánto cuesta?', [contenido])).toBeNull();
    jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('timeout'));
    expect(await ia.redactar('¿Cuánto cuesta?', [contenido])).toBeNull();
  });

  it('descarta respuestas sin el formato esperado', () => {
    expect(interpretar('Claro, cuesta 69.40')).toBeNull();
    expect(interpretar('{"respuesta": 5, "confiable": true}')).toBeNull();
    expect(interpretar('{"respuesta": "ok", "confiable": true}')).toBeNull();
    expect(interpretar('{roto')).toBeNull();
    expect(interpretar('{"respuesta": "", "confiable": false}')).toEqual({ respuesta: '', confiable: false });
  });
});
