# SDD-09 · Notificaciones y recordatorios

| Requisitos | Relación con la arquitectura | Estado |
|---|---|---|
| RF13 | DA08 · DA10 · ADR-013 | Implementado (sprint 2) |

## Historia

Como **postulante** quiero recibir un correo cuando avanza mi trámite y antes de mi examen, para no postergarlo.

## Criterios de aceptación

| # | Escenario | Dado | Cuando | Entonces |
|---|---|---|---|---|
| CA1 | Recordatorio | el postulante reserva una cita | se emite el evento CITA_RESERVADA | recibe un correo y un aviso en la plataforma |
| CA2 | Cambio de etapa | el expediente avanza | se emite ETAPA_CAMBIADA | recibe el aviso con la nueva etapa |
| CA3 | Correo caído | el servidor SMTP falla o no está configurado | se intenta enviar | el aviso interno se guarda igual y el trámite no se detiene |

## Tareas técnicas

- [x] Contratos `ServicioNotificaciones` y `RepositorioAvisos`
- [x] Adaptador `NotificadorCorreo` con Nodemailer (SMTP)
- [x] `NotificarListener` con `@OnEvent` (patrón Observer)

## Endpoints (Swagger: `/api/docs`)

| Método | Ruta | Rol |
|---|---|---|
| GET | `/api/notificaciones/mias` | POSTULANTE |

## Pruebas que lo comprueban

- `modulos/notificaciones/__tests__/notificaciones.spec.ts`
- `test/flujo-tramite.e2e-spec.ts` (aviso de recordatorio)
