# Análisis de la base de datos

## Objetivo

Comprobar que PostgreSQL responde bien con el volumen que tendrá el sistema en varios años de uso. Se revisan los índices, la reserva de cupos bajo concurrencia, la caché y el manejo de conexiones. Este análisis responde a la actividad de comportamiento de la BD del Sprint 2 y al criterio 9 (escalabilidad de la base de datos).

## Entorno y volumen

| Elemento | Valor |
|---|---|
| Motor | PostgreSQL 16, una sola base (ADR-005) |
| Pool de conexiones de la API | 20 por instancia (`DB_POOL`) |
| `max_connections` del servidor | 100 |
| Carga de datos | `tecnologia/postgres/analisis/01-volumen.sql` |

| Tabla | Filas | Tamaño |
|---|---|---|
| auditoria | 300 000 | 60 MB |
| notificaciones | 150 000 | 21 MB |
| documentos | 120 000 | 19 MB |
| evaluaciones | 54 000 | 12 MB |
| expedientes | 30 000 | 6 MB |
| postulantes | 30 000 | 5 MB |
| pagos | 29 300 | 4.7 MB |

30 000 expedientes equivalen a entre 3 y 5 años de demanda de licencias clase B en Huamanga.

## Método

1. Se activó `pg_stat_statements` y se usó la API para obtener **el SQL exacto que genera TypeORM**, en lugar de escribir consultas aproximadas.
2. Cada consulta se ejecutó con `EXPLAIN (ANALYZE, BUFFERS)` (`02-consultas.sql`).
3. Solo se agregó un índice cuando el plan recorre toda la tabla y ese costo crece con el volumen.
4. El antes y el después se midieron como la mediana de 20 ejecuciones.

## Resultado por consulta

| # | Consulta (endpoint) | Plan | Tiempo | Decisión |
|---|---|---|---|---|
| C1 | Bandeja por etapa (`GET /expedientes?etapa=`) | Index Scan `ix_expedientes_etapa_creado` | 0.12 ms | Correcto |
| C2 | Conteo de la bandeja por etapa | Index Only Scan | 0.15 ms | Correcto |
| C3 | Bandeja sin filtro, página 50 | Antes: Seq Scan + ordenamiento de 30 000 filas | 5.14 → **0.65 ms** | **Índice nuevo** |
| C4 | Conteo de la bandeja sin filtro | Seq Scan | 3.4 ms | Se acepta (ver nota) |
| C5 | Bandeja por etapa y categoría | Index Scan y filtro de 800 filas | 0.37 ms | Se acepta |
| C6 | Detalle del expediente (`GET /expedientes/:id`) | Index Scan por clave primaria | 0.02 ms | Correcto |
| C7 | Mis trámites (`GET /expedientes/mios`) | Index Scan `postulante_id` | 0.04 ms | Correcto |
| C8 | Documentos del expediente | Index Scan `expediente_id` | 0.04 ms | Correcto. El archivo (`bytea`) no se lee en listados (`select: false`) |
| C9 | Nombres de la bandeja (`GET /postulantes?ids=`) | Index Scan por clave primaria con `ANY` | 0.03 ms | Correcto. Una consulta por página, sin N+1 |
| C10 | Resultados por validar (`GET /evaluaciones/por-validar`) | Antes: Seq Scan, descarta 53 202 filas | 4.27 → **0.25 ms** | **Índice parcial nuevo** |
| C11 | Auditoría por entidad | Index Scan backward por `id` | 0.10 ms | Correcto |
| C12 | Avisos del postulante | Index Scan `postulante_id` | 0.04 ms | Correcto |
| C13 | Inicio de sesión por DNI o usuario | Index Scan único | 0.03 ms | Correcto |
| C14 | Reserva atómica del cupo | `UPDATE … WHERE ocupados < capacidad` | 0.11 ms | Correcto (ver concurrencia) |

**Nota C4.** Contar todas las filas exige leer la tabla completa. Con 30 000 expedientes cuesta 3.4 ms, y solo se ejecuta cuando el gestor elige "Todas". Si la tabla supera el millón de filas, se cambiará por el conteo estimado de `pg_class.reltuples`.

