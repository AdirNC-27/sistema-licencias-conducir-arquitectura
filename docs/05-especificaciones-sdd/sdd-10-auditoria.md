# SDD-10 · Auditoría de operaciones

| Requisitos | Relación con la arquitectura | Estado |
|---|---|---|
| RF17 | DA03 · ADR-006 · EQ-07 | Implementado (sprint 2) |

## Historia

Como **supervisor o administrador** quiero saber quién hizo cada cambio importante, cuándo y qué valor tenía antes.

## Criterios de aceptación

| # | Escenario | Dado | Cuando | Entonces |
|---|---|---|---|---|
| CA1 | Registro | el gestor verifica un pago | se guarda la operación | queda una fila con usuario, fecha, acción, valor anterior y nuevo |
| CA2 | Las 8 operaciones | se recorre el trámite completo | se consulta la bitácora | aparecen las operaciones de documentos, pago, resultados, etapas, emisión y rol |
| CA3 | Solo lectura | un usuario consulta la bitácora | usa la API | solo existe `GET`; no hay endpoints para editar ni borrar |

## Tareas técnicas

- [x] Contrato `RegistroAuditoria` (lo usan los casos de uso de Evaluaciones)
- [x] `BitacoraAuditoriaTypeOrm`, que solo inserta y escucha `OPERACION_AUDITABLE`
- [x] Columnas `jsonb` para los valores e índice `(entidad, entidad_id)`

## Endpoints (Swagger: `/api/docs`)

| Método | Ruta | Rol |
|---|---|---|
| GET | `/api/auditoria?entidad=&entidadId=` | ADMINISTRADOR, SUPERVISOR |

## Pruebas que lo comprueban

- `test/flujo-tramite.e2e-spec.ts` (bloque de auditoría y cambio de rol)
