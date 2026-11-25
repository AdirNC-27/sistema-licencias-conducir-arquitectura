# Pruebas de la API con Postman y Newman

Colección de pruebas funcionales y de contrato de la API. Recorre el trámite completo con los cinco roles. Cada solicitud comprueba tres cosas:

1. El código HTTP esperado.
2. Que la respuesta llegue en menos de 1 s (EQ-03).
3. Que el JSON cumpla **exactamente** el esquema del contrato OpenAPI ([`docs/07-contrato-api/openapi.json`](../../../docs/07-contrato-api/openapi.json)). Si la API devuelve un campo no documentado u omite uno obligatorio, la prueba falla.

| Archivo | Contenido |
|---|---|
| `licencias-clase-b.postman_collection.json` | 138 solicitudes en 11 carpetas |
| `local.postman_environment.json` | Variable `baseUrl` = `http://localhost:3000/api` |
| `archivos/` | PDF de prueba y un `.txt` para el caso de formato no permitido |
| `generar-coleccion.mjs` | Genera la colección a partir del contrato OpenAPI |

## Qué cubre

| Carpeta | Casos | Escenario |
|---|---|---|
| 01 Inicio de sesión | Token de los 6 usuarios, clave incorrecta (401), datos vacíos (400) | RF01 |
| 02 Requisitos del TUPA | Tasa por categoría, categoría inválida (400) | RF22 |
| 03 Expediente | Crear (201), segundo trámite (409), inválido (400), inexistente (404), id no numérico (400), bandeja | RF02, RF10 |
| 04 Documentos | Formato no permitido (422), certificado sin fecha (422), carga, revisión, rol no permitido (403) | RF03, RF04 |
| 05 Pagos | Monto incorrecto (422), registro, pago repetido (409), verificación | RF05, RF06 |
| 06 Cupos y citas | Rol no permitido (403), horario repetido (409), día no permitido (422), reserva | RF07, RF21 |
| 07 Evaluaciones | Nota fuera de rango (400), corrección, validación, **modificar un validado (409)** | RF08, RF09, EQ-09 |
| 08 Revisión, emisión y auditoría | Verificaciones en el SNC y sanciones, sanción pendiente (422), observación del supervisor, emisión, licencia para el SNC, avisos, bitácora, cambio de rol | RF11, RF12, RF13, RF16, RF17, RF24, RF27, EQ-07 |
| 09 Seguridad | Sin token y token falso (401), postulante en áreas del personal (403) | EQ-01 |
| 10 Privacidad | **20 accesos de un postulante al trámite del otro: 20 de 20 con 403** | EQ-02 |
| 11 Asistente | Respuesta con contenido aprobado, estado del trámite, pedido de acción y pregunta ajena derivados, respuesta del gestor, contenido del administrador | RF14, RF15, HU25 |

## Requisito

La API en marcha con la **base recién migrada**. La colección crea el expediente de cada postulante demo (45892014 y 70123456), y un postulante no puede tener dos trámites en curso.

```powershell
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U licencias -d licencias -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
cd tecnologia\backend
npm run migracion:ejecutar
npm run start:dev
```

## Ejecutar en Postman

1. **Import** → seleccionar `licencias-clase-b.postman_collection.json` y `local.postman_environment.json`.
2. Arriba a la derecha, elegir el entorno **Licencias · local**.
3. **Settings → General → Working directory**: seleccionar esta carpeta (`tecnologia/pruebas-calidad/postman`), para que Postman encuentre los archivos de `archivos/`.
4. Clic derecho en la colección → **Run collection** → **Run**. Las carpetas deben ejecutarse en orden.

## Ejecutar con Newman (terminal)

```powershell
cd tecnologia\pruebas-calidad\postman
npx newman@6 run licencias-clase-b.postman_collection.json -e local.postman_environment.json --working-dir .
```

Reporte HTML:

```powershell
npm install -g newman@6 newman-reporter-htmlextra
newman run licencias-clase-b.postman_collection.json -e local.postman_environment.json --working-dir . -r cli,htmlextra --reporter-htmlextra-export reporte-newman.html
```

En GitHub Actions corre en el job **Contrato y Postman** y deja el reporte HTML como artefacto.

## Si cambia la API

```bash
cd tecnologia/backend && npm run contrato                   # actualiza docs/07-contrato-api/openapi.json
cd ../pruebas-calidad/postman && node generar-coleccion.mjs # regenera la colección con los nuevos esquemas
```
