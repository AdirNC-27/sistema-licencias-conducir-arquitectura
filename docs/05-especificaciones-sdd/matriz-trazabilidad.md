# Matriz de trazabilidad de las especificaciones SDD

> Generada por `tecnologia/pruebas-calidad/trazabilidad/generar-matriz.mjs` a partir de los criterios de cada especificación y de los reportes de las pruebas ejecutadas. No se edita a mano: la relación criterio → prueba está en `matriz-sdd.json`.

| Dato | Valor |
|---|---|
| Commit evaluado | `9682c26 + rama mejora-evidencias-sprint2` |
| Fecha de ejecución | 2026-11-26 |
| Criterios de aceptación | 65 en 13 especificaciones |
| Criterios con al menos una prueba ejecutada que pasa | **64 de 65** |
| Pruebas unitarias (Jest) | 192 de 192 pasan |
| Pruebas de la API con PostgreSQL (Jest + Supertest) | 39 de 39 pasan |
| Pruebas del portal (Playwright) | 21 de 21 pasan |

Leyenda: ✅ la prueba se ejecutó y pasó · ❌ falla o no se encontró · 📄 respaldado por una evidencia medida (k6, concurrencia, promptfoo), no por una prueba automática.

## [SDD-01 · Identidad y acceso](sdd-01-identidad-y-acceso.md)

| Criterio | Escenario y resultado esperado | Regla o endpoint | Pruebas | Resultado |
|---|---|---|---|---|
| CA1 | Inicio de sesión correcto: recibe 200 con un token JWT que incluye el rol GESTOR | `POST /auth/login` | Jest `modulos/identidad/__tests__/identidad.spec.ts`: «inicia sesión y el rol sale de la cuenta» ✅<br>Playwright `e2e/flujo-tramite.spec.ts`: «el login rechaza una clave incorrecta» ✅ | ✅ Cumple |
| CA2 | Clave incorrecta: recibe 401 y ningún token | `POST /auth/login` | Jest `modulos/identidad/__tests__/identidad.spec.ts`: «rechaza clave incorrecta o usuario inexistente» ✅<br>Supertest `test/flujo-tramite.e2e-spec.ts`: «credenciales incorrectas responden 401» ✅ | ✅ Cumple |
| CA3 | Rol sin permiso: recibe 403 y no cambia nada | `PATCH /expedientes/{id}/emision · GuardaRoles + @Roles` | Supertest `test/flujo-tramite.e2e-spec.ts`: «evaluador no puede patch /api/expedientes/1/emision (403)» ✅<br>Supertest `test/flujo-tramite.e2e-spec.ts`: «evaluador no puede post /api/evaluaciones/1/validacion (403)» ✅ | ✅ Cumple |
| CA4 | Sin token: recibe 401 | `GuardaJwt (APP_GUARD global)` | Supertest `test/flujo-tramite.e2e-spec.ts`: «sin token responde 401» ✅ | ✅ Cumple |
| CA5 | Cambio de rol auditado: el rol cambia y queda un registro CAMBIAR_ROL en auditoría | `PATCH /usuarios/{id}/rol` | Jest `modulos/identidad/__tests__/identidad.spec.ts`: «el administrador cambia el rol del personal y queda auditado» ✅<br>Supertest `test/flujo-tramite.e2e-spec.ts`: «el administrador cambia un rol y queda auditado; el endpoint de salud responde» ✅ | ✅ Cumple |

## [SDD-02 · Registro del postulante con DNI](sdd-02-registro-del-postulante.md)

| Criterio | Escenario y resultado esperado | Regla o endpoint | Pruebas | Resultado |
|---|---|---|---|---|
| CA1 | Registro correcto: se crea el postulante con los nombres de API Perú y una cuenta con rol POSTULANTE | `POST /postulantes · ConsultaDni (API Perú)` | Jest `modulos/postulantes/__tests__/postulantes.spec.ts`: «crea el postulante con los nombres de API Perú y una cuenta con rol POSTULANTE» ✅<br>Supertest `test/flujo-tramite.e2e-spec.ts`: «registra un postulante nuevo con DNI (RF03, RF04)» ✅ | ✅ Cumple |
| CA2 | DNI repetido: recibe 409 | `POST /postulantes` | Jest `modulos/postulantes/__tests__/postulantes.spec.ts`: «no permite dos cuentas con el mismo DNI» ✅<br>Supertest `test/flujo-tramite.e2e-spec.ts`: «registra un postulante nuevo con DNI (RF03, RF04)» ✅ | ✅ Cumple |
| CA3 | DNI inválido: recibe 400 y no se consulta API Perú | `Dni (postulantes/dominio/postulante.ts)` | Jest `modulos/postulantes/__tests__/postulantes.spec.ts`: «valida el formato del DNI» ✅ | ✅ Cumple |