## Índices agregados

Migración `1795092900000-indices-rendimiento.ts`, reflejada también en las entidades de TypeORM. `migration:generate` confirma que no hay diferencias entre el código y la base.

| Índice | Consulta | Antes | Después | Mejora | Tamaño |
|---|---|---|---|---|---|
| `ix_expedientes_creado (creado_en)` | C3 | 5.14 ms | 0.65 ms | 7.9 veces | 672 kB |
| `ix_evaluaciones_por_validar (actualizado_en) WHERE estado = 'REGISTRADO'` | C10 | 4.27 ms | 0.25 ms | 17 veces | 32 kB |

El segundo índice es **parcial**: solo guarda las evaluaciones que esperan validación, así que se mantiene pequeño aunque la tabla crezca.

Evidencia: `evidencias/base-de-datos/01-plan-antes-de-indices.txt` y `02-plan-despues-de-indices.txt`.

## Concurrencia en la reserva de cupos

Dos postulantes no pueden tomar el último cupo a la vez. La reserva es un `UPDATE` condicional dentro de una transacción. PostgreSQL bloquea la fila, y el segundo `UPDATE` vuelve a evaluar la condición con el valor ya actualizado.

| Prueba | Resultado |
|---|---|
| 50 reservas simultáneas sobre un horario de 15 cupos (`03-concurrencia.sh`) | **15 aceptadas, 35 rechazadas**, estado final 15/15 |

Además, la restricción `ck_cupos_ocupados CHECK (ocupados <= capacidad)` impide un sobrecupo aunque falle la aplicación.

## Caché de requisitos (ADR-009)

Durante la prueba de carga con k6, el endpoint de requisitos recibió unas 9 000 peticiones, y `pg_stat_statements` registró **2 consultas** a la tabla `requisitos` (una por categoría). El resto se respondió desde la caché en memoria.

## Carga con el volumen completo

k6 (`carga-progresiva.js`), de 0 a 1 000 usuarios virtuales en 70 s, sobre la base con 30 000 expedientes:

| Métrica | Resultado | Meta (EQ-03) |
|---|---|---|
| p95 de todas las peticiones | 11.3 ms | ≤ 1 s |
| p95 de la bandeja del gestor | 20.1 ms | ≤ 1 s |
| Errores | 0 % (19 888 peticiones) | < 1 % |

Consultas más frecuentes durante la carga (`04-pg-stat-statements-carga.txt`): detalle del expediente, con 9 064 llamadas y 0.03 ms de promedio, y bandeja por etapa, con 1 772 llamadas y 0.08 ms.

## Escalabilidad de la base de datos (criterio 9)

| Situación | Medida |
|---|---|
| Conexiones | Cada instancia de la API abre como máximo 20. Con `max_connections = 100`, admite hasta 4 instancias y deja margen para la administración. Para más instancias se agrega PgBouncer en modo transacción, sin cambiar el código. |
| Más lecturas | Una réplica de solo lectura para la auditoría y los reportes. El monolito sigue con una sola base de escritura (ADR-005). |
| Auditoría | Es la tabla que más crece (10 filas por trámite). Al superar unos 10 millones de filas se particiona por año (`PARTITION BY RANGE (fecha)`). |
| Archivos | Hoy se guardan en `bytea` y no se leen en los listados. Si el volumen de archivos supera unos 20 GB, se mueven a almacenamiento de objetos y la tabla guarda solo la referencia. El cambio queda dentro del adaptador del repositorio. |
| Respaldo | `pg_dump` diario; la meta de restauración es ≤ 30 min (EQ-04) y se medirá en el despliegue del Sprint 3. |

## Cómo reproducir

```bash
cd tecnologia/postgres/analisis
psql -U licencias -d licencias -f 01-volumen.sql     # carga de volumen (una sola vez)
psql -U licencias -d licencias -f 02-consultas.sql   # planes de ejecución
PGPASSWORD=licencias ./03-concurrencia.sh 24         # id de un cupo libre de 15 plazas (Git Bash)
```

`pg_stat_statements` se activa con `shared_preload_libraries = 'pg_stat_statements'` (ya configurado en `docker-compose.yml`).
