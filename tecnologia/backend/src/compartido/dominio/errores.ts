/** Errores del dominio: no dependen de NestJS ni de HTTP. El filtro de presentación los traduce. */
export abstract class ErrorDominio extends Error {
  abstract readonly tipo: 'NO_ENCONTRADO' | 'CONFLICTO' | 'REGLA_NEGOCIO' | 'ACCESO_DENEGADO' | 'NO_AUTENTICADO';
  constructor(mensaje: string) {
    super(mensaje);
    this.name = new.target.name;
  }
}

export class RecursoNoEncontradoError extends ErrorDominio {
  readonly tipo = 'NO_ENCONTRADO' as const;
}

export class ConflictoError extends ErrorDominio {
  readonly tipo = 'CONFLICTO' as const;
}

export class ReglaNegocioError extends ErrorDominio {
  readonly tipo = 'REGLA_NEGOCIO' as const;
}

export class AccesoDenegadoError extends ErrorDominio {
  readonly tipo = 'ACCESO_DENEGADO' as const;
}

export class CredencialesInvalidasError extends ErrorDominio {
  readonly tipo = 'NO_AUTENTICADO' as const;
}
