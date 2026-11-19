# SDD-07 · Citas y cupos de examen

| Requisitos | Relación con la arquitectura | Estado |
|---|---|---|
| RF07, RF21 | DA04 · EQ-03 | Implementado (sprint 2) |

## Historia

Como **postulante** quiero elegir el día de mi examen entre los cupos disponibles y recibir un recordatorio.

## Criterios de aceptación

| # | Escenario | Dado | Cuando | Entonces |
|---|---|---|---|---|
| CA1 | Días permitidos | el administrador crea un cupo de conocimientos un jueves | envía `POST /api/cupos` | recibe 422: conocimientos es de lunes a miércoles |
| CA2 | Reserva | el expediente está en CITA y hay cupo | reserva | el expediente pasa a EXAMEN_CONOCIMIENTOS y se envía un recordatorio por correo |
| CA3 | Sin cupo | el cupo está lleno | intenta reservar | recibe 409 |
| CA4 | Último cupo a la vez | dos postulantes reservan el último cupo al mismo tiempo | la base de datos procesa ambas | solo una reserva entra; la otra recibe 409 |
| CA5 | Manejo antes de tiempo | no aprobó conocimientos | reserva manejo | recibe 409 |

## Tareas técnicas

- [x] Entidad `Cupo` con `reservar()` y `validarDiaDeExamen()`
- [x] Reserva atómica: `UPDATE ... WHERE ocupados < capacidad` dentro de una transacción
- [x] Restricción `CHECK (ocupados <= capacidad)` e índice único `(fecha, hora, tipo)`
- [x] Evento `CITA_RESERVADA` para el recordatorio

## Endpoints (Swagger: `/api/docs`)

| Método | Ruta | Rol |
|---|---|---|
| POST | `/api/cupos` | ADMINISTRADOR |
| GET | `/api/cupos?tipo=&desde=` | Autenticado |
| POST | `/api/expedientes/{id}/citas` | POSTULANTE |

## Pruebas que lo comprueban

- `modulos/citas/__tests__/citas.spec.ts`
- `test/flujo-tramite.e2e-spec.ts` (reserva y recordatorio)
