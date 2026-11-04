# Patrones de diseño

## Objetivo

Documentar los patrones de diseño aplicados en el backend del Sistema de Licencias Clase B, indicando dónde se usan, qué problema resuelven y con qué tecnología se implementan, para que el equipo programe de forma uniforme.

## Contexto

- **Estilo:** monolito modular (Java + Spring Boot).
- **Enfoque interno:** Clean Architecture.
- **Base:** diagrama de componentes (C4 nivel 3) y diagrama de clases (C4 nivel 4).

## Patrones aplicados

| Patrón | Dónde se usa | Problema que resuelve | Se implementa con | Clases en el código | Origen |
|---|---|---|---|---|---|
| **Adapter** | Postulantes → API Perú | El dominio no debe depender del formato de respuesta de API Perú | Cliente HTTP con token | `VerificadorIdentidad`, `ApiPeruDniAdapter` | ADR-012, RF04 |
| **Adapter** | Asistente virtual → IA de orientación | El asistente no debe depender de un proveedor de IA concreto | Cliente HTTP | `AsistenteIA`, `AdaptadorIA` | DA07, RF14 |
| **Adapter** | Notificaciones → correo electrónico | Los recordatorios deben salir de la plataforma sin acoplar el dominio al servidor de correo | Spring Mail (SMTP) | `ServicioNotificaciones`, `NotificadorCorreo` | ADR-013, RF13 |
| **Repository** | Todos los módulos → PostgreSQL | El dominio no debe conocer SQL ni JPA | Spring Data JPA | `RepositorioEvaluaciones`, `RepositorioEvaluacionesJpa` | ADR-005 |
| **Strategy** | Evaluaciones | Conocimientos y manejo se califican de forma distinta | Interfaz Java con dos implementaciones | `CalificacionStrategy`, `CalificacionConocimientos`, `CalificacionManejo` | RF08, RF16 |
| **Chain of Responsibility** | Expedientes → validación del expediente | El expediente debe cumplir varios controles en orden antes de aprobarse | Lista ordenada de validadores | `ValidadorExpediente`, `ValidadorDocumentos`, `ValidadorCertificado`, `ValidadorPago`, `ValidadorEvaluaciones` | RF11, RF20, RF23 |
| **Observer** | Expedientes, Evaluaciones y Seguimiento → Notificaciones y Auditoría | Varios módulos deben reaccionar a un cambio de estado sin acoplarse | Eventos de Spring (`ApplicationEventPublisher`) | `EstadoExpedienteCambiado`, `NotificacionesListener`, `AuditoriaListener` | RF13, RF17 |
| **Decorator** | Requisitos y documentos → caché | Consultar requisitos más rápido sin modificar el repositorio | Caché en memoria (`@Cacheable`) | `RepositorioRequisitosCacheado` | ADR-009, EQ-03 |
| **Facade** | Comunicación entre módulos | Un módulo no debe conocer las clases internas de otro | Una clase pública por módulo | `ExpedientesFacade` (implementa `ExpedientesApi`) | ADR-001, DA05 |

## Cómo funciona cada patrón

| Patrón | En pocas palabras |
|---|---|
| **Adapter** | El sistema dice `verificarIdentidad(dni)` y el adaptador lo traduce a la llamada de API Perú. Si mañana se cambia de proveedor, solo cambia el adaptador. |
| **Repository** | El dominio dice `guardar(evaluacion)` y el repositorio escribe en PostgreSQL. |
| **Strategy** | El caso de uso elige la estrategia según el examen: conocimientos o manejo. |
| **Chain of Responsibility** | Antes de aprobar, el expediente pasa por una cadena: documentos → certificado vigente → pago verificado → evaluaciones aprobadas. Si un eslabón falla, se detiene e indica qué falta. |
| **Observer** | Expedientes publica «el estado cambió» y Notificaciones y Auditoría escuchan y actúan, sin que Expedientes los conozca. |
| **Decorator** | Busca los requisitos primero en la caché; si no están, los consulta en PostgreSQL y los guarda para la próxima vez. |
| **Facade** | Evaluaciones pide `avanzarEtapa(expedienteId)` a la fachada de Expedientes, sin tocar sus tablas ni sus clases internas. |

## Beneficio

- Cambiar el proveedor de DNI, de IA o de correo solo afecta al adaptador (EQ-06).
- Agregar en el futuro la integración con el SNC o el SAT solo requiere un nuevo adaptador.
- Cambiar la nota mínima de un examen solo afecta a la estrategia y al parámetro configurable.
- Agregar un nuevo control al expediente solo agrega un eslabón a la cadena.

## Patrones previstos para siguientes iteraciones

| Patrón | Dónde se aplicaría | Cuándo |
|---|---|---|
| **Circuit Breaker** | Llamadas a API Perú, la IA y el correo | Para que una falla del servicio externo no detenga el trámite |
| **Factory** | Creación de solicitudes por tipo de trámite | Si la emisión, la revalidación y el duplicado requieren pasos muy distintos |
| **CORS** (configuración) | Portal React → API Spring Boot | Al desplegar el frontend y el backend en dominios distintos |
