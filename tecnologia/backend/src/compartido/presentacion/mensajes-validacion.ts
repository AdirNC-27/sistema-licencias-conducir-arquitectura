/**
 * class-validator genera sus mensajes en inglés. Se traducen los de las reglas que usa la API
 * para que el ciudadano y el personal reciban mensajes en español. Los mensajes propios de un
 * DTO (p. ej. "El DNI debe tener 8 dígitos") no coinciden con ningún patrón y se conservan.
 */
const TRADUCCIONES: [RegExp, string][] = [
  [/^property (\w+) should not exist$/, 'El campo $1 no está permitido'],
  [
    /^(\w+) must be one of the following values: (.+)$/,
    '$1 debe ser uno de estos valores: $2',
  ],
  [/^(\w+) must be an integer number$/, '$1 debe ser un número entero'],
  [
    /^(\w+) must be a number conforming to the specified constraints$/,
    '$1 debe ser un número con hasta 2 decimales',
  ],
  [/^(\w+) must not be less than (-?\d+)$/, '$1 debe ser mayor o igual que $2'],
  [
    /^(\w+) must not be greater than (-?\d+)$/,
    '$1 debe ser menor o igual que $2',
  ],
  [
    /^(\w+) must be a valid ISO 8601 date string$/,
    '$1 debe ser una fecha válida (AAAA-MM-DD)',
  ],
  [/^(\w+) must be a string$/, '$1 debe ser un texto'],
  [/^(\w+) should not be empty$/, '$1 es obligatorio'],
  [/^(\w+) must be an email$/, '$1 debe ser un correo válido'],
  [/^(\w+) must be a boolean value$/, '$1 debe ser verdadero o falso'],
  [
    /^(\w+) must be longer than or equal to (\d+) and shorter than or equal to (\d+) characters$/,
    '$1 debe tener entre $2 y $3 caracteres',
  ],
  [
    /^(\w+) must be longer than or equal to (\d+) characters$/,
    '$1 debe tener al menos $2 caracteres',
  ],
  [
    /^(\w+) must be shorter than or equal to (\d+) characters$/,
    '$1 debe tener como máximo $2 caracteres',
  ],
  [
    /^(\w+) must match .+ regular expression$/,
    '$1 no tiene el formato esperado',
  ],
];

export function traducirMensaje(mensaje: string): string {
  for (const [patron, reemplazo] of TRADUCCIONES) {
    if (patron.test(mensaje)) return mensaje.replace(patron, reemplazo);
  }
  return mensaje;
}
