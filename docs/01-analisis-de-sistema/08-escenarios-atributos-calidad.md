# Escenarios de atributos de calidad del Sistema de Licencias Clase B

Cada atributo de calidad de `04-atributos-de-calidad.md` se convierte en un escenario con una **medida que se puede cumplir** y la **herramienta con la que se mide**.

## Entorno de prueba

Todas las medidas se toman en el mismo entorno para que los resultados se puedan comparar.

| Elemento | Valor |
|---|---|
| **Equipo** | Laptop del equipo (CPU de 4 núcleos, 8 GB de RAM) |
| **Despliegue** | Docker Compose: API NestJS + PostgreSQL + portal React |
| **Datos de prueba** | 200 expedientes, 5 usuarios (uno por rol) y 50 postulantes cargados con un script SQL |
| **Usuarios virtuales (k6)** | Subida progresiva hasta 2,000 usuarios concurrentes, como pide el sprint 2 |
| **Horario de atención** | Lunes a viernes, de 8:00 a 16:00 |

## EQ-01. Seguridad: acceso según el rol

| Elemento | Descripción |
|---|---|
| **Origen** | AC01 · DA01 |
| **Fuente** | Usuario sin sesión, con token inválido o con un rol sin permiso (por ejemplo, un evaluador que intenta validar un resultado). |
| **Estímulo** | Intenta ejecutar una operación protegida que no corresponde a su rol. |
| **Condición** | Operación normal, con los 5 roles configurados. |
| **Respuesta esperada** | La API rechaza la operación y no modifica ni devuelve datos. |
| **Medida** | El 100 % de los casos de la matriz rol × operación devuelve 401 (sin sesión) o 403 (sin permiso). OWASP ZAP: 0 alertas de riesgo alto. |
| **Herramienta** | Jest + Supertest (pruebas de la API con un token por rol) · OWASP ZAP (escaneo básico) |
| **Cómo se mide** | Una prueba por cada combinación rol × endpoint protegido; el escaneo de ZAP se ejecuta sobre la API levantada en Docker. |
| **Evidencia** | Reporte de Jest y reporte HTML de ZAP. |

## EQ-02. Privacidad: acceso a documentos y datos personales

| Elemento | Descripción |
|---|---|
| **Origen** | AC02 · DA02 |
| **Fuente** | Postulante autenticado que no es dueño del expediente. |
| **Estímulo** | Cambia el número de expediente en la URL para ver documentos, pagos o resultados de otra persona. |
| **Condición** | Los documentos se guardan en PostgreSQL y solo se entregan por un endpoint autenticado. |
| **Respuesta esperada** | La API deniega el acceso y no muestra ningún dato del otro expediente. |
| **Medida** | El 100 % de los 20 intentos de acceso a expedientes ajenos devuelve 403. Ningún documento se descarga sin token. |
| **Herramienta** | Postman + Newman (colección de pruebas automatizadas) |
| **Cómo se mide** | 2 postulantes de prueba: cada uno intenta abrir 10 expedientes del otro; además se piden los documentos sin token. |
| **Evidencia** | Reporte de Newman con las 20 solicitudes y su código de respuesta. |

## EQ-03. Rendimiento: consultas habituales

| Elemento | Descripción |
|---|---|
| **Origen** | AC03 · DA09 |
| **Fuente** | Postulantes y personal de la MPH |
| **Estímulo** | Consultan requisitos, el estado de un expediente o la bandeja de expedientes. |
| **Condición** | Carga progresiva con k6: 100 → 500 → 1,000 → 2,000 usuarios virtuales, con una pausa de 1 a 3 segundos entre peticiones, como un usuario real. |
| **Respuesta esperada** | El sistema responde sin errores. |
| **Medida** | Hasta 1,000 usuarios: p95 ≤ 1 s. Con 2,000 usuarios: p95 ≤ 3 s y errores < 1 %. Con caché, la consulta de requisitos es al menos 50 % más rápida que sin caché. En el portal, Lighthouse da 80 o más en rendimiento. |
| **Herramienta** | k6 (prueba de carga) · Lighthouse de Chrome (portal web) |
| **Cómo se mide** | Script de k6 con etapas (`stages`) y umbrales (`thresholds`) sobre `GET /requisitos`, `GET /expedientes/{id}` y `GET /expedientes?estado=`; se corre dos veces, con caché y sin caché. Lighthouse en modo móvil sobre el inicio del postulante. |
| **Evidencia** | Resumen de k6 (p95, % de errores y peticiones por segundo en cada etapa) y reporte de Lighthouse. |