## [SDD-03 · Requisitos del TUPA con caché](sdd-03-requisitos-con-cache.md)

| Criterio | Escenario y resultado esperado | Regla o endpoint | Pruebas | Resultado |
|---|---|---|---|---|
| CA1 | Requisitos de mototaxi: recibe la tasa S/ 69.40 y la constancia COFIPRO entre los requisitos | `GET /requisitos` | Supertest `test/flujo-tramite.e2e-spec.ts`: «requisitos públicos con caché (RF22)» ✅ | ✅ Cumple |
| CA2 | Caché: se responde desde la memoria sin consultar PostgreSQL | `RepositorioRequisitosCacheado (Decorator)` | Jest `modulos/requisitos/__tests__/requisitos-cache.spec.ts`: «consulta PostgreSQL una sola vez y repite la respuesta desde la memoria por 10 minutos» ✅<br>Jest `modulos/requisitos/__tests__/requisitos-cache.spec.ts`: «cada categoría tiene su propia entrada en la caché» ✅ | ✅ Cumple |
| CA3 | Sin caché para comparar: se mide la diferencia de tiempos (EQ-03) | `CACHE_REQUISITOS=false` | Evidencia: [k6 cache-requisitos.js: p95 de 167.6 ms a 81.7 ms con caché (fila EQ-03 Caché)](../../docs/06-validacion-calidad/README.md) | 📄 Solo evidencia |

## [SDD-04 · Expediente, etapas y plazo](sdd-04-expediente-y-seguimiento.md)

| Criterio | Escenario y resultado esperado | Regla o endpoint | Pruebas | Resultado |
|---|---|---|---|---|
| CA1 | Crear solicitud: recibe el número EXP-2026-xxxxx en la etapa DOCUMENTOS | `POST /expedientes` | Jest `modulos/expedientes/__tests__/expediente.spec.ts`: «crea una solicitud de emisión en etapa DOCUMENTOS (RF02)» ✅<br>Supertest `test/flujo-tramite.e2e-spec.ts`: «el postulante crea su expediente II-C (RF02)» ✅ | ✅ Cumple |
| CA2 | Un solo trámite activo: recibe 409 | `POST /expedientes` | Jest `modulos/expedientes/__tests__/expediente.spec.ts`: «rechaza un segundo trámite activo, otro tipo de trámite o un usuario que no es postulante» ✅<br>Supertest `test/flujo-tramite.e2e-spec.ts`: «el postulante crea su expediente II-C (RF02)» ✅ | ✅ Cumple |
| CA3 | Etapas en orden: recibe 409 y la etapa no cambia | `Expediente.avanzarDesde / exigirEtapa` | Jest `modulos/expedientes/__tests__/expediente.spec.ts`: «avanza solo desde la etapa esperada» ✅<br>Jest `modulos/expedientes/__tests__/expediente.spec.ts`: «no permite saltarse una etapa» ✅<br>Jest `modulos/expedientes/__tests__/expediente.spec.ts`: «exigirEtapa rechaza operaciones fuera de etapa» ✅ | ✅ Cumple |
| CA4 | Plazo: muestra 5 días transcurridos y 5 restantes | `calcularPlazo / diasHabilesEntre` | Jest `modulos/expedientes/__tests__/expediente.spec.ts`: «cuenta solo de lunes a viernes» ✅<br>Jest `modulos/expedientes/__tests__/expediente.spec.ts`: «marca vencido después de 10 días hábiles» ✅ | ✅ Cumple |
| CA5 | Privacidad: recibe 403 | `GET /expedientes/{id} · dueño o personal` | Jest `modulos/expedientes/__tests__/expediente.spec.ts`: «el dueño y el personal pueden verlo; otro postulante no» ✅<br>Supertest `test/flujo-tramite.e2e-spec.ts`: «privacidad: otro postulante no ve el expediente ni sus documentos (EQ-02)» ✅ | ✅ Cumple |
| CA6 | Emisión: pasa a EMITIDA y queda en auditoría | `PATCH /expedientes/{id}/emision` | Jest `modulos/revision/__tests__/revision.spec.ts`: «no autoriza la emisión sin verificaciones; con todo conforme, autoriza y audita» ✅<br>Supertest `test/flujo-tramite.e2e-spec.ts`: «el supervisor observa el expediente, el gestor lo atiende y recién se emite (RF11, RF12)» ✅ | ✅ Cumple |

