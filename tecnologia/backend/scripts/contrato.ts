/**
 * npm run contrato            → escribe docs/07-contrato-api/openapi.json desde el código
 * npm run contrato:verificar  → falla si el archivo no coincide con el código (se usa en la CI)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import { ARCHIVO_CONTRATO, GUIA_CONTRATO, generarContrato, guiaConTabla, serializarContrato } from '../src/configuracion/contrato-openapi';

async function principal() {
  const documento = await generarContrato();
  const actual = serializarContrato(documento);
  const guiaGuardada = readFileSync(GUIA_CONTRATO, 'utf8').replace(/\r\n/g, '\n');
  const guia = guiaConTabla(guiaGuardada, documento);
  if (guia === null) {
    console.error(`Faltan los marcadores de la tabla de operaciones en ${GUIA_CONTRATO}.`);
    process.exit(1);
  }
  if (process.argv.includes('--verificar')) {
    if (guia !== guiaGuardada) {
      console.error('La tabla de operaciones de la guía no coincide con el código. Ejecute "npm run contrato" y haga commit.');
      process.exit(1);
    }
    // Se ignora el tipo de fin de línea (CRLF en Windows, LF en Linux)
    const guardado = existsSync(ARCHIVO_CONTRATO) ? readFileSync(ARCHIVO_CONTRATO, 'utf8').replace(/\r\n/g, '\n') : '';
    if (guardado !== actual) {
      console.error('El contrato OpenAPI no coincide con el código. Ejecute "npm run contrato" y haga commit del archivo.');
      process.exit(1);
    }
    console.log('El contrato OpenAPI coincide con el código.');
    return;
  }
  mkdirSync(dirname(ARCHIVO_CONTRATO), { recursive: true });
  writeFileSync(ARCHIVO_CONTRATO, actual);
  writeFileSync(GUIA_CONTRATO, guia);
  console.log(`Contrato escrito en ${ARCHIVO_CONTRATO} y tabla de operaciones actualizada en ${GUIA_CONTRATO}`);
}
void principal();
