-- Plan de ejecución de las consultas reales de la API (texto tomado de pg_stat_statements).
-- Ejecutar después de 01-volumen.sql:  psql -U licencias -d licencias -f 02-consultas.sql
\pset pager off
\echo '== C1 Bandeja del gestor filtrada por etapa (la más usada) =='
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF) SELECT * FROM expedientes WHERE etapa = 'DOCUMENTOS' ORDER BY creado_en ASC LIMIT 15 OFFSET 0;
\echo '== C2 Conteo de la bandeja por etapa =='
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF) SELECT COUNT(1) FROM expedientes WHERE etapa = 'DOCUMENTOS';
\echo '== C3 Bandeja sin filtro ("Todas"), página 50 =='
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF) SELECT * FROM expedientes ORDER BY creado_en ASC LIMIT 15 OFFSET 735;
\echo '== C4 Conteo de la bandeja sin filtro =='
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF) SELECT COUNT(1) FROM expedientes;
\echo '== C5 Bandeja por etapa y categoría =='
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF) SELECT * FROM expedientes WHERE etapa = 'PAGO' AND categoria = 'II-C' ORDER BY creado_en ASC LIMIT 15;
\echo '== C6 Detalle de un expediente =='
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF) SELECT * FROM expedientes WHERE id = 15000 LIMIT 1;
\echo '== C7 Mis trámites (postulante) =='
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF) SELECT * FROM expedientes WHERE postulante_id = 15000 ORDER BY creado_en DESC;
\echo '== C8 Documentos del expediente (sin leer el archivo) =='
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF) SELECT id, expediente_id, tipo, estado, observacion, fecha_emision, nombre_archivo, tipo_mime FROM documentos WHERE expediente_id = 15000 ORDER BY id;
\echo '== C9 Nombres de la bandeja en una sola consulta (evita N+1) =='
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF) SELECT * FROM postulantes WHERE id IN (10,20,30,40,50,60,70,80,90,100,110,120,130,140,150);
\echo '== C10 Resultados por validar (supervisor) =='
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF) SELECT * FROM evaluaciones WHERE estado = 'REGISTRADO' ORDER BY actualizado_en ASC LIMIT 100;
\echo '== C11 Auditoría filtrada por entidad =='
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF) SELECT * FROM auditoria WHERE entidad = 'evaluacion' ORDER BY id DESC LIMIT 200;
\echo '== C12 Avisos del postulante =='
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF) SELECT * FROM notificaciones WHERE postulante_id = 15000 ORDER BY id DESC LIMIT 50;
\echo '== C13 Login (usuario y DNI únicos) =='
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF) SELECT * FROM postulantes WHERE dni = '70015000';
\echo '== C14 Reserva atómica del cupo (dentro de una transacción que se revierte) =='
BEGIN;
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF) UPDATE cupos SET ocupados = ocupados + 1 WHERE id = 1 AND ocupados < capacidad;
ROLLBACK;
