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
| **Adapter** | Postulantes → RENIEC y SNC | Los servicios institucionales tienen su propia API y hoy no están disponibles | Simuladores en la v1; API REST autorizada en el futuro | `VerificadorIdentidad`, `SimuladorReniec`, `ConsultaSNC`, `SimuladorSNC` | DA08, RC02, RC03 |
| **Adapter** | Pagos → banco o pasarela | La verificación es manual y en el futuro será automática | Revisión manual del gestor en la v1 | `VerificadorPagos`, `VerificadorPagosManual` | DA06, RC04 |
| **Adapter** | Evaluaciones → centro médico | El certificado médico lo emite un tercero | Registro manual del certificado en la v1 | `ValidadorAptitudMedica`, `RegistroAptitudManual` | DA06, DA08 |
| **Repository** | Todos los módulos → PostgreSQL | El dominio no debe conocer SQL ni JPA | Spring Data JPA | `RepositorioEvaluaciones`, `RepositorioEvaluacionesJpa` | ADR-005 |
| **Strategy** | Evaluaciones | Cada tipo de evaluación se califica distinto (apto/no apto, 35/40, 80/100) | Interfaz Java con tres implementaciones | `CalificacionStrategy`, `CalificacionMedica`, `CalificacionConocimientos`, `CalificacionManejo` | RF08, RF16 |
| **Chain of Responsibility** | Expedientes → validación del expediente | El expediente debe cumplir varios controles en orden antes de validarse | Lista ordenada de validadores | `ValidadorExpediente`, `ValidadorDocumentos`, `ValidadorPago`, `ValidadorEvaluaciones` | RF11, RF20 |
| **Observer** | Expedientes, Evaluaciones y Seguimiento → Notificaciones y Auditoría | Varios módulos deben reaccionar a un cambio de estado sin acoplarse | Eventos de Spring (`ApplicationEventPublisher`) | `EstadoExpedienteCambiado`, `NotificacionesListener`, `AuditoriaListener` | RF13, RF17 |
| **Decorator** | Requisitos y documentos → caché | Consultar requisitos más rápido sin modificar el repositorio | Caché en memoria (`@Cacheable`) | `RepositorioRequisitosCacheado` | ADR-009, EQ-03 |
| **Facade** | Comunicación entre módulos | Un módulo no debe conocer las clases internas de otro | Una clase pública por módulo | `ExpedientesFacade` (implementa `ExpedientesApi`) | ADR-001, DA05 |

## Cómo funciona cada patrón

| Patrón | En pocas palabras |
|---|---|
| **Adapter** | El sistema dice `verificarIdentidad(dni)` y el adaptador lo traduce: hoy responde el simulador, mañana responderá RENIEC. |
| **Repository** | El dominio dice `guardar(evaluacion)` y el repositorio escribe en PostgreSQL. |
| **Strategy** | El caso de uso elige la estrategia según el tipo: médica (apto/no apto), conocimientos (35 de 40) o manejo (80 de 100). |
| **Chain of Responsibility** | Antes de validar el expediente pasa por una cadena: documentos aprobados → pago verificado → evaluaciones aprobadas. Si un eslabón falla, se detiene e indica qué falta. |
| **Observer** | Expedientes publica «el estado cambió» y Notificaciones y Auditoría escuchan y actúan, sin que Expedientes los conozca. |
| **Decorator** | Busca los requisitos primero en la caché; si no están, los consulta en PostgreSQL y los guarda para la próxima vez. |
| **Facade** | Evaluaciones pide `avanzarEtapa(expedienteId)` a la fachada de Expedientes, sin tocar sus tablas ni sus clases internas. |

## Beneficio

- Reemplazar un simulador por una integración real solo afecta al adaptador (EQ-06).
- Cambiar la nota mínima de un examen solo afecta a la estrategia y al parámetro configurable.
- Agregar un nuevo control al expediente solo agrega un eslabón a la cadena.
- Agregar un nuevo canal de aviso (correo) solo agrega un nuevo observador.

## Patrones previstos para siguientes iteraciones

| Patrón | Dónde se aplicaría | Cuándo |
|---|---|---|
| **Circuit Breaker** | Llamadas a RENIEC, SNC, banco e IA | Cuando las integraciones dejen de ser simuladas y puedan fallar o demorar |
| **Factory** | Creación de evaluaciones por tipo | Si crear cada tipo de evaluación requiere pasos distintos |
| **CORS** (configuración) | Portal React → API Spring Boot | Al desplegar el frontend y el backend en dominios distintos |
