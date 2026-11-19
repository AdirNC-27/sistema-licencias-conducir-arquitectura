# SDD-04 · Expediente, etapas y plazo

| Requisitos | Relación con la arquitectura | Estado |
|---|---|---|
| RF02, RF10, RF12, RF20 | DA04 · EQ-02 | Implementado (sprint 2) |

## Historia

Como **postulante** quiero registrar mi solicitud y ver en qué etapa estoy y cuántos días hábiles quedan, sin ir en persona.

## Criterios de aceptación

| # | Escenario | Dado | Cuando | Entonces |
|---|---|---|---|---|
| CA1 | Crear solicitud | el postulante no tiene un trámite activo | envía `POST /api/expedientes` | recibe el número EXP-2026-xxxxx en la etapa DOCUMENTOS |
| CA2 | Un solo trámite activo | ya tiene un trámite sin terminar | intenta crear otro | recibe 409 |
| CA3 | Etapas en orden | el expediente está en DOCUMENTOS | otro módulo intenta avanzarlo desde PAGO | recibe 409 y la etapa no cambia |
| CA4 | Plazo | el expediente se creó hace 5 días hábiles | se consulta | muestra 5 días transcurridos y 5 restantes |
| CA5 | Privacidad | un postulante consulta el expediente de otro | llama a `GET /api/expedientes/{id}` | recibe 403 |
| CA6 | Emisión | el expediente está en EMISION | el supervisor autoriza | pasa a EMITIDA y queda en auditoría |

## Tareas técnicas

- [x] Entidad `Expediente` con `avanzarDesde()`, `exigirEtapa()` y `verificarAcceso()`
- [x] Función pura `calcularPlazo()` de días hábiles
- [x] Fachada `ExpedientesApi` (patrón Facade): lo único que usan los demás módulos
- [x] Eventos `ETAPA_CAMBIADA` y `OPERACION_AUDITABLE` (patrón Observer)
- [x] Índice `(etapa, creado_en)` para la bandeja

## Endpoints (Swagger: `/api/docs`)

| Método | Ruta | Rol |
|---|---|---|
| POST | `/api/expedientes` | POSTULANTE |
| GET | `/api/expedientes/mios` | POSTULANTE |
| GET | `/api/expedientes?etapa=&categoria=&pagina=` | Personal |
| GET | `/api/expedientes/{id}` | Dueño o personal |
| PATCH | `/api/expedientes/{id}/emision` | SUPERVISOR |

## Pruebas que lo comprueban

- `modulos/expedientes/__tests__/expediente.spec.ts`
- `test/flujo-tramite.e2e-spec.ts` (creación, privacidad y emisión)
