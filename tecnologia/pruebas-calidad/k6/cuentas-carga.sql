-- Cuentas para la carga de k6 (EQ-03): 200 postulantes del volumen de 30 000 expedientes.
-- Requiere postgres/analisis/01-volumen.sql. Clave de todas: demo123 (solo entorno de prueba).
-- Uso: psql -U licencias -d <base> -f pruebas-calidad/k6/cuentas-carga.sql
INSERT INTO usuarios (usuario, nombre, clave_cifrada, rol, postulante_id)
SELECT p.dni, p.nombres || ' ' || p.apellidos, '$2a$10$mNPMhuBUTq6FXU/yUGQ2Pe5uvJXkSjYk2ZDIumph1xPNC2JOG6EVS', 'POSTULANTE', p.id
FROM postulantes p
WHERE p.dni BETWEEN '70000001' AND '70000200'
ON CONFLICT (usuario) DO NOTHING;