## [SDD-05 · Documentos del expediente](sdd-05-documentos.md)

| Criterio | Escenario y resultado esperado | Regla o endpoint | Pruebas | Resultado |
|---|---|---|---|---|
| CA1 | Subir documento: queda PENDIENTE | `POST /expedientes/{id}/documentos` | Supertest `test/flujo-tramite.e2e-spec.ts`: «sube los 4 documentos y el gestor los aprueba: pasa a PAGO (RF03, RF04)» ✅<br>Playwright `e2e/flujo-tramite.spec.ts`: «el postulante inicia el trámite y adjunta sus documentos» ✅ | ✅ Cumple |
| CA2 | Archivo no permitido: recibe 422 | `SubirDocumentoUseCase · tipo y 2 MB` | Jest `modulos/documentos/__tests__/documentos.spec.ts`: «valida tipo de archivo, tamaño, categoría, fecha del certificado y duplicados» ✅ | ✅ Cumple |
| CA3 | Certificado vencido: recibe 422 | `Documento.revisar · 6 meses (RF23)` | Jest `modulos/documentos/__tests__/documentos.spec.ts`: «el certificado médico vence a los 6 meses (RF23)» ✅<br>Jest `modulos/documentos/__tests__/documentos.spec.ts`: «no aprueba un certificado vencido; observar exige motivo; un aprobado no cambia» ✅ | ✅ Cumple |
| CA4 | Expediente completo: el expediente pasa a PAGO | `documentosObligatorios(categoria)` | Jest `modulos/documentos/__tests__/documentos.spec.ts`: «con todos los documentos aprobados el expediente pasa a PAGO» ✅<br>Jest `modulos/documentos/__tests__/documentos.spec.ts`: «la II-C exige además la constancia COFIPRO» ✅<br>Supertest `test/flujo-tramite.e2e-spec.ts`: «sube los 4 documentos y el gestor los aprueba: pasa a PAGO (RF03, RF04)» ✅ | ✅ Cumple |
| CA5 | Archivo privado: recibe 403; sin token, 401 | `GET /documentos/{id}/archivo · dueño o personal` | Supertest `test/flujo-tramite.e2e-spec.ts`: «sube los 4 documentos y el gestor los aprueba: pasa a PAGO (RF03, RF04)» ✅ | ✅ Cumple |

## [SDD-06 · Pago en el SAT](sdd-06-pagos.md)

| Criterio | Escenario y resultado esperado | Regla o endpoint | Pruebas | Resultado |
|---|---|---|---|---|
| CA1 | Monto incorrecto: recibe 422 (la tasa es S/ 69.40) | `Pago.validarRegistro · TASA_EMISION` | Jest `modulos/pagos/__tests__/pagos.spec.ts`: «exige la tasa exacta de la categoría» ✅<br>Supertest `test/flujo-tramite.e2e-spec.ts`: «registra el pago con la tasa exacta y el gestor lo verifica: pasa a CITA (RF05, RF06)» ✅ | ✅ Cumple |
| CA2 | Operación repetida: recibe 409 | `POST /expedientes/{id}/pagos` | Jest `modulos/pagos/__tests__/pagos.spec.ts`: «rechaza operación repetida y un segundo pago pendiente» ✅ | ✅ Cumple |
| CA3 | Verificación: el expediente pasa a CITA y queda en auditoría | `PATCH /pagos/{id}/verificacion` | Jest `modulos/pagos/__tests__/pagos.spec.ts`: «registra, verifica y avanza el expediente a CITA» ✅<br>Supertest `test/flujo-tramite.e2e-spec.ts`: «registra el pago con la tasa exacta y el gestor lo verifica: pasa a CITA (RF05, RF06)» ✅<br>Supertest `test/flujo-tramite.e2e-spec.ts`: «las operaciones importantes quedan en auditoría con usuario, fecha y valores (EQ-07)» ✅ | ✅ Cumple |
| CA4 | Pago verificado bloqueado: recibe 409 | `Pago.verificar` | Jest `modulos/pagos/__tests__/pagos.spec.ts`: «un pago verificado no cambia y observar exige motivo» ✅ | ✅ Cumple |

