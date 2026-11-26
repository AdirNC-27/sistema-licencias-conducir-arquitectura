# EQ-01 y EQ-02 · Seguridad y privacidad

**EQ-01:** el 100 % de la matriz rol × operación responde 401 (sin sesión) o 403 (sin permiso), sin modificar ni devolver datos; OWASP ZAP sin alertas de riesgo alto.
**EQ-02:** el 100 % de los 20 intentos de acceso a expedientes ajenos responde 403; ningún documento se descarga sin token.

## Resultado (26/11/2026)

| Medida | Herramienta | Resultado | Evidencia | Origen |
|---|---|---|---|---|
| Sin token o con token falso → 401 | Jest + Supertest | **90 de 90**: las 45 operaciones protegidas, sin token y con token falso | [`matriz-roles.e2e-spec.ts`](../../../../tecnologia/backend/test/matriz-roles.e2e-spec.ts) | Ejecutado hoy |
| Rol sin permiso → 403 | Jest + Supertest | **120 de 120**: las 34 operaciones con `@Roles`, por cada rol que no está permitido | [matriz-rol-operacion.txt](matriz-rol-operacion.txt) | Ejecutado hoy |
| Las respuestas rechazadas no traen datos | Jest + Supertest | En los 210 casos el cuerpo solo tiene `estado`, `error`, `mensaje` | misma prueba | Ejecutado hoy |
| Intentos de escribir en un expediente ajeno no lo cambian | Jest + Supertest | Adjuntar, pagar y reservar cita en el expediente de otro → 403; el expediente, sus documentos, pagos y citas quedan iguales | prueba «privacidad: los intentos de escribir…» en [`flujo-tramite.e2e-spec.ts`](../../../../tecnologia/backend/test/flujo-tramite.e2e-spec.ts) | Ejecutado hoy |
| 20 accesos a expedientes ajenos → 403 | Postman + Newman | **20 de 20**: 10 operaciones de cada postulante sobre el expediente del otro (ver, documentos, pagos, citas, evaluaciones, datos personales, adjuntar, pagar, reservar, descargar) | carpeta «10 · Privacidad entre postulantes» de [newman-ejecucion.txt](../postman/newman-ejecucion.txt) | Registro del 26/11 (CI) |
| Descarga de documentos sin token → 401 | Jest + Supertest y Newman | 401 sin token y 403 para otro postulante | prueba «sube los 4 documentos…» y [newman-ejecucion.txt](../postman/newman-ejecucion.txt) | Ejecutado hoy |
| Escaneo de la API | OWASP ZAP 2.16.1 (escaneo básico pasivo sobre las 48 operaciones del contrato) | **0 alertas altas y 0 medias**. Primera corrida: 2 bajas (`X-Powered-By` y falta de `X-Content-Type-Options`). Se corrigieron en `configurarAplicacion` y la segunda corrida quedó con 1 informativa (el login entrega un token, es lo esperado) | [antes](zap-antes.html) · [después](zap-despues.html) · [JSON](zap-despues.json) | Ejecutado hoy |

## Cómo se arma la matriz

La prueba recorre los controladores registrados en NestJS y lee sus metadatos `@Roles` y `@Publico`, así que incluye cualquier endpoint nuevo sin escribirlo a mano. Primero comprueba que haya 45 operaciones protegidas, igual que el contrato OpenAPI. Las 11 operaciones protegidas sin `@Roles` (por ejemplo, `GET /expedientes/{id}`) admiten cualquier rol con sesión y se protegen por dueño: esa parte la cubre EQ-02.

## Repetir el escaneo de ZAP

Plan de automatización: [`tecnologia/pruebas-calidad/zap/plan-api.yaml`](../../../../tecnologia/pruebas-calidad/zap/plan-api.yaml) (reemplazar `RUTA_DEL_REPOSITORIO` y `RUTA_DE_SALIDA`).

```bash
zap.sh -cmd -autorun plan-api.yaml     # con la API en http://localhost:3000
```

Pendiente para el Sprint 3: repetir el escaneo sobre la URL desplegada (HTTPS) y agregar un escaneo autenticado.
