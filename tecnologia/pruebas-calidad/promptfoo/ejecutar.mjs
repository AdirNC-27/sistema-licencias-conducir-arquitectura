/**
 * Inicia sesión como el postulante demo y ejecuta las 30 preguntas de EQ-08 con promptfoo.
 * Uso: node ejecutar.mjs            (API en http://localhost:3000/api)
 *      API_URL=https://... node ejecutar.mjs
 */
import { spawnSync } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_URL = process.env.API_URL ?? 'http://localhost:3000/api';
const sesion = await fetch(`${API_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ usuario: process.env.ASISTENTE_USUARIO ?? '45892014', clave: process.env.ASISTENTE_CLAVE ?? 'demo123' }),
});
if (!sesion.ok) {
  console.error(`No se pudo iniciar sesión en ${API_URL} (${sesion.status}). ¿Está la API en marcha?`);
  process.exit(1);
}
const { token } = await sesion.json();
const resultado = spawnSync(
  'npx',
  ['-y', 'promptfoo@0.125.1', 'eval', '-c', 'promptfooconfig.yaml', '-j', '1', '--no-cache', '--no-progress-bar', '-o', 'resultado-eq08.json', '-o', 'resultado-eq08.html', ...process.argv.slice(2)],
  { cwd: dirname(fileURLToPath(import.meta.url)), stdio: 'inherit', shell: process.platform === 'win32', env: { ...process.env, API_URL, ASISTENTE_TOKEN: token, PROMPTFOO_DISABLE_TELEMETRY: '1' } },
);
process.exit(resultado.status ?? 1);
