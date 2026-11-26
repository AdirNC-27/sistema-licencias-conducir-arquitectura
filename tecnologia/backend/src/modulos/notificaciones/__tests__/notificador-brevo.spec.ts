import { ConfigService } from '@nestjs/config';
import { NotificadorBrevo } from '../infraestructura/notificador-brevo';

/** EQ-06: otro proveedor de correo detrás del mismo puerto ServicioNotificaciones. */
describe('NotificadorBrevo · adaptador de correo por API HTTP', () => {
  const mensaje = { correo: 'ana@correo.pe', asunto: 'Tu trámite avanzó', texto: 'Pasó a la etapa de pago.' };
  const config = (valores: Record<string, string>) => new ConfigService(valores);
  let fetchOriginal: typeof fetch;

  beforeEach(() => {
    fetchOriginal = global.fetch;
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => {
    global.fetch = fetchOriginal;
    jest.restoreAllMocks();
  });

  it('envía el correo a la API de Brevo con el remitente configurado', async () => {
    const llamada = jest.fn(async () => new Response('{}', { status: 201 }));
    global.fetch = llamada as unknown as typeof fetch;
    const brevo = new NotificadorBrevo(config({ BREVO_API_KEY: 'clave-de-prueba', SMTP_REMITENTE: 'Licencias MPH <avisos@munihuamanga.pe>' }));

    await expect(brevo.enviar(mensaje)).resolves.toBe(true);
    const [url, opciones] = llamada.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect((opciones.headers as Record<string, string>)['api-key']).toBe('clave-de-prueba');
    expect(JSON.parse(opciones.body as string)).toEqual({
      sender: { name: 'Licencias MPH', email: 'avisos@munihuamanga.pe' },
      to: [{ email: 'ana@correo.pe' }],
      subject: 'Tu trámite avanzó',
      textContent: 'Pasó a la etapa de pago.',
    });
  });

  it('sin clave no llama a la API y devuelve false (el aviso interno se guarda igual)', async () => {
    const llamada = jest.fn();
    global.fetch = llamada as unknown as typeof fetch;
    await expect(new NotificadorBrevo(config({})).enviar(mensaje)).resolves.toBe(false);
    expect(llamada).not.toHaveBeenCalled();
  });

  it('si Brevo rechaza o no responde, devuelve false sin lanzar error', async () => {
    const brevo = new NotificadorBrevo(config({ BREVO_API_KEY: 'clave-de-prueba' }));
    global.fetch = jest.fn(async () => new Response('{}', { status: 401 })) as unknown as typeof fetch;
    await expect(brevo.enviar(mensaje)).resolves.toBe(false);
    global.fetch = jest.fn(async () => Promise.reject(new Error('timeout'))) as unknown as typeof fetch;
    await expect(brevo.enviar(mensaje)).resolves.toBe(false);
  });
});
