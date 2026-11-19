# SDD-03 · Requisitos del TUPA con caché

| Requisitos | Relación con la arquitectura | Estado |
|---|---|---|
| RF22 | DA09 · ADR-009 · EQ-03 | Implementado (sprint 2) |

## Historia

Como **ciudadano** quiero ver los requisitos según mi categoría (II-B o II-C) antes de iniciar el trámite.

## Criterios de aceptación

| # | Escenario | Dado | Cuando | Entonces |
|---|---|---|---|---|
| CA1 | Requisitos de mototaxi | se consulta la categoría II-C | llama a `GET /api/requisitos?categoria=II-C` | recibe la tasa S/ 69.40 y la constancia COFIPRO entre los requisitos |
| CA2 | Caché | la consulta ya se hizo una vez | se repite dentro de 10 minutos | se responde desde la memoria sin consultar PostgreSQL |
| CA3 | Sin caché para comparar | la API inicia con `CACHE_REQUISITOS=false` | se ejecuta k6 | se mide la diferencia de tiempos (EQ-03) |

## Tareas técnicas

- [x] Tabla `requisitos` con los datos del TUPA en la migración inicial
- [x] `RepositorioRequisitosTypeOrm`
- [x] `RepositorioRequisitosCacheado` (patrón Decorator) con `@nestjs/cache-manager` y TTL de 10 minutos
- [x] Bandera `CACHE_REQUISITOS` para la comparación

## Endpoints (Swagger: `/api/docs`)

| Método | Ruta | Rol |
|---|---|---|
| GET | `/api/requisitos?tramite=&categoria=` | Público |

## Pruebas que lo comprueban

- `test/flujo-tramite.e2e-spec.ts` (requisitos públicos)
- `tecnologia/pruebas-calidad/k6/cache-requisitos.js`
