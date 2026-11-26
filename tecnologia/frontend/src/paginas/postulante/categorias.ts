import motoIIB from '../../assets/moto-iib.webp';
import mototaxiIIC from '../../assets/mototaxi-iic.webp';

/** Categorías de la licencia clase B con su tasa del TUPA (PA6190033B). */
export const CATEGORIAS = [
  { c: 'II-B', imagen: motoIIB, alt: 'Moto lineal azul', t: 'Moto', d: 'Uso particular', tasa: 'S/ 69.90' },
  { c: 'II-C', imagen: mototaxiIIC, alt: 'Mototaxi roja', t: 'Mototaxi', d: 'Servicio público', tasa: 'S/ 69.40' },
] as const;
