import {
  BadRequestException,
  ForbiddenException,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ConflictoError,
  RecursoNoEncontradoError,
  ReglaNegocioError,
} from '../dominio/errores';
import { FiltroErrores } from '../presentacion/filtro-errores';
import { traducirMensaje } from '../presentacion/mensajes-validacion';

describe('FiltroErrores: un solo formato de error para toda la API', () => {
  const filtro = new FiltroErrores();

  it.each([
    [
      new RecursoNoEncontradoError('No existe el expediente 9'),
      404,
      'RecursoNoEncontradoError',
      'No existe el expediente 9',
    ],
    [
      new ConflictoError('Ya tiene un trámite en curso'),
      409,
      'ConflictoError',
      'Ya tiene un trámite en curso',
    ],
    [
      new ReglaNegocioError('La fecha de pago no puede ser futura'),
      422,
      'ReglaNegocioError',
      'La fecha de pago no puede ser futura',
    ],
  ])(
    'conserva el mensaje de los errores del dominio (%#)',
    (error, estado, nombre, mensaje) => {
      expect(filtro.traducir(error)).toEqual({
        estado,
        error: nombre,
        mensaje,
      });
    },
  );

  it('reemplaza los mensajes genéricos en inglés de NestJS', () => {
    expect(filtro.traducir(new UnauthorizedException())).toEqual({
      estado: 401,
      error: 'NoAutenticado',
      mensaje: 'Inicie sesión: el token falta, no es válido o expiró',
    });
    expect(
      filtro.traducir(new NotFoundException('Cannot GET /api/no-existe')),
    ).toEqual({
      estado: 404,
      error: 'NoEncontrado',
      mensaje: 'La ruta solicitada no existe',
    });
    expect(
      filtro.traducir(new PayloadTooLargeException('File too large')).mensaje,
    ).toBe('El archivo supera el tamaño permitido (2 MB)');
  });

  it('conserva un mensaje propio en español', () => {
    expect(
      filtro.traducir(
        new ForbiddenException('Su rol no tiene permiso para esta operación'),
      ),
    ).toEqual({
      estado: 403,
      error: 'AccesoDenegado',
      mensaje: 'Su rol no tiene permiso para esta operación',
    });
    expect(
      filtro.traducir(
        new BadRequestException('Adjunte el archivo en el campo "archivo"'),
      ).mensaje,
    ).toBe('Adjunte el archivo en el campo "archivo"');
  });

  it('devuelve cada dato inválido traducido en "detalles"', () => {
    const r = filtro.traducir(
      new BadRequestException([
        'categoria must be one of the following values: II-B, II-C',
        'property x should not exist',
      ]),
    );
    expect(r).toEqual({
      estado: 400,
      error: 'SolicitudInvalida',
      mensaje: 'Datos de entrada inválidos',
      detalles: [
        'categoria debe ser uno de estos valores: II-B, II-C',
        'El campo x no está permitido',
      ],
    });
  });

  it('explica un parámetro de ruta inválido', () => {
    const r = filtro.traducir(
      new BadRequestException('Validation failed (numeric string is expected)'),
    );
    expect(r.mensaje).toBe('Un parámetro de la ruta no tiene un valor válido');
    expect(r.estado).toBe(400);
  });

  it('convierte una restricción UNIQUE no anticipada en 409, no en 500', () => {
    const duplicado = Object.assign(new Error('duplicate key value violates unique constraint'), { driverError: { code: '23505' } });
    expect(filtro.traducir(duplicado)).toEqual({ estado: 409, error: 'RegistroDuplicado', mensaje: 'El registro ya existe' });
  });

  it('no expone detalles internos de un error inesperado', () => {
    const registro = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const r = filtro.traducir(
      new Error('connection terminated: password authentication failed'),
    );
    expect(r).toEqual({
      estado: 500,
      error: 'ErrorInterno',
      mensaje: 'Error interno del servidor. Intente nuevamente.',
    });
    expect(registro).toHaveBeenCalled(); // el detalle queda en el log del servidor, no en la respuesta
  });
});

describe('Traducción de los mensajes de validación', () => {
  it.each([
    [
      'puntaje must not be greater than 20',
      'puntaje debe ser menor o igual que 20',
    ],
    ['puntaje must not be less than 0', 'puntaje debe ser mayor o igual que 0'],
    ['cupoId must be an integer number', 'cupoId debe ser un número entero'],
    [
      'fechaPago must be a valid ISO 8601 date string',
      'fechaPago debe ser una fecha válida (AAAA-MM-DD)',
    ],
    ['correo must be an email', 'correo debe ser un correo válido'],
    [
      'celular must be longer than or equal to 9 and shorter than or equal to 9 characters',
      'celular debe tener entre 9 y 9 caracteres',
    ],
    [
      'clave must be longer than or equal to 6 characters',
      'clave debe tener al menos 6 caracteres',
    ],
    ['motivo should not be empty', 'motivo es obligatorio'],
    [
      'monto must be a number conforming to the specified constraints',
      'monto debe ser un número con hasta 2 decimales',
    ],
  ])('%s', (ingles, espanol) => expect(traducirMensaje(ingles)).toBe(espanol));

  it('no toca los mensajes propios del DTO', () => {
    expect(traducirMensaje('El DNI debe tener 8 dígitos')).toBe(
      'El DNI debe tener 8 dígitos',
    );
  });
});
