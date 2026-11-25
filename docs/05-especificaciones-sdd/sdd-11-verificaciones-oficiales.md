# SDD-11 · Verificación en el SNC y en el récord de sanciones

| Requisitos | Relación con la arquitectura | Estado |
|---|---|---|
| RF24, RF27 | DA08 · ADR-007 | Implementado (sprint 2) |

## Historia

Como **gestor de trámites** quiero confirmar en los portales del MTC que el certificado médico y la constancia COFIPRO están registrados en el SNC y que el postulante de la II-C no tiene multas ni sanciones pendientes, y dejar constancia en el sistema (HU29, HU32). Al final, quiero registrar el número de la licencia emitida para cargarla en el SNC.

El SNC y el récord del conductor no tienen API pública: el gestor consulta el portal y registra lo que vio. Una integración futura por la PIDE solo agregaría un adaptador que registre el mismo resultado.

## Criterios de aceptación

| # | Escenario | Dado | Cuando | Entonces |
|---|---|---|---|---|
| CA1 | Verificaciones por categoría | el expediente es II-B | se consulta la revisión | solo se exige el certificado en el SNC; la II-C exige además COFIPRO y sanciones |
| CA2 | No conforme sin detalle | el gestor marca NO_CONFORME | no escribe qué encontró | recibe 422 |
| CA3 | Sanción pendiente | la última verificación de sanciones es NO_CONFORME | el supervisor intenta emitir | recibe 422 con el motivo (RF27) |
| CA4 | Historial | el gestor vuelve a verificar | registra otra constancia | vale la última y las anteriores quedan como historial |
| CA5 | Licencia para el SNC | el expediente está EMITIDA | el gestor registra el número | queda una sola licencia por expediente, con número único, y se avisa al postulante |
| CA6 | Expediente emitido | el expediente está EMITIDA | el gestor intenta registrar otra verificación | recibe 409 |

## Tareas técnicas

- [x] `verificacionesObligatorias()`, `validarVerificacion()` y `vigentes()` en el dominio
- [x] `normalizarNumeroLicencia()` y restricción única de número y expediente
- [x] Evento `licencia.registrada` → aviso al postulante (Notificaciones)
- [x] Auditoría: `VERIFICAR_PORTAL_OFICIAL` y `REGISTRAR_LICENCIA_SNC`

## Endpoints (Swagger: `/api/docs`)

| Método | Ruta | Rol |
|---|---|---|
| POST | `/api/expedientes/{id}/verificaciones` | GESTOR |
| POST | `/api/expedientes/{id}/licencia` | GESTOR |
| GET | `/api/expedientes/{id}/licencia` | Dueño o personal |

## Pruebas que lo comprueban

- `modulos/revision/__tests__/revision.spec.ts`
- `test/flujo-tramite.e2e-spec.ts` (verificaciones, sanción pendiente y licencia)
- Postman: carpeta 08
