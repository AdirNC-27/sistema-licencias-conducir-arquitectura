-- Carga de volumen para el análisis de la base de datos (criterio 9).
-- 30 000 expedientes ≈ 3 a 5 años de demanda de licencias clase B en Huamanga.
-- Ejecutar sobre una base migrada:  psql -U licencias -d licencias -f 01-volumen.sql
\timing on
SET client_min_messages = warning;

INSERT INTO postulantes (dni, nombres, apellidos, correo, celular, creado_en)
SELECT lpad((70000000 + g)::text, 8, '0'), 'NOMBRE ' || g, 'APELLIDO ' || g, 'p' || g || '@correo.example',
       '9' || lpad((g % 100000000)::text, 8, '0'), now() - (random() * interval '3 years')
FROM generate_series(1, 30000) g;

-- 85 % ya emitidas; el resto repartido entre las etapas en curso
INSERT INTO expedientes (numero, postulante_id, tipo_tramite, categoria, etapa, creado_en, actualizado_en)
SELECT 'EXP-V-' || lpad(g::text, 6, '0'), p.id, 'EMISION',
       (CASE WHEN g % 3 = 0 THEN 'II-C' ELSE 'II-B' END)::expedientes_categoria_enum,
       (CASE WHEN g % 100 < 85 THEN 'EMITIDA'
             ELSE (ARRAY['DOCUMENTOS','PAGO','CITA','EXAMEN_CONOCIMIENTOS','EXAMEN_MANEJO','EMISION'])[1 + g % 6] END)::expedientes_etapa_enum,
       p.creado_en, p.creado_en + interval '8 days'
FROM generate_series(1, 30000) g JOIN postulantes p ON p.dni = lpad((70000000 + g)::text, 8, '0');

-- 4 documentos por expediente (archivo de 2 KB: el tamaño real no influye porque los listados no leen el bytea)
INSERT INTO documentos (expediente_id, tipo, estado, nombre_archivo, tipo_mime, contenido, fecha_emision, creado_en)
SELECT e.id, t.tipo::documentos_tipo_enum,
       (CASE WHEN e.etapa = 'DOCUMENTOS' THEN 'PENDIENTE' ELSE 'APROBADO' END)::documentos_estado_enum,
       'documento.pdf', 'application/pdf', decode(repeat('ab', 2048), 'hex'), e.creado_en::date, e.creado_en
FROM expedientes e
CROSS JOIN (VALUES ('DECLARACION_JURADA'), ('CERTIFICADO_MEDICO'), ('FOTOGRAFIA'), ('CONSTANCIA_COFIPRO')) t(tipo)
WHERE e.numero LIKE 'EXP-V-%';

INSERT INTO pagos (expediente_id, numero_operacion, monto, fecha_pago, estado, creado_en)
SELECT e.id, 'OPV' || e.id, CASE WHEN e.categoria = 'II-C' THEN 69.40 ELSE 69.90 END, e.creado_en::date,
       (CASE WHEN e.etapa = 'PAGO' THEN 'PENDIENTE' ELSE 'VERIFICADO' END)::pagos_estado_enum, e.creado_en
FROM expedientes e WHERE e.numero LIKE 'EXP-V-%' AND e.etapa NOT IN ('DOCUMENTOS');

-- Evaluaciones: validadas en su mayoría; 1 de cada 50 queda registrada esperando al supervisor
INSERT INTO evaluaciones (expediente_id, tipo, estado, resultado, intentos, historial, version, actualizado_en)
SELECT e.id, t.tipo::evaluaciones_tipo_enum,
       (CASE WHEN e.id % 50 = 0 THEN 'REGISTRADO' ELSE 'VALIDADO' END)::evaluaciones_estado_enum,
       '{"puntaje": 16, "aprobado": true}'::jsonb, 1, '[{"numero": 1, "puntaje": 16, "aprobado": true}]'::jsonb, 1,
       e.creado_en + interval '5 days'
FROM expedientes e CROSS JOIN (VALUES ('CONOCIMIENTOS'), ('MANEJO')) t(tipo)
WHERE e.numero LIKE 'EXP-V-%' AND e.etapa IN ('EXAMEN_MANEJO', 'EMISION', 'EMITIDA');

-- Bitácora: 10 registros por expediente (300 000 filas)
INSERT INTO auditoria (usuario_id, accion, entidad, entidad_id, valor_anterior, valor_nuevo, fecha)
SELECT 1 + g % 4, (ARRAY['REVISAR_DOCUMENTO','VERIFICAR_PAGO','REGISTRAR_RESULTADO','VALIDAR_RESULTADO','CAMBIAR_ETAPA'])[1 + g % 5],
       (ARRAY['documento','pago','evaluacion','evaluacion','expediente'])[1 + g % 5], 1 + g % 30000,
       '{"estado": "PENDIENTE"}'::jsonb, '{"estado": "APROBADO"}'::jsonb, now() - (random() * interval '3 years')
FROM generate_series(1, 300000) g;

INSERT INTO notificaciones (postulante_id, asunto, texto, enviado_por_correo, creado_en)
SELECT 1 + g % 30000, 'Tu trámite avanzó', 'Tu expediente pasó a la siguiente etapa.', true, now() - (random() * interval '3 years')
FROM generate_series(1, 150000) g;

ANALYZE postulantes, expedientes, documentos, pagos, evaluaciones, auditoria, notificaciones;
SELECT relname AS tabla, n_live_tup AS filas, pg_size_pretty(pg_total_relation_size(relid)) AS tamano
FROM pg_stat_user_tables ORDER BY n_live_tup DESC;
