export enum Categoria {
  II_B = 'II-B',
  II_C = 'II-C',
}

export enum TipoTramite {
  EMISION = 'EMISION',
  REVALIDACION = 'REVALIDACION',
  DUPLICADO = 'DUPLICADO',
}

/** Tasa única del TUPA MPH (incluye los dos exámenes). */
export const TASA_EMISION: Record<Categoria, number> = {
  [Categoria.II_B]: 69.9,
  [Categoria.II_C]: 69.4,
};
