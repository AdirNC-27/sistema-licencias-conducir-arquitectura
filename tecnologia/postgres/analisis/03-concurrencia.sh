#!/usr/bin/env bash
# 50 reservas simultáneas sobre un mismo horario de 15 cupos, con el UPDATE condicional que usa la API.
# Uso: PGPASSWORD=licencias ./03-concurrencia.sh <id_cupo>
CUPO=${1:?indique el id del cupo}
CONEXION="psql -h ${DB_HOST:-localhost} -U ${DB_USUARIO:-licencias} -d ${DB_NOMBRE:-licencias} -Atq"
seq 1 50 | xargs -P 50 -I{} $CONEXION -c "UPDATE cupos SET ocupados = ocupados + 1 WHERE id = $CUPO AND ocupados < capacidad RETURNING 'reservado'" > /tmp/reservas.txt
echo "Reservas aceptadas: $(grep -c reservado /tmp/reservas.txt) de 50"
$CONEXION -c "SELECT 'Estado final: ' || ocupados || '/' || capacidad || ' ocupados' FROM cupos WHERE id = $CUPO"
