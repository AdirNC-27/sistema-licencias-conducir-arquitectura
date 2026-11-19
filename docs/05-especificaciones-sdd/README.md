# Especificaciones SDD · Sprint 2

Cada funcionalidad se escribió primero como especificación y después se programó (**SDD: Spec-Driven Development**). Cada especificación tiene la historia, los criterios de aceptación en formato Dado / Cuando / Entonces, las tareas técnicas, los endpoints y las pruebas que la comprueban.

## Cómo se trabajó cada funcionalidad

1. Escribir la especificación y sus criterios de aceptación.
2. Programar el dominio y probarlo con Jest.
3. Programar el caso de uso y probarlo con Jest.
4. Exponer el endpoint y documentarlo en Swagger.
5. Probar el endpoint con Supertest sobre PostgreSQL.
6. Hacer commit: GitHub Actions ejecuta las reglas de arquitectura y todas las pruebas.

## Especificaciones

| Código | Funcionalidad | Requisitos | Criterios |
|---|---|---|---|
| [SDD-01](sdd-01-identidad-y-acceso.md) | Identidad y acceso | RF01, RF16 | 5 |
| [SDD-02](sdd-02-registro-del-postulante.md) | Registro del postulante con DNI | RF03, RF04 | 3 |
| [SDD-03](sdd-03-requisitos-con-cache.md) | Requisitos del TUPA con caché | RF22 | 3 |
| [SDD-04](sdd-04-expediente-y-seguimiento.md) | Expediente, etapas y plazo | RF02, RF10, RF12, RF20 | 6 |
| [SDD-05](sdd-05-documentos.md) | Documentos del expediente | RF03, RF04, RF23 | 5 |
| [SDD-06](sdd-06-pagos.md) | Pago en el SAT | RF05, RF06 | 4 |
| [SDD-07](sdd-07-citas-y-cupos.md) | Citas y cupos de examen | RF07, RF21 | 5 |
| [SDD-08](sdd-08-evaluaciones.md) | Evaluaciones: 3 intentos y bloqueo | RF08, RF09, RF19 | 5 |
| [SDD-09](sdd-09-notificaciones.md) | Notificaciones y recordatorios | RF13 | 3 |
| [SDD-10](sdd-10-auditoria.md) | Auditoría de operaciones | RF17 | 3 |

## Flujo que conectan

`Registro (SDD-02)` → `Expediente (SDD-04)` → `Documentos (SDD-05)` → `Pago (SDD-06)` → `Cita (SDD-07)` → `Evaluaciones (SDD-08)` → `Emisión (SDD-04)`, con `Notificaciones (SDD-09)` y `Auditoría (SDD-10)` en cada paso, y `Identidad (SDD-01)` protegiendo todo.

## Fuera de este sprint

| Funcionalidad | Requisitos | Sprint |
|---|---|---|
| Asistente virtual con IA | RF14, RF15 | 3 |
| Revalidación y duplicado | RF25, RF26 | 3 |
| Reportes | RF18 | 3 |
| Verificación de sanciones (II-C) | RF27 | 3 |