## [SDD-07 · Citas y cupos de examen](sdd-07-citas-y-cupos.md)

| Criterio | Escenario y resultado esperado | Regla o endpoint | Pruebas | Resultado |
|---|---|---|---|---|
| CA1 | Días permitidos: recibe 422: conocimientos es de lunes a miércoles | `POST /cupos · validarDiaDeExamen` | Jest `modulos/citas/__tests__/citas.spec.ts`: «conocimientos solo de lunes a miércoles; manejo de martes a viernes» ✅ | ✅ Cumple |
| CA2 | Reserva: el expediente pasa a EXAMEN_CONOCIMIENTOS y se envía un recordatorio por correo | `POST /expedientes/{id}/citas · evento CITA_RESERVADA` | Jest `modulos/citas/__tests__/citas.spec.ts`: «reserva conocimientos, avanza a EXAMEN_CONOCIMIENTOS y emite el recordatorio» ✅<br>Supertest `test/flujo-tramite.e2e-spec.ts`: «reserva la cita de conocimientos con cupo: pasa a EXAMEN_CONOCIMIENTOS (RF07, RF21)» ✅ | ✅ Cumple |
| CA3 | Sin cupo: recibe 409 | `Cupo.reservar` | Jest `modulos/citas/__tests__/citas.spec.ts`: «no reserva sin cupos ni en fechas pasadas» ✅ | ✅ Cumple |
| CA4 | Último cupo a la vez: solo una reserva entra; la otra recibe 409 | `UPDATE cupos … WHERE ocupados < capacidad (reserva atómica)` | Jest `modulos/citas/__tests__/citas.spec.ts`: «no permite manejo antes de aprobar conocimientos, ni dos citas futuras, ni perder la carrera por el último cupo» ✅<br>Evidencia: [50 reservas simultáneas: entran 15 de 15 cupos, el resto 409](../../docs/06-validacion-calidad/evidencias/base-de-datos/03-concurrencia-cupos.txt) | ✅ Cumple |
| CA5 | Manejo antes de tiempo: recibe 409 | `ReservarCitaUseCase · orden de exámenes` | Jest `modulos/citas/__tests__/citas.spec.ts`: «no permite manejo antes de aprobar conocimientos, ni dos citas futuras, ni perder la carrera por el último cupo» ✅ | ✅ Cumple |

## [SDD-08 · Evaluaciones: 3 intentos y bloqueo](sdd-08-evaluaciones.md)

| Criterio | Escenario y resultado esperado | Regla o endpoint | Pruebas | Resultado |
|---|---|---|---|---|
| CA1 | Registrar intento: queda REGISTRADO, intento 1 de 3 | `Evaluacion.registrar` | Jest `modulos/evaluaciones/__tests__/evaluacion.spec.ts`: «registra el primer intento y queda REGISTRADO» ✅ | ✅ Cumple |
| CA2 | Corregir antes de validar: cambia sin consumir intento y queda en auditoría | `PATCH /evaluaciones/{id}/resultado` | Jest `modulos/evaluaciones/__tests__/evaluacion.spec.ts`: «permite corregir antes de validar sin consumir intento (RF09)» ✅<br>Jest `modulos/evaluaciones/__tests__/casos-de-uso.spec.ts`: «corrige antes de validar y lo deja en auditoría con motivo» ✅ | ✅ Cumple |
| CA3 | Bloqueo: recibe 409, el resultado no cambia y el intento queda en auditoría | `Evaluacion.validar / corregir (bloqueo, DA04)` | Jest `modulos/evaluaciones/__tests__/evaluacion.spec.ts`: «al validar un aprobado lo bloquea: no se puede corregir ni volver a validar (EQ-09)» ✅<br>Jest `modulos/evaluaciones/__tests__/casos-de-uso.spec.ts`: «rechaza corregir un validado y registra el intento en auditoría (EQ-09)» ✅<br>Supertest `test/flujo-tramite.e2e-spec.ts`: «registra, corrige y valida conocimientos; el resultado validado queda bloqueado (RF08, RF09, EQ-09)» ✅ | ✅ Cumple |
| CA4 | Cuarto intento: recibe 409 (`IntentosAgotadosError`) | `Evaluacion.registrar · IntentosAgotadosError` | Jest `modulos/evaluaciones/__tests__/evaluacion.spec.ts`: «rechaza el cuarto intento (RF08)» ✅ | ✅ Cumple |
| CA5 | Avance: el expediente pasa a la etapa siguiente | `POST /evaluaciones/{id}/validacion` | Jest `modulos/evaluaciones/__tests__/casos-de-uso.spec.ts`: «registra, valida y hace avanzar el expediente a EXAMEN_MANEJO» ✅<br>Supertest `test/flujo-tramite.e2e-spec.ts`: «manejo aprobado y validado lleva a EMISION; sin verificaciones no se autoriza (RF12, RF24)» ✅ | ✅ Cumple |

