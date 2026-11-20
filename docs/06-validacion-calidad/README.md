# Validación de los atributos de calidad · Sprint 2

Resultados de las pruebas basadas en los escenarios de `08-escenarios-atributos-calidad.md`. Cada fila indica la herramienta, la medida comprometida y el resultado obtenido.

> **Primera medición (19/11/2026):** entorno de desarrollo con 2 núcleos, Node.js 22 y PostgreSQL 16. La medición final se repite en la laptop del entorno de prueba y se guarda en esta carpeta.

## Resumen

| Escenario | Herramienta | Medida comprometida | Resultado | Estado |
|---|---|---|---|---|
| EQ-01 Seguridad | Jest + Supertest y Postman + Newman | 100 % de accesos sin permiso con 401/403 | 12 de 12 en Jest; 8 de 8 en Postman (sin token, token falso y rol no permitido) | Cumple |
| EQ-02 Privacidad | Postman + Newman y Jest + Supertest | 20 de 20 accesos a expedientes ajenos con 403 | **20 de 20 en Newman**: cada postulante intenta 10 operaciones sobre el trámite del otro. También 20 de 20 en Jest | Cumple |
| EQ-03 Rendimiento | k6 | p95 ≤ 3 s y errores < 1 % con 2,000 usuarios | p95 = 13.7 ms, 0 % de errores, 107,217 peticiones | Cumple |
| EQ-03 Caché | k6 (200 usuarios, 30 s) | Con caché, al menos 50 % más rápido | p95 de 167.6 ms a 81.7 ms (51 % menos); de 1,695 a 4,366 peticiones/s | Cumple |
| EQ-03 Volumen | k6 + `EXPLAIN ANALYZE` | p95 ≤ 1 s con 1,000 usuarios y 30,000 expedientes | p95 = 11.3 ms, 0 % de errores; 2 índices nuevos ([análisis](analisis-base-de-datos.md)) | Cumple |
| EQ-03 Portal | Lighthouse | Rendimiento ≥ 80 | 99 (antes 55: se quitó una fuente de íconos de 4.5 MB) | Cumple |
| EQ-06 Mantenibilidad | dependency-cruiser y Jest | Reglas al 100 %; cobertura ≥ 80 % | 0 violaciones en 109 módulos; cobertura de líneas 99.8 % | Cumple |
| EQ-07 Trazabilidad | Jest + Supertest | 8 de 8 operaciones auditadas | 8 de 8, con usuario, fecha, valor anterior y nuevo | Cumple |
| EQ-09 Integridad | Jest + Supertest y Postman | 100 % de modificaciones a un validado con 409 | Corrección y segunda validación con 409 en ambas herramientas; el resultado no cambia | Cumple |
| Contrato de la API (Guía 05) | Postman + Newman y Jest | Cada respuesta cumple el contrato OpenAPI | 101 solicitudes y 349 aserciones sin fallas; 31 de 31 operaciones documentadas | Cumple |
| EQ-04 Disponibilidad | Terminus, UptimeRobot, pg_dump | 99 % en horario; restauración ≤ 30 min | `/api/health` listo; falta el monitoreo de 2 semanas | Sprint 3 (con el despliegue) |
| EQ-05 Accesibilidad | Lighthouse y axe-core | ≥ 90 | Lighthouse 100; axe sin fallas graves WCAG 2.1 AA en 16 pantallas | Cumple |
| EQ-05 Usabilidad | Prueba con 5 usuarios y SUS | 4 de 5 sin ayuda; SUS ≥ 68 | Guía lista: [prueba-usabilidad.md](prueba-usabilidad.md) | Por ejecutar con los 5 participantes |
| EQ-08 IA | promptfoo | ≥ 90 % correctas; 100 % derivadas | El asistente se implementa en el sprint 3 | Sprint 3 |

## Evidencias guardadas (laptop del entorno de prueba)

| Archivo | Contenido |
|---|---|
| [`evidencias/01-pruebas-unitarias-jest.txt`](evidencias/01-pruebas-unitarias-jest.txt) | 54 pruebas unitarias aprobadas y la tabla de cobertura por archivo |
| [`evidencias/02-pruebas-api-jest-supertest.txt`](evidencias/02-pruebas-api-jest-supertest.txt) | 23 pruebas de la API con PostgreSQL: flujo completo, 401/403, 409 y auditoría |
| [`evidencias/03-reglas-arquitectura.txt`](evidencias/03-reglas-arquitectura.txt) | dependency-cruiser: 0 violaciones en 107 módulos |
| [`evidencias/cobertura-jest/index.html`](evidencias/cobertura-jest/index.html) | Reporte de cobertura navegable (abrir en el navegador) |
| [`evidencias/base-de-datos/`](evidencias/base-de-datos/) | Planes de ejecución antes y después de los índices, prueba de concurrencia y `pg_stat_statements` durante la carga |
| [`evidencias/postman/newman-ejecucion.txt`](evidencias/postman/newman-ejecucion.txt) | Salida completa de Newman: 101 solicitudes, 349 aserciones |
| [`evidencias/capturas/portal/`](evidencias/capturas/portal/) | 13 pantallas del portal tomadas por las pruebas E2E durante el trámite completo |

