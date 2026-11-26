# EQ-03 · Carga progresiva con k6 (perfil completo de 9 minutos)

**Medida comprometida:** p95 ≤ 1 s hasta 1 000 usuarios; con 2 000 usuarios, p95 ≤ 3 s y errores < 1 %.

## Condiciones de la corrida (26/11/2026)

| Dato | Valor |
|---|---|
| Código | rama `mejora-evidencias-sprint2` sobre `main` en `9682c26` |
| Script | [`tecnologia/pruebas-calidad/k6/carga-progresiva.js`](../../../../tecnologia/pruebas-calidad/k6/carga-progresiva.js) · k6 v0.54.0 |
| Perfil | 0 → 100 (1 min) → 500 (1 min) → 1 000 (2 min) → 2 000 (2 min) → **2 000 sostenidos (2 min)** → 0 (1 min) |
| Comportamiento de cada usuario | Requisitos (pública, con caché) → detalle de **su** expediente → en 20 % de las vueltas, la bandeja del gestor (20 por página), con 1 a 3 s de pausa entre pasos |
| Cuentas | 200 postulantes, cada uno con su expediente (usuarios virtuales repartidos entre ellos) y 1 gestor ([`cuentas-carga.sql`](../../../../tecnologia/pruebas-calidad/k6/cuentas-carga.sql)) |
| Volumen de datos | 30 000 expedientes, 30 000 postulantes, 120 000 documentos, 300 000 filas de auditoría (138 MB; [`01-volumen.sql`](../../../../tecnologia/postgres/analisis/01-volumen.sql)) |
| API | NestJS en un solo proceso Node.js 22, pool de 20 conexiones, caché de requisitos activa |
| Base de datos | PostgreSQL 16, `max_connections` = 100 |
| Hardware | Contenedor Linux con 2 vCPU Intel Xeon 2.30 GHz y 7 GB de RAM. **k6, la API y PostgreSQL corrieron en la misma máquina**, así que el generador de carga compite por la CPU: es un escenario más exigente que el real |

## Resultado por etapa

Peticiones por segundo = peticiones de la etapa ÷ su duración.

| Etapa | Usuarios | Peticiones | Peticiones/s | p95 | p99 | Máximo | Errores | Objetivo | Estado |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 0 → 100 | 1 540 | 25.7 | 6.6 ms | 9.1 ms | 19 ms | 0 % | p95 ≤ 1 s | Cumple |
| 2 | 100 → 500 | 9 187 | 153.1 | 6.6 ms | 12.1 ms | 77 ms | 0 % | p95 ≤ 1 s | Cumple |
| 3 | 500 → 1 000 | 45 192 | 376.6 | 9.0 ms | 19.9 ms | 156 ms | 0 % | p95 ≤ 1 s | Cumple |
| 4 | 1 000 → 2 000 | 90 024 | 750.2 | 34.9 ms | 499.3 ms | 813 ms | 0 % | p95 ≤ 3 s | Cumple |
| 5 | **2 000 sostenidos** | 118 256 | **985.5** | **108.6 ms** | 269.4 ms | 408 ms | **0 %** | p95 ≤ 3 s, errores < 1 % | Cumple |
| 6 | 2 000 → 0 | 31 147 | 519.1 | 32.4 ms | 65.9 ms | 137 ms | 0 % | — | — |
| **Total** | | **295 747** | 528.4 (promedio) | **59.6 ms** | 229.5 ms | 813 ms | **0 %** | | Cumple |

## Resultado por consulta (toda la corrida)

| Consulta | Endpoint | p95 | p99 | Máximo |
|---|---|---|---|---|
| Requisitos (con caché) | `GET /api/requisitos?categoria=` | 38.0 ms | 67.5 ms | 246 ms |
| Detalle del expediente | `GET /api/expedientes/{id}` | 90.4 ms | 301.3 ms | 782 ms |
| Bandeja del gestor | `GET /api/expedientes?etapa=DOCUMENTOS&tamano=20` | 117.3 ms | 330.1 ms | 813 ms |

Comprobaciones: 295 346 de 295 346 respuestas con el código esperado (100 %). 134 123 recorridos completos de usuario.

## Lectura

- El objetivo se cumple con holgura: en el pico sostenido de 2 000 usuarios el p95 es **108.6 ms**, 28 veces por debajo del límite de 3 s, sin errores.
- El tiempo crece cuando se pasa de 1 000 a 2 000 usuarios (p95 de 9 ms a 109 ms) porque las 2 vCPU se reparten entre k6, Node.js y PostgreSQL. En el despliegue, k6 corre desde otra máquina.
- La bandeja es la consulta más pesada: pagina y cuenta sobre 30 000 expedientes. Usa el índice `ix_expedientes_etapa_creado` ([análisis de la base de datos](../../analisis-base-de-datos.md)).
- Los requisitos responden desde la caché (ADR-009). La comparación con y sin caché está en la fila EQ-03 Caché del [resumen](../../README.md).

## Archivos

| Archivo | Contenido |
|---|---|
| [`carga-progresiva-salida.txt`](carga-progresiva-salida.txt) | Salida completa de k6 (sin las líneas de progreso) |
| [`carga-progresiva-resumen.json`](carga-progresiva-resumen.json) | `--summary-export` con todas las métricas |
| [`corrida-descartada-etapas-desfasadas.txt`](corrida-descartada-etapas-desfasadas.txt) | Primera corrida del mismo día. Se descartó porque las etapas se contaban desde antes del inicio de sesión de las 200 cuentas (unos 15 s), y los totales por etapa quedaban corridos. También cumplió (p95 de 236.6 ms en el pico, 0 % de errores) |

**Diferencia con la medición preliminar (19/11):** aquella duró 2 min 45 s, usó 1 sola cuenta y 1 expediente, y no tenía el volumen de 30 000 expedientes. Esta es la medición del perfil completo.

## Cómo repetirla

```bash
psql -U licencias -d <base> -f tecnologia/postgres/analisis/01-volumen.sql
psql -U licencias -d <base> -f tecnologia/pruebas-calidad/k6/cuentas-carga.sql
cd tecnologia
k6 run -e BASE=http://localhost:3000/api --summary-export=resumen.json pruebas-calidad/k6/carga-progresiva.js
```
