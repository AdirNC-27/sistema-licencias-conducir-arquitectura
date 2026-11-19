# SDD-08 · Evaluaciones: 3 intentos y bloqueo

| Requisitos | Relación con la arquitectura | Estado |
|---|---|---|
| RF08, RF09, RF19 | DA04 · EQ-09 | Implementado (sprint 2) |

## Historia

Como **evaluador** quiero registrar el resultado de cada intento, y como **supervisor** quiero validarlo para que nadie lo cambie después.

## Criterios de aceptación

| # | Escenario | Dado | Cuando | Entonces |
|---|---|---|---|---|
| CA1 | Registrar intento | el expediente está en EXAMEN_CONOCIMIENTOS | el evaluador registra 12/20 | queda REGISTRADO, intento 1 de 3 |
| CA2 | Corregir antes de validar | el resultado está REGISTRADO | el evaluador corrige con motivo | cambia sin consumir intento y queda en auditoría |
| CA3 | Bloqueo | el supervisor ya validó el resultado | alguien intenta corregirlo | recibe 409, el resultado no cambia y el intento queda en auditoría |
| CA4 | Cuarto intento | ya hay 3 intentos desaprobados y validados | se registra otro | recibe 409 (`IntentosAgotadosError`) |
| CA5 | Avance | el supervisor valida un aprobado | se guarda | el expediente pasa a la etapa siguiente |

## Tareas técnicas

- [x] Entidad `Evaluacion` con `registrar()`, `corregir()` y `validar()`
- [x] Estrategias `CalificacionConocimientos` y `CalificacionManejo` (patrón Strategy) con `NOTA_MINIMA` configurable
- [x] Historial de intentos validados en `jsonb` y `@VersionColumn` contra escrituras simultáneas
- [x] Filtro global que traduce los errores del dominio a 409

## Endpoints (Swagger: `/api/docs`)

| Método | Ruta | Rol |
|---|---|---|
| POST | `/api/expedientes/{id}/evaluaciones/{tipo}/resultado` | EVALUADOR |
| PATCH | `/api/evaluaciones/{id}/resultado` | EVALUADOR |
| POST | `/api/evaluaciones/{id}/validacion` | SUPERVISOR |
| GET | `/api/expedientes/{id}/evaluaciones` | Dueño o personal |

## Pruebas que lo comprueban

- `modulos/evaluaciones/__tests__/evaluacion.spec.ts`
- `modulos/evaluaciones/__tests__/casos-de-uso.spec.ts`
- `test/flujo-tramite.e2e-spec.ts` (registro, corrección, bloqueo y 409)