## EQ-04. Disponibilidad: servicio en horario de atención y recuperación

| Elemento | Descripción |
|---|---|
| **Origen** | AC04 · DA09 |
| **Fuente** | Caída de la API o de la base de datos |
| **Estímulo** | El sistema deja de responder en horario de atención. |
| **Condición** | Contenedores con reinicio automático y un respaldo diario de la base de datos. |
| **Respuesta esperada** | El contenedor se reinicia solo y, si se pierde la base de datos, se restaura desde el último respaldo. |
| **Medida** | Disponibilidad de 99 % o más en horario de atención durante 2 semanas de monitoreo. Reinicio automático en 2 minutos o menos. Restauración completa en 30 minutos o menos, con una pérdida máxima de 24 horas de datos. |
| **Herramienta** | `@nestjs/terminus` (`/api/health`) · UptimeRobot (monitoreo cada 5 minutos) · Docker Compose (`restart: always`) · `pg_dump` y `pg_restore` |
| **Cómo se mide** | UptimeRobot consulta el endpoint de salud; se detiene el contenedor a propósito y se mide cuánto tarda en volver; se borra la base de prueba y se restaura con cronómetro. |
| **Evidencia** | Reporte de UptimeRobot y registro con hora de inicio y fin de la restauración. |

## EQ-05. Usabilidad: identificar la siguiente acción

| Elemento | Descripción |
|---|---|
| **Origen** | AC05 · DA10 |
| **Fuente** | Postulante que usa el sistema por primera vez |
| **Estímulo** | Registra su solicitud, sube sus documentos e indica cuál es su siguiente paso. |
| **Condición** | 5 participantes sin conocimiento previo, desde celular y laptop, usando el prototipo publicado. |
| **Respuesta esperada** | El postulante entiende en qué etapa está y qué le falta. |
| **Medida** | Al menos 4 de 5 participantes terminan la tarea sin ayuda en 10 minutos o menos. Puntaje SUS de 68 o más. Lighthouse de accesibilidad de 90 o más. |
| **Herramienta** | Prueba con usuarios (tareas y cronómetro) · Cuestionario SUS en Google Forms · Lighthouse |
| **Cómo se mide** | Cada participante recibe 3 tareas escritas; se anota el tiempo, los errores y si pidió ayuda; al final responde las 10 preguntas del SUS. |
| **Evidencia** | Hoja de registro por participante y resultados del formulario SUS. |

## EQ-06. Mantenibilidad: cambiar una regla o una integración

| Elemento | Descripción |
|---|---|
| **Origen** | AC06 · DA05 · DA08 |
| **Fuente** | Equipo de desarrollo |
| **Estímulo** | Se cambia el proveedor de correo o se agrega un adaptador nuevo (por ejemplo, el SNC por la PIDE). |
| **Condición** | Módulos organizados con Clean Architecture y pruebas automáticas. |
| **Respuesta esperada** | El cambio solo toca el adaptador y su configuración; el dominio no cambia. |
| **Medida** | Las reglas de dependency-cruiser se cumplen al 100 % (el dominio no importa NestJS, TypeORM ni la infraestructura; ningún módulo importa carpetas internas de otro). El cambio de adaptador modifica 2 archivos o menos. Cobertura de Jest de 80 % o más en dominio y aplicación. |
| **Herramienta** | dependency-cruiser · Jest (`--coverage`) · `git diff --stat` |
| **Cómo se mide** | dependency-cruiser y Jest corren en GitHub Actions en cada push; se reemplaza `NotificadorCorreo` por otro adaptador y se cuentan los archivos cambiados. |
| **Evidencia** | Reporte de dependency-cruiser, reporte de cobertura de Jest y salida de `git diff --stat`. |

## EQ-07. Trazabilidad: registro de operaciones importantes

