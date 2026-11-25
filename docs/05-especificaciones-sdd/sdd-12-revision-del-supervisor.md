# SDD-12 · Revisión del supervisor y emisión

| Requisitos | Relación con la arquitectura | Estado |
|---|---|---|
| RF11, RF12 | DA04 · ADR-006 | Implementado (sprint 2) |

## Historia

Como **supervisor** quiero revisar el expediente completo (documentos, pago, exámenes y verificaciones del gestor), devolverlo al gestor si encuentro un problema y autorizar la emisión solo cuando todo está conforme (HU20, HU21, HU22).

## Criterios de aceptación

| # | Escenario | Dado | Cuando | Entonces |
|---|---|---|---|---|
| CA1 | Vista completa | el expediente está en EMISION | el supervisor abre la revisión | ve verificaciones, observaciones, pendientes y si está listo para emitir |
| CA2 | Observar | el expediente está en EMISION | el supervisor escribe el motivo | queda una observación ABIERTA y el gestor la ve en su bandeja |
| CA3 | Una sola abierta | ya hay una observación ABIERTA | el supervisor observa otra vez | recibe 409 |
| CA4 | Emisión bloqueada | hay una observación ABIERTA o falta una verificación | el supervisor autoriza | recibe 422 con la lista de pendientes |
| CA5 | Atención | la observación está ABIERTA | el gestor describe la corrección | queda ATENDIDA y no se puede atender dos veces (409) |
| CA6 | Emisión | no hay pendientes | el supervisor autoriza | el expediente pasa a EMITIDA y queda en auditoría |

## Tareas técnicas

- [x] Módulo `revision`: depende de la fachada de Expedientes y no al revés, para no crear ciclos
- [x] `pendientesDeEmision()` reúne verificaciones y observaciones en una sola regla
- [x] Índice único parcial: una sola observación ABIERTA por expediente
- [x] Auditoría: `OBSERVAR_EXPEDIENTE`, `ATENDER_OBSERVACION` y `AUTORIZAR_EMISION`

## Endpoints (Swagger: `/api/docs`)

| Método | Ruta | Rol |
|---|---|---|
| GET | `/api/expedientes/{id}/revision` | Personal |
| POST | `/api/expedientes/{id}/observaciones` | SUPERVISOR |
| GET | `/api/observaciones/abiertas` | GESTOR, SUPERVISOR |
| PATCH | `/api/observaciones/{id}/atencion` | GESTOR |
| PATCH | `/api/expedientes/{id}/emision` | SUPERVISOR |

## Pruebas que lo comprueban

- `modulos/revision/__tests__/revision.spec.ts`
- `test/flujo-tramite.e2e-spec.ts` (observación, atención y emisión)
- Playwright: `e2e/flujo-tramite.spec.ts` (el supervisor devuelve el expediente y el gestor lo atiende)
