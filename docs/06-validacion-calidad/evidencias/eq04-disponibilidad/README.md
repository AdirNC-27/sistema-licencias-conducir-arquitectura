# EQ-04 · Disponibilidad y recuperación

**Medida comprometida:** 99 % o más de disponibilidad en horario de atención durante 2 semanas de monitoreo; reinicio automático en 2 minutos o menos; restauración completa en 30 minutos o menos, con una pérdida máxima de 24 horas de datos.

Las 2 semanas de monitoreo y el reinicio en el servidor necesitan el sistema desplegado, por eso esas mediciones quedan para el **Sprint 3**. Lo que no depende del despliegue ya está medido.

## Estado por medida

| Medida | Meta | Estado | Evidencia |
|---|---|---|---|
| Restauración completa de la base de datos | ≤ 30 min | **Medido (26/11): 2.3 s** con 30 000 expedientes (138 MB); las 17 tablas con las mismas filas y la API funcionando sobre la copia | [restauracion-base-de-datos.txt](restauracion-base-de-datos.txt) |
| Pérdida máxima de datos | ≤ 24 h | Diseñado: respaldo diario con `pg_dump`. Se activa al desplegar | Sprint 3: tarea programada en el servidor y lista de respaldos |
| Reinicio automático | ≤ 2 min | Configurado: `restart: unless-stopped` en los 3 contenedores y `HEALTHCHECK` sobre `/api/health` ([docker-compose.yml](../../../../tecnologia/docker-compose.yml), [Dockerfile](../../../../tecnologia/backend/Dockerfile)). Falta medir el tiempo | Sprint 3: registro de `docker events` al detener el proceso de la API, con la hora de caída y la de `/api/health` de nuevo en 200 |
| Disponibilidad en horario de atención | ≥ 99 % en 2 semanas | `/api/health` listo: responde el estado de la API y de PostgreSQL (`@nestjs/terminus`) | Sprint 3: reporte de UptimeRobot (chequeo cada 5 minutos, de lunes a viernes de 8:00 a 17:00) |

## Prueba de restauración

Script: [`tecnologia/postgres/respaldo/probar-restauracion.sh`](../../../../tecnologia/postgres/respaldo/probar-restauracion.sh).

1. Saca el respaldo con `pg_dump` en formato personalizado.
2. **Comprueba que el respaldo se puede leer antes de usarlo.**
3. Lo restaura en una base nueva (`<base>_restaurada`), así nunca toca la original.
4. Compara las filas de todas las tablas y falla si hay una diferencia o si se pasa de 30 minutos.

Después se levantó la API apuntando a la copia: `/api/health` respondió `up`, un postulante inició sesión y vio su expediente.

| Paso | Tiempo |
|---|---|
| Respaldo (`pg_dump -Fc`, 12 MB) | 1.3 s |
| Restauración (`pg_restore`, 2 procesos) | 2.3 s |

Entorno: PostgreSQL 16, contenedor Linux con 2 vCPU y 7 GB de RAM, con el mismo volumen de datos que la prueba de carga ([k6](../k6/README.md)).

**Lo que encontró la prueba:** en el primer intento la base restaurada quedó a nombre del administrador de PostgreSQL y la API no pudo usarla (`permission denied for schema public`). El script ahora restaura a nombre del usuario de la API (`DUENO=licencias`). También se agregó la verificación del respaldo antes de restaurar: si `pg_dump` falla, el script se detiene y no se continúa con un respaldo vacío.

## Uso en el servidor (Sprint 3)

```bash
DUENO=licencias ./probar-restauracion.sh licencias /var/respaldos
```