| Elemento | Descripción |
|---|---|
| **Origen** | AC07 · DA03 |
| **Fuente** | Gestor, evaluador, supervisor o administrador |
| **Estímulo** | Ejecuta una de las 16 operaciones auditables: aprobar u observar un documento, verificar un pago, registrar, corregir o validar un resultado, intentar modificar un resultado validado, cambiar la etapa, verificar en un portal oficial, observar un expediente, atender una observación, autorizar la emisión, registrar la licencia, responder una consulta, gestionar contenido del asistente o cambiar el rol de un usuario. |
| **Condición** | Operación normal del sistema. |
| **Respuesta esperada** | La operación queda en la bitácora de auditoría. |
| **Medida** | Las 16 operaciones (100 %) quedan registradas con usuario, fecha y hora, acción, y valor anterior y nuevo. |
| **Herramienta** | Jest + Supertest con PostgreSQL de prueba (servicio de GitHub Actions) |
| **Cómo se mide** | Una prueba de integración por operación: se ejecuta y luego se consulta la tabla de auditoría. |
| **Evidencia** | Reporte de Jest con las pruebas aprobadas. |

## EQ-08. Confiabilidad de la IA: respuestas controladas

| Elemento | Descripción |
|---|---|
| **Origen** | AC08 · DA07 |
| **Fuente** | Postulante |
| **Estímulo** | Pregunta sobre requisitos o plazos, pregunta algo fuera del trámite o pide una acción (por ejemplo, "aprueba mi expediente"). |
| **Condición** | El asistente responde solo con el contenido aprobado por el administrador y no tiene permisos de escritura. |
| **Respuesta esperada** | Responde con el contenido aprobado o deriva al gestor; nunca ejecuta acciones. |
| **Medida** | Con 30 preguntas de prueba (20 del trámite y 10 fuera de tema o de acción): 90 % o más de respuestas correctas en las 20 del trámite; el 100 % de las otras 10 se deriva al gestor; 0 acciones ejecutadas. |
| **Herramienta** | promptfoo (evaluación de respuestas de IA) |
| **Cómo se mide** | Archivo con las 30 preguntas y la respuesta esperada de cada una; promptfoo las envía a `POST /api/asistente/consultas` (la API completa, con la IA configurada) y compara. |
| **Evidencia** | Reporte de promptfoo con el resultado de cada pregunta. |

## EQ-09. Integridad: resultado validado bloqueado

| Elemento | Descripción |
|---|---|
| **Origen** | RF09 · DA04 |
| **Fuente** | Evaluador o cualquier otro usuario |
| **Estímulo** | Intenta modificar un resultado que el supervisor ya validó. |
| **Condición** | El resultado está en estado VALIDADO. |
| **Respuesta esperada** | La API rechaza el cambio, conserva el resultado y registra el intento. |
| **Medida** | El 100 % de los intentos devuelve 409 y el resultado queda igual. El 4.º intento de examen se rechaza siempre (`IntentosAgotadosError`). |
| **Herramienta** | Jest (pruebas del dominio) + Supertest (pruebas de la API) |
| **Cómo se mide** | Pruebas unitarias de `Evaluacion.validar()` y de `registrarIntento()`; prueba de API que intenta editar un resultado validado y luego lo consulta. |
| **Evidencia** | Reporte de Jest y cobertura de la entidad `Evaluacion`. |

## Resumen

| Código | Atributo | Medida principal | Herramienta |
|---|---|---|---|
| EQ-01 | Seguridad | 100 % de accesos sin permiso rechazados (401/403) | Jest + Supertest, OWASP ZAP |
| EQ-02 | Privacidad | 20 de 20 accesos a expedientes ajenos rechazados | Postman + Newman |
| EQ-03 | Rendimiento | p95 ≤ 3 s con 2,000 usuarios, errores < 1 % | k6, Lighthouse |
| EQ-04 | Disponibilidad | 99 % en horario; restauración ≤ 30 min | Terminus, UptimeRobot, pg_dump |
| EQ-05 | Usabilidad | 4 de 5 usuarios sin ayuda; SUS ≥ 68 | Prueba con usuarios, Google Forms, Lighthouse |
| EQ-06 | Mantenibilidad | Reglas de dependencias al 100 %; cobertura ≥ 80 % | dependency-cruiser, Jest |
| EQ-07 | Trazabilidad | 16 de 16 operaciones auditadas | Jest + Supertest |
| EQ-08 | Confiabilidad de la IA | ≥ 90 % correctas; 100 % derivadas; 0 acciones | promptfoo |
| EQ-09 | Integridad | 100 % de modificaciones rechazadas (409) | Jest + Supertest |
