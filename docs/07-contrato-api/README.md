# Contrato de la API

El contrato es el acuerdo entre la API y quien la usa (el portal, Postman u otro sistema): qué recurso se pide, qué datos se envían, qué responde y qué errores pueden ocurrir. Está descrito con **OpenAPI 3.0** en [`openapi.json`](openapi.json) y se ve de forma interactiva en Swagger: `http://localhost:3000/api/docs`.

## Cómo se mantiene al día

El contrato **se genera desde el código**, no se escribe a mano. Cada operación del backend declara su contrato con el decorador `@Contrato` (respuesta exitosa con su esquema y los errores posibles). Tres controles evitan que la documentación y la implementación difieran:

| Control | Qué comprueba | Dónde |
|---|---|---|
| `npm run contrato:verificar` | `openapi.json` es igual al que genera el código | GitHub Actions |
| Prueba `contrato-openapi.spec.ts` | Las 47 operaciones tienen resumen, una respuesta exitosa con esquema, 401 si exigen token, 400 y 404 si llevan `{id}`, y errores con el formato único | Jest |
| Colección de Postman | Cada respuesta real cumple exactamente el esquema documentado (sin campos de más ni de menos) | Newman en GitHub Actions |

Después de cambiar un endpoint: `npm run contrato` en `tecnologia/backend` y `node generar-coleccion.mjs` en `tecnologia/pruebas-calidad/postman`.

## Convenciones

| Tema | Decisión |
|---|---|
| Base | `http://localhost:3000/api` (en Docker y en local) |
| Formato | JSON. Los documentos se envían como `multipart/form-data` (PDF, JPG o PNG de hasta 2 MB) |
| Autenticación | JWT en `Authorization: Bearer <token>`, obtenido en `POST /auth/login`. Solo son públicos el login, el registro de postulantes y los requisitos del TUPA |
| Autorización | Por rol (`@Roles`) y por dueño: un postulante solo accede a su propio expediente (EQ-02) |
| Crear | `POST` → **201** con el recurso creado |
| Consultar | `GET` → **200** |
| Cambiar de estado | `PATCH` sobre una acción concreta (`/revision`, `/verificacion`, `/emision`, `/rol`) → **200** |
| Validar un resultado | `POST /evaluaciones/{id}/validacion` → **200** (es una acción, no crea un recurso) |
| **Sin `PUT` ni `DELETE`** | Un expediente es un registro administrativo: no se reemplaza completo ni se borra. Cada cambio es una acción con su motivo, y queda en la auditoría con el valor anterior y el nuevo (RF17, EQ-07). Una corrección se hace con otra acción, nunca borrando |
| Paginación | `GET /expedientes?pagina=1&tamano=20` → `{ total, pagina, tamano, datos }` |

## Códigos de respuesta

| Código | Cuándo | Ejemplo |
|---|---|---|
| 200 | Consulta o acción exitosa | Ver un expediente, aprobar un documento |
| 201 | Recurso creado | Iniciar un trámite, registrar un pago |
| 400 | Datos o parámetros inválidos | Categoría `II-X`, nota 25, `/expedientes/abc` |
| 401 | Sin token, token inválido o vencido, o clave incorrecta | Bandeja sin iniciar sesión |
| 403 | El rol no puede hacerlo, o el recurso es de otro postulante | Un postulante en la auditoría |
| 404 | El recurso no existe | `/expedientes/999999` |
| 409 | Choca con el estado actual | Segundo trámite en curso, corregir un resultado ya validado |
| 413 | Archivo de más de 2 MB | |
| 422 | Incumple una regla del trámite | Monto distinto de la tasa, certificado médico vencido |
| 500 | Error inesperado | Se registra en el servidor y no se exponen detalles internos |

## Formato único de error

Todos los errores, sean del dominio, de validación o de seguridad, responden con el mismo esquema (`ErrorRespuesta`) y en español:

```json
{
  "estado": 400,
  "error": "SolicitudInvalida",
  "mensaje": "Datos de entrada inválidos",
  "detalles": ["categoria debe ser uno de estos valores: II-B, II-C"]
}
```

`detalles` solo aparece en los 400 e indica cada dato inválido. El portal muestra `mensaje` y, si existen, los `detalles`.

## Operaciones

