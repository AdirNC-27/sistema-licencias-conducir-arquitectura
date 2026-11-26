# SDD-13 · Asistente virtual con la IA de orientación (Lucía)

| Requisitos | Relación con la arquitectura | Estado |
|---|---|---|
| RF14, RF15 · HU11, HU25 | DA07 · RC06 · ADR-007, ADR-009, ADR-015, ADR-016 · EQ-08 | Implementado (sprint 2) |

## Historia

Como **postulante** quiero preguntarle al asistente sobre requisitos, pagos, citas, exámenes y el estado de mi trámite, y recibir una respuesta confiable o la respuesta del gestor si el asistente no sabe (HU11). Como **administrador** quiero mantener el contenido aprobado que usa el asistente (HU25).

Como **gestor, evaluador, supervisor o administrador** quiero ver al entrar lo que tengo pendiente y lo que está por vencer, y preguntar cómo se hace cada paso, para no olvidar tareas que bloquean a otros.

## Lucía

La IA de orientación se presenta como **Lucía**, un chat flotante en la esquina inferior derecha de todas las pantallas, para todos los roles. Al abrirse saluda por el nombre, muestra cuántos pendientes hay y ofrece opciones rápidas según el rol (requisitos II-B y II-C, costo, lugar de pago, cita, exámenes, estado del trámite; en el personal, sus procedimientos).

Antes de buscar contenido, Lucía atiende la charla con frases fijas, sin IA: saludos, «¿cómo estás?», gracias, despedidas, «¿quién eres?» y «ayuda». A un mensaje ofensivo o sin sentido responde con un límite amable y lo que sí puede hacer; no lo deriva al gestor. Si el mensaje empieza con un saludo y trae una pregunta («Hola, ¿cuánto cuesta?»), responde la pregunta y antepone el saludo.

## Cómo decide el asistente

1. **Pide una acción** ("aprueba mi expediente", "cambia mi nota"): se deriva al gestor sin consultar a la IA.
2. **Pregunta por su trámite** ("¿cómo va mi trámite?"): responde con la etapa, el plazo y el siguiente paso de su propio expediente, sin IA.
3. **Pregunta del trámite**: busca en el contenido aprobado. Si encuentra, la IA redacta la respuesta solo con ese contenido; sin IA configurada o si no responde, se entrega el texto aprobado.
4. **No hay contenido aprobado** o la IA indica que no alcanza: se deriva al gestor, que responde desde su bandeja.

La IA recibe la pregunta sin DNI, celulares ni correos, y solo el contenido encontrado. No ve datos del expediente ni puede escribir nada. Si su respuesta afirma haber hecho algo, se descarta.

## Pendientes y asistente por rol

Los pendientes se calculan con los datos del sistema (ADR-016), no con la IA. Aparecen en la pantalla principal de cada rol y en su asistente; los urgentes van primero y cada uno enlaza a la pantalla donde se atiende.

| Rol | Pendientes |
|---|---|
| Gestor | Documentos por revisar, pagos por verificar, expedientes devueltos por el supervisor, verificaciones en el SNC, licencias sin número, consultas sin responder (urgentes si pasan 48 h), plazo legal vencido o por vencer |
| Evaluador | Exámenes rendidos sin resultado, citados hoy, exámenes de los próximos 7 días, resultados que esperan validación |
| Supervisor | Resultados por validar, expedientes listos para emitir, con verificación no conforme o devueltos, plazo legal |
| Administrador | Días sin horarios o con pocos cupos, consultas atrasadas, consultas derivadas que piden contenido nuevo |
| Postulante | Documentos faltantes u observados, certificado médico por vencer, pago por registrar, próxima cita, reintentos, respuestas del gestor |

El asistente del personal responde «¿qué tengo pendiente?» con esa lista y las dudas de procedimiento con el contenido aprobado **para el personal** (18 procedimientos iniciales). El contenido para postulantes y para el personal se separa con el campo `audiencia`: el postulante nunca recibe un procedimiento interno. Un pedido de acción no se ejecuta; se indica dónde hacerlo. La conversación del personal no se guarda.