## [SDD-09 · Notificaciones y recordatorios](sdd-09-notificaciones.md)

| Criterio | Escenario y resultado esperado | Regla o endpoint | Pruebas | Resultado |
|---|---|---|---|---|
| CA1 | Recordatorio: recibe un correo y un aviso en la plataforma | `NotificarListener.alReservarCita (Observer)` | Jest `modulos/notificaciones/__tests__/notificaciones.spec.ts`: «envía el recordatorio de la cita por correo y guarda el aviso» ✅<br>Supertest `test/flujo-tramite.e2e-spec.ts`: «reserva la cita de conocimientos con cupo: pasa a EXAMEN_CONOCIMIENTOS (RF07, RF21)» ✅ | ✅ Cumple |
| CA2 | Cambio de etapa: recibe el aviso con la nueva etapa | `NotificarListener.alCambiarEtapa` | Jest `modulos/notificaciones/__tests__/notificaciones.spec.ts`: «avisa el cambio de etapa aunque el correo falle o no exista el postulante» ✅ | ✅ Cumple |
| CA3 | Correo caído: el aviso interno se guarda igual y el trámite no se detiene | `ServicioNotificaciones (NotificadorCorreo o NotificadorBrevo)` | Jest `modulos/notificaciones/__tests__/notificaciones.spec.ts`: «avisa el cambio de etapa aunque el correo falle o no exista el postulante» ✅<br>Jest `modulos/notificaciones/__tests__/notificador-brevo.spec.ts`: «sin clave no llama a la API y devuelve false (el aviso interno se guarda igual)» ✅<br>Jest `modulos/notificaciones/__tests__/notificador-brevo.spec.ts`: «si Brevo rechaza o no responde, devuelve false sin lanzar error» ✅ | ✅ Cumple |

## [SDD-10 · Auditoría de operaciones](sdd-10-auditoria.md)

| Criterio | Escenario y resultado esperado | Regla o endpoint | Pruebas | Resultado |
|---|---|---|---|---|
| CA1 | Registro: queda una fila con usuario, fecha, acción, valor anterior y nuevo | `GET /auditoria · REGISTRO_AUDITORIA` | Supertest `test/flujo-tramite.e2e-spec.ts`: «las operaciones importantes quedan en auditoría con usuario, fecha y valores (EQ-07)» ✅ | ✅ Cumple |
| CA2 | Las 16 operaciones: aparecen las 16 operaciones auditables (EQ-07): documentos, pago, resultados, etapas, verificaciones, observaciones, emisión, licencia, asistente y rol | `OPERACIONES_AUDITABLES (16)` | Supertest `test/flujo-tramite.e2e-spec.ts`: «las operaciones importantes quedan en auditoría con usuario, fecha y valores (EQ-07)» ✅ | ✅ Cumple |
| CA3 | Solo lectura: solo existe `GET`; no hay endpoints para editar ni borrar | `GET /auditoria (solo lectura)` | Jest `configuracion/__tests__/contrato-openapi.spec.ts`: «la auditoría es de solo lectura: su único endpoint es GET /auditoria (SDD-10 CA3, RF17)» ✅ | ✅ Cumple |

