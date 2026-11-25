# SDD-13 · Asistente virtual con la IA de orientación

| Requisitos | Relación con la arquitectura | Estado |
|---|---|---|
| RF14, RF15 · HU11, HU25 | DA07 · RC06 · ADR-007, ADR-009, ADR-015 · EQ-08 | Implementado (sprint 2) |

## Historia

Como **postulante** quiero preguntarle al asistente sobre requisitos, pagos, citas, exámenes y el estado de mi trámite, y recibir una respuesta confiable o la respuesta del gestor si el asistente no sabe (HU11). Como **administrador** quiero mantener el contenido aprobado que usa el asistente (HU25).

## Cómo decide el asistente

1. **Pide una acción** ("aprueba mi expediente", "cambia mi nota"): se deriva al gestor sin consultar a la IA.
2. **Pregunta por su trámite** ("¿cómo va mi trámite?"): responde con la etapa, el plazo y el siguiente paso de su propio expediente, sin IA.
3. **Pregunta del trámite**: busca en el contenido aprobado. Si encuentra, la IA redacta la respuesta solo con ese contenido; sin IA configurada o si no responde, se entrega el texto aprobado.
4. **No hay contenido aprobado** o la IA indica que no alcanza: se deriva al gestor, que responde desde su bandeja.

La IA recibe la pregunta sin DNI, celulares ni correos, y solo el contenido encontrado. No ve datos del expediente ni puede escribir nada. Si su respuesta afirma haber hecho algo, se descarta.

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

## Tareas técnicas

- [x] Dominio: `clasificar()`, `buscarContenidos()`, `describirEstado()`, `anonimizar()` y `afirmaAccion()`
- [x] Contrato `AsistenteIA` y adaptador `AdaptadorIAGemini` (ADR-015)
- [x] Caché en memoria del contenido activo, se vacía al modificarlo (ADR-009)
- [x] 25 contenidos iniciales del TUPA MPH en la migración
- [x] Auditoría: `RESPONDER_CONSULTA` y `GESTIONAR_CONTENIDO`; evento `asistente.consulta-respondida`

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

## Pruebas que lo comprueban

- `modulos/asistente/__tests__/asistente.spec.ts` y `adaptador-ia-gemini.spec.ts`
- `test/flujo-tramite.e2e-spec.ts` (respuesta, estado, derivación y contenido)
- promptfoo (EQ-08): `tecnologia/pruebas-calidad/promptfoo`
