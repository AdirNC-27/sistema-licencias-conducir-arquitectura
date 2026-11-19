# Prueba de usabilidad (EQ-05)

## Meta

| Medida | Meta | Herramienta |
|---|---|---|
| Participantes que completan las tareas sin ayuda | 4 de 5 | Hoja de observación |
| Puntaje SUS promedio | ≥ 68 | Cuestionario SUS en Google Forms |
| Accesibilidad | ≥ 90 | Lighthouse (portal) y axe-core en las pantallas con sesión |

La parte automática ya está medida: Lighthouse da **100** de accesibilidad en el portal, y axe-core no encuentra fallas graves WCAG 2.1 AA en las 16 pantallas de los cinco roles (`npm run e2e`). Esta guía cubre la parte con personas.

## Participantes

| # | Perfil | Rol en la prueba |
|---|---|---|
| P1 | 18 a 25 años, usa el celular a diario | Postulante (celular) |
| P2 | 18 a 25 años | Postulante (laptop) |
| P3 | 30 a 50 años, mototaxista o familiar de uno | Postulante (celular) |
| P4 | Poca experiencia con trámites en línea | Postulante (laptop) |
| P5 | Compañero que hace de personal municipal | Gestor (laptop) |

## Preparación

1. API y portal en marcha, con la base recién migrada (`npm run migracion:ejecutar`).
2. `APIPERU_TOKEN` configurado en `.env`, porque la tarea 1 valida el DNI real del participante.
3. Un archivo PDF o JPG de prueba en el equipo (sirve una foto cualquiera).
4. Cronómetro y esta hoja impresa. El facilitador **no** ayuda salvo que el participante lo pida o se detenga más de 1 minuto. En ese caso, la tarea cuenta como "con ayuda".
5. Antes de empezar se lee: *"Probamos el sistema, no a ti. Piensa en voz alta. Puedes dejar la prueba cuando quieras. No guardamos tu DNI fuera de esta base de prueba."*

## Tareas del postulante (P1 a P4)

| # | Tarea que se lee al participante | Se cumple cuando | Tiempo máximo |
|---|---|---|---|
| T1 | "Crea tu cuenta con tu DNI." | Entra a su pantalla de inicio | 3 min |
| T2 | "Inicia el trámite de licencia para moto y dime cuánto cuesta y dónde se paga." | Responde S/ 69.90 y el SAT (módulo 11 del MAC) | 2 min |
| T3 | "Adjunta tu certificado médico." | El documento aparece como Pendiente | 2 min |
| T4 | *(El facilitador aprueba los documentos como gestor.)* "Registra tu pago con el número de operación 0012345678." | El pago aparece como Pendiente | 2 min |
| T5 | *(El facilitador verifica el pago.)* "Elige tu cita y dime en qué etapa estás y cuántos días te quedan." | Reserva la cita y responde etapa y días | 3 min |

## Tareas del gestor (P5)

| # | Tarea | Se cumple cuando | Tiempo máximo |
|---|---|---|---|
| G1 | "Busca el expediente del postulante que está en Documentos." | Abre el detalle correcto | 1 min |
| G2 | "Revisa el certificado médico y apruébalo." | El documento queda Aprobado | 2 min |
| G3 | "Observa la fotografía indicando que no es a color." | Queda Observado con ese motivo | 2 min |
| G4 | "¿Dónde verificarías si tiene multas?" | Señala los enlaces a portales oficiales | 1 min |

## Hoja de observación

Marcar ✔ (sin ayuda), ◐ (con ayuda) o ✘ (no lo logró), y anotar el tiempo.

| Participante | T1 / G1 | T2 / G2 | T3 / G3 | T4 / G4 | T5 | ¿Todas sin ayuda? | Comentarios |
|---|---|---|---|---|---|---|---|
| P1 | | | | | | | |
| P2 | | | | | | | |
| P3 | | | | | | | |
| P4 | | | | | | | |
| P5 | | | | | — | | |

## Cuestionario SUS

Se responde al terminar, en Google Forms: 10 preguntas con escala de 1 (*totalmente en desacuerdo*) a 5 (*totalmente de acuerdo*).

1. Creo que me gustaría usar este sistema con frecuencia.
2. Encontré el sistema innecesariamente complejo.
3. Pensé que el sistema era fácil de usar.
4. Creo que necesitaría ayuda de una persona con conocimientos técnicos para usar este sistema.
5. Las funciones del sistema estaban bien integradas.
6. Pensé que había demasiada inconsistencia en el sistema.
7. Imagino que la mayoría de las personas aprendería a usar este sistema muy rápido.
8. Encontré el sistema muy difícil de usar.
9. Me sentí seguro al usar el sistema.
10. Necesité aprender muchas cosas antes de poder usar el sistema.

**Cálculo.** En las preguntas impares se resta 1 a la respuesta; en las pares se resta la respuesta a 5. Se suman los 10 valores y se multiplican por 2.5, lo que da un puntaje de 0 a 100. En la hoja de respuestas de Google Forms, con las preguntas en las columnas B a K:

```
=((B2-1)+(5-C2)+(D2-1)+(5-E2)+(F2-1)+(5-G2)+(H2-1)+(5-I2)+(J2-1)+(5-K2))*2.5
```

## Resultados

| Participante | Tareas sin ayuda | Tiempo total | SUS |
|---|---|---|---|
| P1 | | | |
| P2 | | | |
| P3 | | | |
| P4 | | | |
| P5 | | | |
| **Resultado** | **_ de 5** | | **Promedio: _** |

Un SUS de 68 es el promedio de referencia; sobre 80 se considera bueno. Cada problema observado se registra con la pantalla, lo que pasó y el cambio propuesto, y los cambios se aplican en el Sprint 3.

| Pantalla | Problema observado | Participantes | Cambio propuesto |
|---|---|---|---|
| | | | |

Evidencia por guardar en `evidencias/usabilidad/`: hojas de observación escaneadas o fotografiadas, la exportación de Google Forms (CSV) y 2 o 3 fotos de la sesión sin rostros.