## Criterios de aceptación

| # | Escenario | Dado | Cuando | Entonces |
|---|---|---|---|---|
| CA1 | Pregunta del trámite | hay contenido aprobado | el postulante pregunta | responde con ese contenido (origen IA o CONTENIDO) |
| CA2 | Estado | el postulante tiene un trámite | pregunta cómo va | responde con su etapa, plazo y siguiente paso (origen ESTADO) |
| CA3 | Pedido de acción | el postulante pide aprobar o cambiar algo | envía la pregunta | se deriva y no se ejecuta nada (0 acciones) |
| CA4 | Fuera de tema | no hay contenido que la responda | pregunta | se deriva al gestor |
| CA5 | Respuesta del gestor | hay una consulta derivada | el gestor responde | el postulante la ve en su chat y recibe un aviso |
| CA6 | Contenido | el administrador desactiva un contenido | se pregunta lo mismo | el asistente ya no lo usa |
| CA7 | IA caída | la IA no responde a tiempo | el postulante pregunta | recibe el texto aprobado |
| CA8 | Pendientes | el gestor tiene pagos por verificar | entra a su bandeja o pregunta qué tiene pendiente | ve «N pagos por verificar en el SAT» con enlace a la bandeja |
| CA9 | Recordatorio | el certificado del postulante vence en 30 días o menos | entra al portal | ve la fecha de vencimiento como urgente |
| CA10 | Procedimiento | el personal pregunta cómo hacer un paso | envía la pregunta | responde con el contenido aprobado para el personal y no ejecuta nada |
| CA11 | Charla | el usuario saluda, agradece o escribe algo ofensivo o sin sentido | envía el mensaje | Lucía responde con una frase fija (origen CONVERSACION) y no lo deriva |

## Tareas técnicas

- [x] Dominio: `clasificar()`, `buscarContenidos()`, `describirEstado()`, `anonimizar()` y `afirmaAccion()`
- [x] Contrato `AsistenteIA` y adaptador `AdaptadorIAGemini` (ADR-015)
- [x] Caché en memoria del contenido activo, se vacía al modificarlo (ADR-009)
- [x] 25 contenidos iniciales del TUPA MPH en la migración
- [x] Auditoría: `RESPONDER_CONSULTA` y `GESTIONAR_CONTENIDO`; evento `asistente.consulta-respondida`
- [x] `pendientesDelPersonal()` y `recordatoriosDelPostulante()` en el dominio; adaptador `LecturaPendientesSql` (ADR-016)
- [x] Campo `audiencia` y 18 procedimientos del personal en la migración `asistente-por-rol`

## Endpoints (Swagger: `/api/docs`)

| Método | Ruta | Rol |
|---|---|---|
| POST | `/api/asistente/consultas` | POSTULANTE |
| GET | `/api/asistente/consultas/mias` | POSTULANTE |
| GET | `/api/asistente/derivadas` | GESTOR |
| PATCH | `/api/asistente/consultas/{id}/respuesta` | GESTOR |
| GET | `/api/asistente/contenidos` | ADMINISTRADOR, GESTOR |
| POST | `/api/asistente/contenidos` | ADMINISTRADOR |
| PUT | `/api/asistente/contenidos/{id}` | ADMINISTRADOR |
| GET | `/api/asistente/pendientes` | Todos los roles |
| POST | `/api/asistente/personal/consultas` | GESTOR, EVALUADOR, SUPERVISOR, ADMINISTRADOR |

## Pruebas que lo comprueban

- `modulos/asistente/__tests__/asistente.spec.ts`, `pendientes.spec.ts`, `conversacion.spec.ts` y `adaptador-ia-gemini.spec.ts`
- `test/flujo-tramite.e2e-spec.ts` (respuesta, estado, derivación, contenido, pendientes y asistente del personal)
- promptfoo (EQ-08): `tecnologia/pruebas-calidad/promptfoo`
