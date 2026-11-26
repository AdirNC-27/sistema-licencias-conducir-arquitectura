#!/usr/bin/env bash
# EQ-04 · Prueba de respaldo y restauración de PostgreSQL (meta: restauración completa ≤ 30 min).
# No toca la base original: restaura en <base>_restaurada y compara las filas tabla por tabla.
# Uso: DUENO=licencias probar-restauracion.sh <base> [carpeta-del-respaldo]
#      DUENO es el usuario de la API: la base restaurada queda a su nombre para que la API pueda usarla.
set -euo pipefail
BASE="${1:?Indique la base, por ejemplo: licencias}"
DIR="${2:-$(mktemp -d)}"
COPIA="${BASE}_restaurada"
DUENO="${DUENO:-$(whoami)}"
ARCHIVO="$DIR/${BASE}-$(date +%Y%m%d-%H%M).dump"
psql_() { psql -X -v ON_ERROR_STOP=1 "$@"; }
segundos() { date +%s.%N; }
contar() { psql_ -d "$1" -tAc "ANALYZE" >/dev/null; psql_ -d "$1" -tAc "SELECT string_agg(t, ' ' ORDER BY t) FROM (SELECT format('%s=%s', table_name, (xpath('/row/c/text()', query_to_xml(format('SELECT count(*) AS c FROM %I', table_name), false, true, '')))[1]::text) t FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') x"; }

echo "# EQ-04 · Respaldo y restauración · $(date '+%Y-%m-%d %H:%M %z') · $(psql_ -d "$BASE" -tAc 'SELECT version()' | cut -d' ' -f1-2)"
echo "Base: $BASE ($(psql_ -d "$BASE" -tAc "SELECT pg_size_pretty(pg_database_size('$BASE'))"))"

echo "## 1. Respaldo (pg_dump, formato personalizado)"
t0=$(segundos); pg_dump -Fc -d "$BASE" -f "$ARCHIVO"; t1=$(segundos)
printf 'Archivo: %s (%s) · %.1f s\n' "$(basename "$ARCHIVO")" "$(du -h "$ARCHIVO" | cut -f1)" "$(awk -v a="$t0" -v b="$t1" 'BEGIN{print b-a}')"

echo "## 2. Verificación del respaldo antes de usarlo"
pg_restore --list "$ARCHIVO" > /dev/null && echo "El respaldo se puede leer: $(pg_restore --list "$ARCHIVO" | grep -c 'TABLE DATA') tablas con datos"

echo "## 3. Restauración en una base nueva ($COPIA)"
psql_ -d postgres -qc "DROP DATABASE IF EXISTS $COPIA" -c "CREATE DATABASE $COPIA OWNER $DUENO"
t2=$(segundos); pg_restore -d "$COPIA" --no-owner --role="$DUENO" -j 2 "$ARCHIVO"; t3=$(segundos)
TIEMPO=$(awk -v a="$t2" -v b="$t3" 'BEGIN{print b-a}')
printf 'Restauración: %.1f s\n' "$TIEMPO"

echo "## 4. Comparación de filas por tabla"
ORIGINAL=$(contar "$BASE"); RESTAURADA=$(contar "$COPIA")
echo "Original:   $ORIGINAL"
echo "Restaurada: $RESTAURADA"
if [ "$ORIGINAL" = "$RESTAURADA" ]; then echo "Resultado: las $(echo "$ORIGINAL" | wc -w) tablas tienen las mismas filas"; else echo "Resultado: HAY DIFERENCIAS"; exit 1; fi
awk -v t="$TIEMPO" 'BEGIN { if (t <= 1800) printf "Meta ≤ 30 min: cumple (%.1f s)\n", t; else { printf "Meta ≤ 30 min: NO cumple (%.1f s)\n", t; exit 1 } }'