### Capturas

**Pruebas unitarias con cobertura (Jest)**

![Pruebas unitarias con Jest](evidencias/capturas/01-pruebas-unitarias-jest.png)

**Reporte de cobertura**

![Reporte de cobertura de Jest](evidencias/capturas/04-reporte-cobertura.png)

**Pruebas de la API con PostgreSQL (Jest + Supertest)**

![Pruebas de la API](evidencias/capturas/02-pruebas-api-jest-supertest.png)

**Reglas de arquitectura (dependency-cruiser)**

![Reglas de arquitectura](evidencias/capturas/03-reglas-arquitectura.png)

**Pruebas E2E del portal (Playwright): trámite completo con los 5 roles, control de acceso, vista móvil y accesibilidad**

![Pruebas E2E con Playwright](evidencias/capturas/05-pruebas-e2e-playwright.png)

**Colección de Postman con Newman: los 20 accesos ajenos con 403 (EQ-02) y el resumen**

![Newman](evidencias/capturas/08-postman-newman-eq02.png)

**Lighthouse del portal**

![Lighthouse](evidencias/capturas/07-lighthouse-portal.png)

**Base de datos: EXPLAIN ANALYZE antes y después de los índices, y concurrencia en cupos**

![EXPLAIN ANALYZE](evidencias/capturas/06-explain-analyze-indices.png)

## Pruebas automatizadas

| Tipo | Cantidad | Comando |
|---|---|---|
| Unitarias (dominio, casos de uso, formato de errores y contrato) | 83 | `npm run test:cov` (backend) |
| De API con PostgreSQL real | 26 | `npm run test:e2e` (backend) |
| Funcionales y de contrato (Postman + Newman) | 101 solicitudes | ver `tecnologia/pruebas-calidad/postman` |
| Reglas de arquitectura | 4 reglas | `npm run arquitectura` (backend) |
| E2E del portal en el navegador | 11 | `npm run e2e` (frontend) |
| Accesibilidad WCAG 2.1 AA (axe-core) | 16 pantallas | `npm run e2e` (frontend) |

Las capturas 01 a 03 son de la primera medición (54 unitarias y 23 de API). Después se agregaron las pruebas de los endpoints de consulta del portal, del formato único de errores y de las reglas del contrato OpenAPI.

**Cobertura de Jest** (dominio y aplicación): sentencias 99.8 %, ramas 97.5 %, funciones 100 %, líneas 99.8 %. El umbral mínimo configurado es 80 %: si baja, GitHub Actions falla.

## Lo que encontraron las pruebas

- **dependency-cruiser:** ver abajo.
- **Playwright:** al guardar un resultado, el formulario del evaluador se desmontaba al recargar la lista y el mensaje de confirmación se perdía. Se corrigió en el hook `useDatos`: la recarga posterior a una acción ya no muestra "Cargando".
- **Lighthouse:** la fuente completa de íconos (4.5 MB) bloqueaba el primer pintado: 24 s en 4G simulado. Se reemplazó por íconos SVG empaquetados solo cuando se usan: 150 KB en total y 1.8 s.
- **axe-core:** el botón naranja (blanco sobre `#FF7A00`, contraste 2.6:1) y algunos textos grises no llegaban a 4.5:1. Se ajustaron los colores.
- **Contrato OpenAPI:** la API devolvía los errores en dos formatos distintos (`{estado, mensaje}` y `{statusCode, message}`) y con mensajes en inglés. Se unificaron en `ErrorRespuesta`, en español.
- **Postman:** crear un horario repetido devolvía 500 (error interno) en vez de 409. Se corrigió en el repositorio de cupos y se agregó una red de seguridad en el filtro de errores.
- **EXPLAIN ANALYZE:** la bandeja sin filtro y los resultados por validar recorrían la tabla completa. Se agregaron dos índices ([detalle](analisis-base-de-datos.md)).

## Lo que encontró la regla de arquitectura

La primera ejecución de dependency-cruiser detectó que el caso de uso de Notificaciones importaba directamente una entidad de TypeORM, lo que rompe Clean Architecture. Se corrigió con el contrato `RepositorioAvisos` en el dominio y su implementación en infraestructura. Desde entonces la regla corre en cada push.

## Carga progresiva con k6 (EQ-03)

Script: `tecnologia/pruebas-calidad/k6/carga-progresiva.js` (subida a 500, 1,000 y 2,000 usuarios, con 1 a 3 s de pausa entre peticiones). Esta primera medición usó etapas cortas (2 min 45 s en total); el script completo dura 9 minutos y es el que se usa en la medición final.

| Métrica | Valor |
|---|---|
| Usuarios virtuales máximos | 2,000 |
| Peticiones | 107,217 |
| Errores | 0 % |
| Tiempo promedio | 4.1 ms |
| p95 | 13.7 ms |
| Máximo | 180.8 ms |

Las consultas probadas son requisitos (con caché), detalle del expediente y bandeja del gestor.
