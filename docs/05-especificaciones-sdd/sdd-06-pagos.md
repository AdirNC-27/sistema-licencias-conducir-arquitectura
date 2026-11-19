# SDD-06 · Pago en el SAT

| Requisitos | Relación con la arquitectura | Estado |
|---|---|---|
| RF05, RF06 | DA06 | Implementado (sprint 2) |

## Historia

Como **postulante** quiero registrar mi recibo del SAT, y como **gestor** quiero verificarlo para que el trámite continúe.

## Criterios de aceptación

| # | Escenario | Dado | Cuando | Entonces |
|---|---|---|---|---|
| CA1 | Monto incorrecto | el expediente es II-C | registra S/ 69.90 | recibe 422 (la tasa es S/ 69.40) |
| CA2 | Operación repetida | el número de operación ya existe | lo registra otra vez | recibe 409 |
| CA3 | Verificación | hay un pago PENDIENTE | el gestor lo marca VERIFICADO | el expediente pasa a CITA y queda en auditoría |
| CA4 | Pago verificado bloqueado | el pago ya está VERIFICADO | el gestor intenta cambiarlo | recibe 409 |

## Tareas técnicas

- [x] Entidad `Pago` con `validarRegistro()` y `verificar()`
- [x] Tasas del TUPA en `TASA_EMISION`
- [x] Índice único en `numero_operacion`

## Endpoints (Swagger: `/api/docs`)

| Método | Ruta | Rol |
|---|---|---|
| POST | `/api/expedientes/{id}/pagos` | POSTULANTE |
| GET | `/api/expedientes/{id}/pagos` | Dueño o personal |
| PATCH | `/api/pagos/{id}/verificacion` | GESTOR |

## Pruebas que lo comprueban

- `modulos/pagos/__tests__/pagos.spec.ts`
- `test/flujo-tramite.e2e-spec.ts` (pago y verificación)