## [SDD-11 · Verificación en el SNC y en el récord de sanciones](sdd-11-verificaciones-oficiales.md)

| Criterio | Escenario y resultado esperado | Regla o endpoint | Pruebas | Resultado |
|---|---|---|---|---|
| CA1 | Verificaciones por categoría: solo se exige el certificado en el SNC; la II-C exige además COFIPRO y sanciones | `verificacionesObligatorias(categoria)` | Jest `modulos/revision/__tests__/revision.spec.ts`: «la II-B solo exige el certificado en el SNC; la II-C agrega COFIPRO y sanciones» ✅ | ✅ Cumple |
| CA2 | No conforme sin detalle: recibe 422 | `POST /expedientes/{id}/verificaciones · validarVerificacion` | Jest `modulos/revision/__tests__/revision.spec.ts`: «rechaza una verificación que no corresponde a la categoría y exige detalle si no es conforme» ✅ | ✅ Cumple |
| CA3 | Sanción pendiente: recibe 422 con el motivo (RF27) | `pendientesDeEmision (RF27)` | Jest `modulos/revision/__tests__/revision.spec.ts`: «una sanción pendiente impide la emisión (RF27)» ✅<br>Supertest `test/flujo-tramite.e2e-spec.ts`: «el gestor verifica en el SNC y en el récord de sanciones; una sanción pendiente bloquea (RF24, RF27)» ✅ | ✅ Cumple |
| CA4 | Historial: vale la última y las anteriores quedan como historial | `vigentes(verificaciones)` | Jest `modulos/revision/__tests__/revision.spec.ts`: «la constancia vigente de cada tipo es la última registrada» ✅ | ✅ Cumple |
| CA5 | Licencia para el SNC: queda una sola licencia por expediente, con número único, y se avisa al postulante | `POST /expedientes/{id}/licencia` | Jest `modulos/revision/__tests__/revision.spec.ts`: «registra la licencia una sola vez, con número único, y avisa al postulante (RF24)» ✅<br>Supertest `test/flujo-tramite.e2e-spec.ts`: «el gestor registra la licencia para el SNC; el postulante la ve y recibe el aviso (RF24)» ✅ | ✅ Cumple |
| CA6 | Expediente emitido: recibe 409 | `Expediente.exigirEtapa(EMISION)` | Supertest `test/flujo-tramite.e2e-spec.ts`: «el gestor registra la licencia para el SNC; el postulante la ve y recibe el aviso (RF24)» ✅ | ✅ Cumple |

## [SDD-12 · Revisión del supervisor y emisión](sdd-12-revision-del-supervisor.md)

