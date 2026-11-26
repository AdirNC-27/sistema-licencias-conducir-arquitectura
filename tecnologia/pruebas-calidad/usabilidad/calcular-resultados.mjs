// EQ-05 · Resultados de la prueba de usabilidad a partir de dos CSV:
//   observacion.csv: participante,rol,dispositivo,tarea1..tarea5 (S = sin ayuda, A = con ayuda, N = no lo logró, - = no aplica),minutos_total,comentarios
//   sus.csv:         participante,p1..p10 (respuestas de 1 a 5, como las exporta Google Forms)
// Uso: node calcular-resultados.mjs <observacion.csv> <sus.csv> [salida.md]
// Meta: al menos 4 de 5 completan sus tareas sin ayuda en 10 minutos o menos, y SUS promedio ≥ 68.
import { readFileSync, writeFileSync } from 'node:fs';

const [, , rutaObs, rutaSus, rutaSalida] = process.argv;
if (!rutaObs || !rutaSus) {
  console.error('Uso: node calcular-resultados.mjs <observacion.csv> <sus.csv> [salida.md]');
  process.exit(2);
}

const leerCsv = (ruta) => {
  const [cabecera, ...filas] = readFileSync(ruta, 'utf8').replace(/^﻿/, '').trim().split(/\r?\n/);
  const campos = cabecera.split(',').map((c) => c.trim().toLowerCase());
  return filas.filter((f) => f.trim()).map((f) => {
    const valores = f.split(',');
    return Object.fromEntries(campos.map((c, i) => [c, (c === 'comentarios' ? valores.slice(i).join(',') : valores[i] ?? '').trim().replace(/^"|"$/g, '')]));
  });
};

/** SUS: impares (respuesta − 1), pares (5 − respuesta); la suma × 2.5 da 0 a 100. */
export function puntajeSus(respuestas) {
  if (respuestas.length !== 10 || respuestas.some((r) => !Number.isInteger(r) || r < 1 || r > 5)) return null;
  return respuestas.reduce((suma, r, i) => suma + (i % 2 === 0 ? r - 1 : 5 - r), 0) * 2.5;
}

const META_MINUTOS = 10;
const observaciones = leerCsv(rutaObs);
const sus = new Map(leerCsv(rutaSus).map((f) => [f.participante, puntajeSus(Array.from({ length: 10 }, (_, i) => Number(f[`p${i + 1}`])))]));
const problemas = [];

const filas = observaciones.map((o) => {
  const tareas = ['tarea1', 'tarea2', 'tarea3', 'tarea4', 'tarea5'].map((t) => (o[t] || '').toUpperCase()).filter((t) => t && t !== '-');
  if (!tareas.length || tareas.some((t) => !['S', 'A', 'N'].includes(t))) problemas.push(`${o.participante}: marque cada tarea con S, A, N o -`);
  const minutos = Number(o.minutos_total);
  if (!Number.isFinite(minutos) || minutos <= 0) problemas.push(`${o.participante}: falta el tiempo total en minutos`);
  const sinAyuda = tareas.length > 0 && tareas.every((t) => t === 'S');
  const exito = sinAyuda && minutos <= META_MINUTOS;
  const puntaje = sus.get(o.participante);
  if (puntaje == null) problemas.push(`${o.participante}: respuestas SUS incompletas o fuera de 1 a 5`);
  return { ...o, tareas, minutos, sinAyuda, exito, puntaje };
});

if (problemas.length) {
  console.error(`Datos incompletos:\n- ${problemas.join('\n- ')}`);
  process.exit(1);
}

const exitos = filas.filter((f) => f.exito).length;
const promedio = filas.reduce((s, f) => s + f.puntaje, 0) / filas.length;
const cumpleTareas = exitos >= 4;
const cumpleSus = promedio >= 68;
const marca = { S: '✔', A: '◐', N: '✘' };

const md = [
  '# Resultados de la prueba de usabilidad (EQ-05)',
  '',
  `Generado por \`calcular-resultados.mjs\` el ${new Date().toISOString().slice(0, 10)} a partir de [observacion.csv](observacion.csv) y [sus.csv](sus.csv).`,
  '',
  '| Participante | Rol | Dispositivo | Tareas | Minutos | Sin ayuda en ≤ 10 min | SUS |',
  '|---|---|---|---|---|---|---|',
  ...filas.map((f) => `| ${f.participante} | ${f.rol} | ${f.dispositivo} | ${f.tareas.map((t) => marca[t]).join(' ')} | ${f.minutos} | ${f.exito ? 'Sí' : 'No'} | ${f.puntaje.toFixed(1)} |`),
  '',
  '| Medida | Meta | Resultado | Estado |',
  '|---|---|---|---|',
  `| Completan sus tareas sin ayuda en ${META_MINUTOS} min o menos | 4 de 5 | ${exitos} de ${filas.length} | ${cumpleTareas ? 'Cumple' : 'No cumple'} |`,
  `| SUS promedio | ≥ 68 | ${promedio.toFixed(1)} | ${cumpleSus ? 'Cumple' : 'No cumple'} |`,
  '',
  '## Comentarios de los participantes',
  '',
  ...filas.filter((f) => f.comentarios).map((f) => `- **${f.participante}:** ${f.comentarios}`),
  '',
].join('\n');

if (rutaSalida) writeFileSync(rutaSalida, md);
console.log(md);
process.exit(cumpleTareas && cumpleSus ? 0 : 3);
