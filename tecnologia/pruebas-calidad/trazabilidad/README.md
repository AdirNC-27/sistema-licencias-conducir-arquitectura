# Trazabilidad de las especificaciones SDD

`generar-matriz.mjs` arma [`docs/05-especificaciones-sdd/matriz-trazabilidad.md`](../../../docs/05-especificaciones-sdd/matriz-trazabilidad.md): cada criterio de aceptación con su regla o endpoint, las pruebas que lo comprueban y el resultado de la última ejecución.

- Los criterios se leen de las especificaciones (`docs/05-especificaciones-sdd/sdd-*.md`).
- La relación criterio → prueba está en `matriz-sdd.json` (por nombre de prueba).
- El resultado sale de los reportes JSON de Jest y Playwright, no se escribe a mano.
- El script termina con error si un criterio no tiene prueba, si una prueba no existe o si falla.

## Uso

Desde `tecnologia/`, después de correr las pruebas con reporte JSON:

```bash
# backend
npx jest --coverage --json --outputFile=../reportes/unitarias.json
npx jest --config ./test/jest-e2e.json --runInBand --json --outputFile=../reportes/api.json
# frontend (API recién migrada + portal en marcha)
PLAYWRIGHT_JSON_OUTPUT_NAME=../reportes/portal.json npx playwright test --reporter=json,list

node pruebas-calidad/trazabilidad/generar-matriz.mjs \
  --unitarias reportes/unitarias.json --api reportes/api.json --portal reportes/portal.json --commit <commit>
```

Los reportes de la última ejecución están en `docs/06-validacion-calidad/evidencias/trazabilidad/`, así que la matriz se puede regenerar sin volver a correr las pruebas.
