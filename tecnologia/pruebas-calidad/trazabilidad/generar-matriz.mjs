// Matriz de trazabilidad de las especificaciones SDD: criterio → regla o endpoint → prueba → resultado.
// Los criterios se leen de docs/05-especificaciones-sdd y los resultados, de los reportes JSON de las pruebas
// ejecutadas; así la matriz no se escribe a mano y falla si un criterio no tiene prueba o una prueba falla.
//
// Uso (desde tecnologia/):
//   node pruebas-calidad/trazabilidad/generar-matriz.mjs --unitarias u.json --api a.json --portal p.json --commit abc1234
//   u.json y a.json: jest --json --outputFile=…   ·   p.json: playwright test --reporter=json
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = join(aqui, '..', '..', '..');
const carpetaSdd = join(raiz, 'docs', '05-especificaciones-sdd');
const salida = join(carpetaSdd, 'matriz-trazabilidad.md');

const args = Object.fromEntries(process.argv.slice(2).reduce((pares, v, i, a) => (v.startsWith('--') ? [...pares, [v.slice(2), a[i + 1]]] : pares), []));
for (const clave of ['unitarias', 'api', 'portal']) {
  if (!args[clave]) {
    console.error(`Falta --${clave} <reporte.json>`);
    process.exit(2);
  }
}

