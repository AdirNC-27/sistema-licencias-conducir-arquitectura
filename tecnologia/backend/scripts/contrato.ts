/**
 * npm run contrato            → escribe docs/07-contrato-api/openapi.json desde el código
 * npm run contrato:verificar  → falla si el archivo no coincide con el código (se usa en la CI)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import { ARCHIVO_CONTRATO, generarContrato, serializarContrato } from '../src/configuracion/contrato-openapi';

async function principal() {
  const actual = serializarContrato(await generarContrato());
  if (process.argv.includes('--verificar')) {
    const guardado = existsSync(ARCHIVO_CONTRATO) ? readFileSync(ARCHIVO_CONTRATO, 'utf8') : '';
    if (guardado !== actual) {
      console.error('El contrato OpenAPI no coincide con el código. Ejecute "npm run contrato" y haga commit del archivo.');
      process.exit(1);
    }
    console.log('El contrato OpenAPI coincide con el código.');
    return;
  }
  mkdirSync(dirname(ARCHIVO_CONTRATO), { recursive: true });
  writeFileSync(ARCHIVO_CONTRATO, actual);
  console.log(`Contrato escrito en ${ARCHIVO_CONTRATO}`);
}
void principal();
