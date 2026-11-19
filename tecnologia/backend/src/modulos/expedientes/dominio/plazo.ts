/** RF10: plazo legal de 10 días hábiles (lunes a viernes). Lógica pura, sin base de datos. */
export const PLAZO_DIAS_HABILES = 10;

export function diasHabilesEntre(inicio: Date, fin: Date): number {
  const desde = new Date(Date.UTC(inicio.getUTCFullYear(), inicio.getUTCMonth(), inicio.getUTCDate()));
  const hasta = new Date(Date.UTC(fin.getUTCFullYear(), fin.getUTCMonth(), fin.getUTCDate()));
  let dias = 0;
  for (const d = new Date(desde); d < hasta; d.setUTCDate(d.getUTCDate() + 1)) {
    const dia = d.getUTCDay();
    if (dia !== 0 && dia !== 6) dias++;
  }
  return dias;
}

export interface EstadoPlazo {
  diasTranscurridos: number;
  diasRestantes: number;
  vencido: boolean;
  porcentaje: number;
}

export function calcularPlazo(inicio: Date, hoy: Date): EstadoPlazo {
  const transcurridos = diasHabilesEntre(inicio, hoy);
  return {
    diasTranscurridos: transcurridos,
    diasRestantes: Math.max(0, PLAZO_DIAS_HABILES - transcurridos),
    vencido: transcurridos > PLAZO_DIAS_HABILES,
    porcentaje: Math.min(100, Math.round((transcurridos / PLAZO_DIAS_HABILES) * 100)),
  };
}