| Recurso | Método | Ruta | Operación | Éxito | Errores | Acceso |
|---|---|---|---|---|---|---|
| Identidad y acceso | POST | `/auth/login` | Iniciar sesión (RF01) | 200 | 400 401 | Pública |
| Identidad y acceso | GET | `/auth/yo` | Datos del usuario autenticado | 200 | 401 | Token |
| Identidad y acceso | GET | `/usuarios` | Listar cuentas (RF16) | 200 | 401 403 | Token |
| Identidad y acceso | PATCH | `/usuarios/{id}/rol` | Cambiar el rol de una cuenta del personal (RF16, auditable) | 200 | 400 401 403 404 422 | Token |
| Postulantes | POST | `/postulantes` | Crear cuenta de postulante con DNI validado en API Perú (RF03, RF04) | 201 | 400 404 409 422 | Pública |
| Postulantes | GET | `/postulantes` | Nombres y DNI de varios postulantes (bandeja del personal, una sola consulta) | 200 | 401 403 | Token |
| Postulantes | GET | `/postulantes/{id}` | Datos de un postulante (el propio o, para el personal, cualquiera) | 200 | 400 401 403 404 | Token |
| Requisitos (TUPA) | GET | `/requisitos` | Requisitos del TUPA por trámite y categoría (RF22) | 200 | 400 | Pública |
| Expedientes y seguimiento | POST | `/expedientes` | Registrar una solicitud de licencia (RF02) | 201 | 400 401 403 409 422 | Token |
| Expedientes y seguimiento | GET | `/expedientes` | Bandeja de expedientes del personal, con filtros y paginación | 200 | 400 401 403 | Token |
| Expedientes y seguimiento | GET | `/expedientes/mios` | Mis trámites con etapa y plazo (RF10) | 200 | 401 403 | Token |
| Expedientes y seguimiento | GET | `/expedientes/{id}` | Estado, etapa y plazo de un expediente (RF10) | 200 | 400 401 403 404 | Token |
| Expedientes y seguimiento | PATCH | `/expedientes/{id}/emision` | Autorizar la emisión de la licencia (RF12, auditable) | 200 | 400 401 403 404 409 | Token |
| Requisitos y documentos | POST | `/expedientes/{id}/documentos` | Adjuntar un documento del expediente (RF03) | 201 | 400 401 403 404 409 413 422 | Token |
| Requisitos y documentos | GET | `/expedientes/{id}/documentos` | Documentos del expediente y su estado | 200 | 400 401 403 404 | Token |
| Requisitos y documentos | GET | `/documentos/{id}/archivo` | Descargar el archivo de un documento (solo el dueño o el personal, EQ-02) | 200 | 400 401 403 404 | Token |
| Requisitos y documentos | PATCH | `/documentos/{id}/revision` | Aprobar u observar un documento (RF04, auditable) | 200 | 400 401 403 404 409 422 | Token |
| Pagos | POST | `/expedientes/{id}/pagos` | Registrar el recibo pagado en el SAT Huamanga (RF05) | 201 | 400 401 403 404 409 422 | Token |
| Pagos | GET | `/expedientes/{id}/pagos` | Pagos del expediente | 200 | 400 401 403 404 | Token |
| Pagos | PATCH | `/pagos/{id}/verificacion` | Verificar, observar o rechazar un pago (RF06, auditable) | 200 | 400 401 403 404 409 422 | Token |
| Citas | POST | `/cupos` | Habilitar un horario con cupos (RF21) | 201 | 400 401 403 409 422 | Token |
| Citas | GET | `/cupos` | Horarios con cupos disponibles | 200 | 400 401 | Token |
| Citas | POST | `/expedientes/{id}/citas` | Reservar la cita de examen (RF07) | 201 | 400 401 403 404 409 422 | Token |
| Citas | GET | `/expedientes/{id}/citas` | Citas programadas del expediente | 200 | 400 401 403 404 | Token |
| Evaluaciones | POST | `/expedientes/{id}/evaluaciones/{tipo}/resultado` | Registrar el resultado de un intento (RF08, máximo 3) | 201 | 400 401 403 404 409 | Token |
| Evaluaciones | PATCH | `/evaluaciones/{id}/resultado` | Corregir el resultado antes de la validación (RF09, auditable) | 200 | 400 401 403 404 409 | Token |
| Evaluaciones | POST | `/evaluaciones/{id}/validacion` | Validar el resultado: queda bloqueado (RF09, DA04) | 200 | 400 401 403 404 409 | Token |
| Evaluaciones | GET | `/evaluaciones/por-validar` | Resultados registrados que esperan la validación del supervisor | 200 | 401 403 | Token |
| Evaluaciones | GET | `/expedientes/{id}/evaluaciones` | Resultados del expediente (RF19) | 200 | 400 401 403 404 | Token |
| Auditoría | GET | `/auditoria` | Bitácora de solo lectura (RF17) | 200 | 400 401 403 | Token |
| Notificaciones | GET | `/notificaciones/mias` | Avisos del postulante (RF13) | 200 | 401 403 | Token |
`GET /health` (estado de la API y de PostgreSQL) completa las 32 rutas; la genera `@nestjs/terminus`.