/** Resultados por título de prueba: { estado, archivo } (si un título se repite, basta que uno exista). */
function resultadosJest(ruta, quitarSrc) {
  const reporte = JSON.parse(readFileSync(ruta, 'utf8'));
  const mapa = new Map();
  for (const archivo of reporte.testResults) {
    for (const a of archivo.assertionResults) {
      const nombre = archivo.name.replaceAll('\\', '/');
      const desde = nombre.indexOf('tecnologia/backend/');
      let ruta = desde >= 0 ? nombre.slice(desde + 'tecnologia/backend/'.length) : nombre;
      if (quitarSrc) ruta = ruta.replace(/^src\//, '');
      mapa.set(a.title, { estado: a.status === 'passed' ? 'ok' : 'falla', archivo: ruta });
    }
  }
  return { mapa, total: reporte.numTotalTests, pasaron: reporte.numPassedTests };
}

function resultadosPlaywright(ruta) {
  const reporte = JSON.parse(readFileSync(ruta, 'utf8'));
  const mapa = new Map();
  let total = 0;
  let pasaron = 0;
  const recorrer = (suite) => {
    for (const spec of suite.specs ?? []) {
      total += 1;
      if (spec.ok) pasaron += 1;
      mapa.set(spec.title, { estado: spec.ok ? 'ok' : 'falla', archivo: `e2e/${spec.file}` });
    }
    for (const hija of suite.suites ?? []) recorrer(hija);
  };
  reporte.suites.forEach(recorrer);
  return { mapa, total, pasaron };
}

const resultados = {
  unitaria: resultadosJest(args.unitarias, true),
  api: resultadosJest(args.api, false),
  portal: resultadosPlaywright(args.portal),
};
const NOMBRE_TIPO = { unitaria: 'Jest', api: 'Supertest', portal: 'Playwright', evidencia: 'Evidencia' };

/** Criterios de aceptación de cada especificación: | CA1 | Escenario | Dado | Cuando | Entonces | */
const especificaciones = readdirSync(carpetaSdd)
  .filter((f) => /^sdd-\d+.*\.md$/.test(f))
  .sort()
  .map((archivo) => {
    const texto = readFileSync(join(carpetaSdd, archivo), 'utf8');
    const titulo = texto.split('\n')[0].replace(/^#\s*/, '');
    const codigo = titulo.split(' · ')[0];
    const criterios = [...texto.matchAll(/^\|\s*(CA\d+)\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|/gm)].map((m) => ({
      id: m[1],
      escenario: m[2].trim(),
      entonces: m[5].trim(),
    }));
    return { archivo, titulo, codigo, criterios };
  });

const mapa = JSON.parse(readFileSync(join(aqui, 'matriz-sdd.json'), 'utf8'));
const problemas = [];
let conPrueba = 0;
let totalCriterios = 0;

const secciones = especificaciones.map((sdd) => {
  const filas = sdd.criterios.map((ca) => {
    totalCriterios += 1;
    const entrada = mapa[sdd.codigo]?.[ca.id];
    if (!entrada) {
      problemas.push(`${sdd.codigo} ${ca.id}: sin prueba asignada`);
      return `| ${ca.id} | ${ca.escenario} | — | **Sin prueba asignada** | ❌ |`;
    }
    let ejecutadas = 0;
    let fallas = 0;
    const pruebas = entrada.pruebas.map((p) => {
      if (p.tipo === 'evidencia') return `${NOMBRE_TIPO.evidencia}: [${p.texto}](../../${p.ruta})`;
      const r = resultados[p.tipo].mapa.get(p.prueba);
      if (!r) {
        problemas.push(`${sdd.codigo} ${ca.id}: no se encontró la prueba «${p.prueba}» (${p.tipo})`);
        fallas += 1;
        return `${NOMBRE_TIPO[p.tipo]}: «${p.prueba}» **no encontrada**`;
      }
      ejecutadas += 1;
      if (r.estado !== 'ok') {
        problemas.push(`${sdd.codigo} ${ca.id}: falla «${p.prueba}»`);
        fallas += 1;
      }
      return `${NOMBRE_TIPO[p.tipo]} \`${r.archivo}\`: «${p.prueba}» ${r.estado === 'ok' ? '✅' : '❌'}`;
    });
    if (ejecutadas > 0 && fallas === 0) conPrueba += 1;
    const resultado = fallas > 0 ? '❌ Falla' : ejecutadas > 0 ? '✅ Cumple' : '📄 Solo evidencia';
    return `| ${ca.id} | ${ca.escenario}: ${ca.entonces} | \`${entrada.regla}\` | ${pruebas.join('<br>')} | ${resultado} |`;
  });
  for (const id of Object.keys(mapa[sdd.codigo] ?? {})) {
    if (!sdd.criterios.some((c) => c.id === id)) problemas.push(`${sdd.codigo} ${id}: está en matriz-sdd.json pero no en la especificación`);
  }
  return [`## [${sdd.titulo}](${sdd.archivo})`, '', '| Criterio | Escenario y resultado esperado | Regla o endpoint | Pruebas | Resultado |', '|---|---|---|---|---|', ...filas, ''].join('\n');
});

const fecha = new Date().toISOString().slice(0, 10);
const md = [
  '# Matriz de trazabilidad de las especificaciones SDD',
  '',
  '> Generada por `tecnologia/pruebas-calidad/trazabilidad/generar-matriz.mjs` a partir de los criterios de cada especificación y de los reportes de las pruebas ejecutadas. No se edita a mano: la relación criterio → prueba está en `matriz-sdd.json`.',
  '',
  `| Dato | Valor |`,
  '|---|---|',
  `| Commit evaluado | \`${args.commit ?? 'sin indicar'}\` |`,
  `| Fecha de ejecución | ${fecha} |`,
  `| Criterios de aceptación | ${totalCriterios} en ${especificaciones.length} especificaciones |`,
  `| Criterios con al menos una prueba ejecutada que pasa | **${conPrueba} de ${totalCriterios}** |`,
  `| Pruebas unitarias (Jest) | ${resultados.unitaria.pasaron} de ${resultados.unitaria.total} pasan |`,
  `| Pruebas de la API con PostgreSQL (Jest + Supertest) | ${resultados.api.pasaron} de ${resultados.api.total} pasan |`,
  `| Pruebas del portal (Playwright) | ${resultados.portal.pasaron} de ${resultados.portal.total} pasan |`,
  '',
  'Leyenda: ✅ la prueba se ejecutó y pasó · ❌ falla o no se encontró · 📄 respaldado por una evidencia medida (k6, concurrencia, promptfoo), no por una prueba automática.',
  '',
  ...secciones,
  '## Fuera de este sprint',
  '',
  'RF25 (revalidación), RF26 (duplicado) y RF18 quedan para el Sprint 3, como indica el [índice de especificaciones](README.md); por eso no tienen criterios en esta matriz.',
  '',
].join('\n');

writeFileSync(salida, md);
console.log(`Matriz escrita en ${relative(raiz, salida)}: ${conPrueba} de ${totalCriterios} criterios con prueba ejecutada que pasa.`);
if (problemas.length) {
  console.error(`\n${problemas.length} problema(s):\n- ${problemas.join('\n- ')}`);
  process.exit(1);
}
