import { NotificarListener } from '../aplicacion/notificar.listener';
import { Postulante } from '../../postulantes/dominio/postulante';

describe('Notificaciones · Observer (RF13)', () => {
  const crear = (enviado: boolean, existe = true) => {
    const servicio = { enviar: jest.fn(async () => enviado) };
    const postulantes = { buscarPorId: jest.fn(async () => (existe ? new Postulante(10, '45892014', 'JUAN', 'QUISPE', 'j@c.pe', '987654321') : null)) };
    const avisos = { guardar: jest.fn(async () => undefined) };
    return { servicio, avisos, listener: new NotificarListener(servicio, postulantes as never, avisos as never) };
  };

  it('envía el recordatorio de la cita por correo y guarda el aviso', async () => {
    const { servicio, avisos, listener } = crear(true);
    await listener.alReservarCita({ expedienteId: 1, postulanteId: 10, tipo: 'CONOCIMIENTOS', fecha: '2026-11-23 08:30' });
    expect(servicio.enviar).toHaveBeenCalledWith(expect.objectContaining({ correo: 'j@c.pe', asunto: 'Recordatorio: examen de conocimientos' }));
    expect(avisos.guardar).toHaveBeenCalledWith(expect.objectContaining({ enviadoPorCorreo: true }));
  });

  it('avisa el cambio de etapa aunque el correo falle o no exista el postulante', async () => {
    const { avisos, listener } = crear(false, false);
    await listener.alCambiarEtapa({ expedienteId: 1, numero: 'EXP-2026-00001', postulanteId: 10, etapaAnterior: 'PAGO', etapaNueva: 'CITA' });
    expect(avisos.guardar).toHaveBeenCalledWith(expect.objectContaining({ enviadoPorCorreo: false, texto: expect.stringContaining('elegir cita') }));
  });
});
