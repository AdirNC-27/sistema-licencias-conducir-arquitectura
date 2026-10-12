# Nivel 4 · Diagrama de código

> **Proyecto:** Sistema de Licencias de Conducir Clase B · **Módulo detallado:** Evaluaciones  
> **Modelo:** C4 · Nivel 4 de 4 · **Notación:** UML · **Versión:** 1.0

---

## 1. Objetivo

Mostrar **cómo está organizado el código** de un componente del nivel 3: sus clases, interfaces y la forma en que colaboran. Se detalla el flujo **Validar resultado**, que involucra al módulo **Evaluaciones** y a su comunicación con Expedientes, Auditoría y Notificaciones.

| Aspecto | Descripción |
|---|---|
| Pregunta que responde | ¿Cómo se implementa por dentro un componente? |
| Audiencia | Desarrolladores |
| Componente detallado | Evaluaciones (nivel 3) |
| Requisitos cubiertos | RF08, RF09, RF19, RF20, RF13, RF17 |
| Driver principal | DA04 · Integridad de los resultados |
| Nivel anterior | `Nivel3-Diagrama-de-Componentes.md` |

---

## 2. Diagrama de clases

![Diagrama de clases del módulo Evaluaciones](../../img/nivel4-clases.png)

> Archivo editable: `img/fuentes/nivel4-clases.drawio`

### 2.1 Capas de Clean Architecture

| Capa | Contiene | Regla |
|---|---|---|
| **Presentación** | Controladores | Traduce HTTP a llamadas del caso de uso y viceversa |
| **Aplicación** | Casos de uso | Coordina los pasos del proceso; no conoce la tecnología |
| **Dominio** | Entidades, objetos de valor, enumeraciones, estrategias e interfaces | Contiene las reglas del trámite; no importa nada de las otras capas |
| **Infraestructura** | Repositorios y adaptadores | Implementa las interfaces del dominio con una tecnología concreta |

> **Regla de dependencia:** las flechas del código apuntan hacia el dominio. Las clases de infraestructura implementan interfaces del dominio (triángulo hueco); el dominio nunca conoce a la infraestructura.

### 2.2 Clases del módulo Evaluaciones

| Clase | Tipo | Capa | Responsabilidad |
|---|---|---|---|
| `EvaluacionesController` | Controlador | Presentación | Recibe las peticiones `/api/v1/evaluaciones` y devuelve 200, 201 o 409 |
| `RegistrarResultadoUseCase` | Caso de uso | Aplicación | Registra o corrige un resultado usando la estrategia de calificación del tipo |
| `ValidarResultadoUseCase` | Caso de uso | Aplicación | Valida y bloquea el resultado, avanza la etapa, audita y notifica |
| `Evaluacion` | Entidad | Dominio | Controla los estados y aplica la regla de bloqueo |
| `Resultado` | Objeto de valor | Dominio | Puntaje, aprobado y observaciones |
| `EstadoResultado` | Enumeración | Dominio | PENDIENTE, REGISTRADO, VALIDADO |
| `TipoEvaluacion` | Enumeración | Dominio | MEDICA, CONOCIMIENTOS, MANEJO |
| `ResultadoBloqueadoException` | Excepción | Dominio | Indica que se intentó modificar un resultado validado |
| `CalificacionStrategy` | Interfaz (Strategy) | Dominio | Contrato para calificar según el tipo de evaluación |
| `CalificacionMedica`, `CalificacionConocimientos`, `CalificacionManejo` | Estrategias | Dominio | Apto/no apto · 35 de 40 · 80 de 100 |
| `RepositorioEvaluaciones` | Interfaz | Dominio | Contrato para guardar y buscar evaluaciones |
| `RegistroAuditoria` | Interfaz | Dominio | Contrato para registrar operaciones |
| `ServicioNotificaciones` | Interfaz | Dominio | Contrato para avisar a los usuarios |
| `ExpedientesApi` | Interfaz | Dominio | API pública del módulo Expedientes para avanzar etapas |
| `ValidadorAptitudMedica` | Interfaz | Dominio | Contrato para verificar el certificado médico |
| `RepositorioEvaluacionesJpa` | Repositorio | Infraestructura | Implementa `RepositorioEvaluaciones` con Spring Data JPA y PostgreSQL |
| `BitacoraAuditoriaJpa` | Adaptador | Infraestructura | Implementa `RegistroAuditoria` con la tabla de auditoría |
| `NotificadorInterno` | Adaptador | Infraestructura | Implementa `ServicioNotificaciones` con avisos en la plataforma |
| `ExpedientesFacade` | Fachada | Módulo Expedientes | Implementa `ExpedientesApi` y aplica la secuencia de etapas |
| `RegistroAptitudManual` | Adaptador simulado | Infraestructura | Implementa `ValidadorAptitudMedica` en la v1 |
| `ConfiguracionEvaluaciones` | Configuración | Infraestructura | Conecta cada interfaz con su implementación |

---

## 3. Diagrama de secuencia: validar resultado

![Diagrama de secuencia de validar resultado](../../img/nivel4-secuencia.png)

> Archivo editable: `img/fuentes/nivel4-secuencia.drawio`

| Paso | Origen → destino | Mensaje | Requisito |
|---|---|---|---|
| 1 | Supervisor → `EvaluacionesController` | `POST /api/v1/evaluaciones/{id}/validacion` con JWT | RF01 |
| 2 | Controlador → `ValidarResultadoUseCase` | `ejecutar(id, supervisorId)` | RF09 |
| 3 | Caso de uso → `RepositorioEvaluaciones` | `buscarPorId(id)` | — |
| 4 | Caso de uso → `Evaluacion` | `validar()` | RF09, DA04 |
| alt | Si ya estaba VALIDADO | `ResultadoBloqueadoException` → **409 Conflict** | EQ-09 |
| 5 | Caso de uso → `RepositorioEvaluaciones` | `guardar(evaluacion)` | — |
| 6 | Caso de uso → `ExpedientesApi` | `avanzarEtapa(expedienteId)` si fue aprobada | RF20 |
| 7 | Caso de uso → `RegistroAuditoria` | `registrar(evento)` | RF17 |
| 8 | Caso de uso → `ServicioNotificaciones` | `notificar(postulanteId, mensaje)` | RF13 |
| — | Controlador → Supervisor | **200 OK** | — |

---

## 4. Decisiones reflejadas en el código

| Decisión | Motivo |
|---|---|
| La regla de bloqueo está en la entidad `Evaluacion` | Se cumple siempre, venga la petición de la API, de una prueba o de una tarea programada (DA04) |
| Los pasos 5 a 8 se ejecutan en una sola transacción | Evita que el resultado quede validado sin auditoría o sin avanzar la etapa |
| Evaluaciones usa a Expedientes mediante `ExpedientesApi` | Respeta la regla del monolito modular: ningún módulo accede a las tablas de otro (ADR-001) |
| La calificación usa el patrón Strategy | Cada tipo de evaluación se califica distinto y los mínimos son configurables (RF16) |
| El centro médico es un adaptador simulado | Su integración real requiere autorización (DA08); se reemplazará sin tocar el dominio |