| Criterio | Escenario y resultado esperado | Regla o endpoint | Pruebas | Resultado |
|---|---|---|---|---|
| CA1 | Vista completa: ve verificaciones, observaciones, pendientes y si está listo para emitir | `GET /expedientes/{id}/revision` | Jest `modulos/revision/__tests__/revision.spec.ts`: «lista lo pendiente: faltantes, no conformes y observaciones abiertas (RF27: sanciones pendientes bloquean)» ✅<br>Supertest `test/flujo-tramite.e2e-spec.ts`: «manejo aprobado y validado lleva a EMISION; sin verificaciones no se autoriza (RF12, RF24)» ✅ | ✅ Cumple |
| CA2 | Observar: queda una observación ABIERTA y el gestor la ve en su bandeja | `POST /expedientes/{id}/observaciones` | Jest `modulos/revision/__tests__/revision.spec.ts`: «el supervisor observa, la emisión se bloquea y el gestor atiende (RF11)» ✅<br>Supertest `test/flujo-tramite.e2e-spec.ts`: «el supervisor observa el expediente, el gestor lo atiende y recién se emite (RF11, RF12)» ✅<br>Playwright `e2e/flujo-tramite.spec.ts`: «el supervisor revisa, devuelve el expediente y el gestor lo atiende (RF11)» ✅ | ✅ Cumple |
| CA3 | Una sola abierta: recibe 409 | `ObservarExpedienteUseCase · una ABIERTA por expediente` | Jest `modulos/revision/__tests__/revision.spec.ts`: «el supervisor observa, la emisión se bloquea y el gestor atiende (RF11)» ✅<br>Supertest `test/flujo-tramite.e2e-spec.ts`: «el supervisor observa el expediente, el gestor lo atiende y recién se emite (RF11, RF12)» ✅ | ✅ Cumple |
| CA4 | Emisión bloqueada: recibe 422 con la lista de pendientes | `AutorizarEmisionUseCase · pendientesDeEmision` | Jest `modulos/revision/__tests__/revision.spec.ts`: «no autoriza la emisión sin verificaciones; con todo conforme, autoriza y audita» ✅<br>Jest `modulos/revision/__tests__/revision.spec.ts`: «el supervisor observa, la emisión se bloquea y el gestor atiende (RF11)» ✅<br>Supertest `test/flujo-tramite.e2e-spec.ts`: «el supervisor observa el expediente, el gestor lo atiende y recién se emite (RF11, RF12)» ✅ | ✅ Cumple |
| CA5 | Atención: queda ATENDIDA y no se puede atender dos veces (409) | `PATCH /observaciones/{id}/atencion` | Jest `modulos/revision/__tests__/revision.spec.ts`: «exige un motivo y una respuesta claros, y solo se atiende una vez» ✅<br>Supertest `test/flujo-tramite.e2e-spec.ts`: «el supervisor observa el expediente, el gestor lo atiende y recién se emite (RF11, RF12)» ✅ | ✅ Cumple |
| CA6 | Emisión: el expediente pasa a EMITIDA y queda en auditoría | `PATCH /expedientes/{id}/emision` | Supertest `test/flujo-tramite.e2e-spec.ts`: «el supervisor observa el expediente, el gestor lo atiende y recién se emite (RF11, RF12)» ✅<br>Playwright `e2e/flujo-tramite.spec.ts`: «el supervisor autoriza la emisión, el gestor registra la licencia y queda en la auditoría» ✅ | ✅ Cumple |

## [SDD-13 · Asistente virtual con la IA de orientación (Lucía)](sdd-13-asistente-virtual.md)

