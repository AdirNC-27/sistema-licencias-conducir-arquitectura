# Nivel 1 · Diagrama de contexto del sistema

> **Proyecto:** Sistema de Licencias de Conducir Clase B  
> **Modelo:** C4 · Nivel 1 de 4 · **Versión:** 2.0

---

## 1. Objetivo

Mostrar el **Sistema de Licencias Clase B como una sola caja**: quiénes lo usan y con qué sistemas externos se comunica. Es la vista de mayor nivel y la primera que se presenta a cualquier persona, técnica o no.

| Aspecto | Descripción |
|---|---|
| Pregunta que responde | ¿Qué es el sistema, quién lo usa y con quién se integra? |
| Audiencia | Todos: docentes, municipalidad, equipo de desarrollo, operaciones |
| Qué **no** muestra | Tecnologías, servidores, bases de datos ni módulos internos |
| Siguiente nivel | `Nivel2-DiagramadeContenedores.md` |

---

## 2. Diagrama

![Diagrama de contexto del Sistema de Licencias Clase B](../../img/nivel1-contexto.png)

> Archivo editable: `img/fuentes/nivel1-contexto.drawio`

---

## 3. Personas (usuarios)

| Persona | Quién es en la realidad | Qué hace en el sistema | Requisitos |
|---|---|---|---|
| **Postulante** | Ciudadano que tramita su licencia II-B o II-C | Registra su solicitud, sube sus documentos y recibo, elige su cita de examen, consulta resultados y el avance de su trámite, y usa el asistente virtual | RF02, RF03, RF05, RF07, RF10, RF14, RF19, RF25, RF26 |
| **Gestor de trámites** | Personal de ventanilla de la MPH en el MAC | Verifica la identidad, los documentos y el recibo; confirma en los portales oficiales el SNC y las sanciones; reprograma citas | RF04, RF06, RF07, RF24, RF27 |
| **Evaluador** | Examinador de la Subgerencia de Tránsito | Registra los resultados de conocimientos y manejo, con un máximo de 3 intentos | RF08, RF09 |
| **Supervisor** | Subgerencia de Tránsito y Seguridad Vial | Valida resultados y expedientes, controla el plazo legal y autoriza la emisión | RF09, RF10, RF11, RF12 |
| **Administrador** | Personal de TI de la MPH | Gestiona usuarios, roles, requisitos, días de examen, cupos, contenidos, reportes y auditoría | RF16, RF17, RF18, RF21 |

---

## 4. Sistemas externos

| Sistema | Tipo | Responsabilidad | Protocolo |
|---|---|---|---|
| **API Perú** | Integración real | Consulta de datos del DNI | HTTPS/REST |
| **IA de orientación** | Integración real | Responde las consultas del asistente virtual con contenido aprobado | HTTPS/REST |
| **Correo electrónico** | Integración real | Envía recordatorios de examen y vencimientos | SMTP |
| **Consulta de licencias del MTC** | Enlace oficial | Permite verificar una licencia ya emitida | Enlace web |
| **SNC, SAT, Registro Nacional de Sanciones y gestión documental** | Verificación del gestor | El gestor los consulta en sus portales oficiales y el sistema registra la verificación | Sin conexión directa |

---

## 5. Relaciones

| Origen | Destino | Descripción |
|---|---|---|
| Postulante, Gestor, Evaluador, Supervisor, Administrador | Sistema de Licencias | Usan el sistema según su rol [HTTPS] |
| Sistema de Licencias | API Perú | Valida el DNI [HTTPS/REST] |
| Sistema de Licencias | IA de orientación | Consulta respuestas [HTTPS/REST] |
| Sistema de Licencias | Correo electrónico | Envía recordatorios [SMTP] |
| Sistema de Licencias | Consulta de licencias del MTC | Enlace para verificar una licencia emitida |
| Sistema de Licencias | Verificación del gestor | Registra la verificación realizada en los portales oficiales |

---

## 6. Decisiones y supuestos

| # | Decisión o supuesto | Motivo |
|---|---|---|
| 1 | Solo se integran por API los servicios que ofrecen una API pública: API Perú, la IA y el correo | Es lo que permite una conexión legal y real en la v1 (ADR-007, ADR-012, ADR-013) |
| 2 | El SNC, el SAT y el Registro Nacional de Sanciones se verifican por el gestor en sus portales | No ofrecen una API pública; es como lo hace hoy la MPH (RC03) |
| 3 | La integración futura con esos sistemas se haría mediante la PIDE, con convenio | Es la vía oficial de interoperabilidad entre entidades públicas |
| 4 | El sistema no emite licencias con validez legal | Es un prototipo académico (RF12, RC05) |
| 5 | El asistente virtual solo usa contenido aprobado | No aprueba trámites ni modifica información (RC06, DA07) |