| Criterio | Escenario y resultado esperado | Regla o endpoint | Pruebas | Resultado |
|---|---|---|---|---|
| CA1 | Pregunta del trámite: responde con ese contenido (origen IA o CONTENIDO) | `POST /asistente/consultas · contenido aprobado` | Jest `modulos/asistente/__tests__/asistente.spec.ts`: «sin IA configurada entrega el contenido aprobado tal cual» ✅<br>Jest `modulos/asistente/__tests__/asistente.spec.ts`: «con IA, envía la pregunta anonimizada y solo el contenido encontrado» ✅<br>Supertest `test/flujo-tramite.e2e-spec.ts`: «responde con contenido aprobado, sin inventar» ✅<br>Evidencia: [promptfoo EQ-08: 20 de 20 preguntas del trámite](../../docs/06-validacion-calidad/evidencias/promptfoo/eq08-ejecucion.txt) | ✅ Cumple |
| CA2 | Estado: responde con su etapa, plazo y siguiente paso (origen ESTADO) | `origen ESTADO` | Jest `modulos/asistente/__tests__/asistente.spec.ts`: «responde el estado con el expediente del propio postulante» ✅<br>Supertest `test/flujo-tramite.e2e-spec.ts`: «responde el estado del propio trámite» ✅ | ✅ Cumple |
| CA3 | Pedido de acción: se deriva y no se ejecuta nada (0 acciones) | `detección de pedidos de acción (0 acciones)` | Jest `modulos/asistente/__tests__/asistente.spec.ts`: «un pedido de acción se deriva sin consultar a la IA (0 acciones)» ✅<br>Supertest `test/flujo-tramite.e2e-spec.ts`: «un pedido de acción se deriva y no cambia nada (0 acciones)» ✅<br>Evidencia: [promptfoo EQ-08: 10 de 10 pedidos derivados](../../docs/06-validacion-calidad/evidencias/promptfoo/eq08-ejecucion.txt) | ✅ Cumple |
| CA4 | Fuera de tema: se deriva al gestor | `derivación al gestor` | Jest `modulos/asistente/__tests__/asistente.spec.ts`: «una pregunta ajena al trámite se deriva» ✅<br>Supertest `test/flujo-tramite.e2e-spec.ts`: «una pregunta ajena al trámite se deriva al gestor, que responde» ✅ | ✅ Cumple |
| CA5 | Respuesta del gestor: el postulante la ve en su chat y recibe un aviso | `PATCH /asistente/consultas/{id}/respuesta` | Jest `modulos/asistente/__tests__/asistente.spec.ts`: «el gestor responde la derivada: se audita y se avisa al postulante» ✅<br>Supertest `test/flujo-tramite.e2e-spec.ts`: «el postulante ve su conversación con la respuesta del gestor; nadie más la ve (EQ-02)» ✅ | ✅ Cumple |
| CA6 | Contenido: el asistente ya no lo usa | `PUT /asistente/contenidos/{id}` | Jest `modulos/asistente/__tests__/asistente.spec.ts`: «el administrador crea, modifica y desactiva contenido; el asistente deja de usarlo» ✅<br>Supertest `test/flujo-tramite.e2e-spec.ts`: «el administrador mantiene el contenido aprobado (HU25)» ✅ | ✅ Cumple |
| CA7 | IA caída: recibe el texto aprobado | `AdaptadorIAGemini · respaldo con el texto aprobado` | Jest `modulos/asistente/__tests__/asistente.spec.ts`: «si la IA falla o afirma haber hecho algo, entrega el contenido aprobado» ✅<br>Jest `modulos/asistente/__tests__/adaptador-ia-gemini.spec.ts`: «si el servicio falla, responde con error o tarda demasiado, devuelve null» ✅ | ✅ Cumple |
| CA8 | Pendientes: ve «N pagos por verificar en el SAT» con enlace a la bandeja | `GET /asistente/pendientes (ADR-016)` | Jest `modulos/asistente/__tests__/pendientes.spec.ts`: «gestor: lo que debe revisar, con singular y plural, y los urgentes primero» ✅<br>Jest `modulos/asistente/__tests__/pendientes.spec.ts`: ««¿qué tengo pendiente?» responde con los datos del sistema, sin la IA» ✅<br>Supertest `test/flujo-tramite.e2e-spec.ts`: «cada rol ve sus pendientes; el postulante, sus recordatorios» ✅<br>Playwright `e2e/flujo-tramite.spec.ts`: «el personal ve sus pendientes y consulta a Lucía» ✅ | ✅ Cumple |
| CA9 | Recordatorio: ve la fecha de vencimiento como urgente | `recordatoriosDelPostulante` | Jest `modulos/asistente/__tests__/pendientes.spec.ts`: «certificado médico por vencer o vencido (6 meses)» ✅ | ✅ Cumple |
| CA10 | Procedimiento: responde con el contenido aprobado para el personal y no ejecuta nada | `POST /asistente/personal/consultas` | Jest `modulos/asistente/__tests__/pendientes.spec.ts`: «responde procedimientos con el contenido del personal y la IA en modo personal» ✅<br>Jest `modulos/asistente/__tests__/pendientes.spec.ts`: «un pedido de acción no se ejecuta: explica dónde hacerlo» ✅<br>Supertest `test/flujo-tramite.e2e-spec.ts`: «la IA de orientación del personal responde pendientes y procedimientos, sin ejecutar nada» ✅ | ✅ Cumple |
| CA11 | Charla: Lucía responde con una frase fija (origen CONVERSACION) y no lo deriva | `analizarCharla / responderCharla` | Jest `modulos/asistente/__tests__/conversacion.spec.ts`: «responde con su nombre, el del usuario y lo que puede hacer según el público» ✅<br>Jest `modulos/asistente/__tests__/conversacion.spec.ts`: «un saludo con pregunta deja la pregunta para el flujo del trámite» ✅<br>Supertest `test/flujo-tramite.e2e-spec.ts`: «Lucía responde la charla sin derivarla y saluda por el nombre» ✅<br>Playwright `e2e/flujo-tramite.spec.ts`: «Lucía saluda, orienta, deriva al gestor y muestra su respuesta (RF14, RF15)» ✅ | ✅ Cumple |

## Fuera de este sprint

RF25 (revalidación), RF26 (duplicado) y RF18 quedan para el Sprint 3, como indica el [índice de especificaciones](README.md); por eso no tienen criterios en esta matriz.
