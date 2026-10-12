# Nivel 3 · Diagrama de componentes

> **Proyecto:** Sistema de Licencias de Conducir Clase B · **Contenedor detallado:** API Licencias  
> **Modelo:** C4 · Nivel 3 de 4 · **Versión:** 1.0

---

## 1. Objetivo

Abrir el contenedor **API Licencias** del nivel 2 y mostrar sus **componentes**: los módulos del monolito modular, la responsabilidad de cada uno y cómo se relacionan entre sí y con la base de datos, el almacenamiento, la caché y los sistemas externos.

| Aspecto | Descripción |
|---|---|
| Pregunta que responde | ¿Cómo se divide el backend por dentro y qué hace cada parte? |
| Audiencia | Arquitectos y desarrolladores |
| Qué es un componente | Un grupo de funcionalidades con una responsabilidad clara, accesible mediante una interfaz. En este proyecto, cada **módulo** del monolito es un componente |
| Nivel anterior | `Nivel2-DiagramadeContenedores.md` |
| Siguiente nivel | `Nivel4-DiagramadeCodigo.md` |

---

## 2. Diagrama

![Diagrama de componentes de la API Licencias](../../img/nivel3-componentes.png)

> Archivo editable: `img/fuentes/nivel3-componentes.drawio`

---

## 3. Componentes

| Componente | Responsabilidad | Funcionalidades principales | Requisitos | Paquete en el código |
|---|---|---|---|---|
| **API REST** | Punto de entrada HTTP del contenedor | Rutas `/api/v1`, autenticación JWT, validación de la entrada, manejo de errores | RF01 | `pe.licencias.api` |
| **Identidad y acceso** | Cuentas y permisos | Registro, inicio de sesión, roles (postulante, gestor, evaluador, supervisor, administrador) | RF01 | `pe.licencias.identidad` |
| **Postulantes** | Datos del postulante | Datos personales, perfil y verificación de identidad | RF03 | `pe.licencias.postulantes` |
| **Expedientes** | Ciclo del trámite | Solicitud, número de trámite, control de etapas, validación del expediente, emisión simulada | RF02, RF11, RF12, RF20 | `pe.licencias.expedientes` |
| **Requisitos y documentos** | Documentación del expediente | Checklist por categoría, carga, revisión, observación y reemplazo de documentos | RF03, RF04, RF22 | `pe.licencias.documentos` |
| **Pagos** | Derecho de trámite | Registro del comprobante y verificación manual | RF05, RF06 | `pe.licencias.pagos` |
| **Citas** | Agenda de evaluaciones | Jornadas, horarios, cupos, programación y reprogramación | RF07, RF21 | `pe.licencias.citas` |
| **Evaluaciones** | Resultados de las pruebas | Aptitud médica, conocimientos y manejo; corrección antes de validar y bloqueo después | RF08, RF09, RF19 | `pe.licencias.evaluaciones` |
| **Seguimiento** | Avance del trámite | Estado, historial y acciones pendientes | RF10 | `pe.licencias.seguimiento` |
| **Notificaciones** | Comunicación con los usuarios | Avisos internos sobre observaciones, pagos, citas, resultados y estados | RF13 | `pe.licencias.notificaciones` |
| **Asistente virtual** | Orientación al postulante | Respuestas con contenido aprobado y derivación al gestor | RF14, RF15 | `pe.licencias.asistente` |
| **Administración** | Configuración del sistema | Usuarios, categorías, requisitos, montos, parámetros, contenidos y reportes | RF16, RF18 | `pe.licencias.administracion` |
| **Auditoría** | Trazabilidad | Registro de usuario, fecha, acción y valores modificados | RF17 | `pe.licencias.auditoria` |

---

## 4. Relaciones entre componentes

| Origen | Destino | Descripción | Tipo de comunicación |
|---|---|---|---|
| Portal web | API REST | Llama a la API | HTTPS/JSON |
| API REST | Módulos de negocio | Invoca los casos de uso | Llamada en memoria |
| Postulantes | Identidad y acceso | Usa la cuenta y el rol del usuario | Llamada en memoria (interfaz pública del módulo) |
| Administración | Identidad y acceso | Gestiona usuarios y roles | Llamada en memoria |
| Asistente virtual | Administración | Lee el contenido aprobado | Llamada en memoria |
| Expedientes | Requisitos y documentos | Verifica que los documentos estén aprobados | Llamada en memoria |
| Pagos | Expedientes | Informa que el pago fue verificado | Llamada en memoria |
| Citas | Evaluaciones | Crea la evaluación pendiente al programar la cita | Llamada en memoria |
| Evaluaciones | Expedientes | Solicita avanzar a la siguiente etapa cuando el resultado se valida (RF20) | Llamada en memoria |
| Seguimiento | Expedientes | Consulta estado e historial | Llamada en memoria |
| Seguimiento | Notificaciones | Publica el cambio de estado | Evento en memoria |
| Todos los módulos | Auditoría | Registran sus operaciones importantes | Evento en memoria |

---

## 5. Relaciones con contenedores y sistemas externos

| Componente | Destino | Descripción | Protocolo | Patrón aplicado |
|---|---|---|---|---|
| Todos los módulos | Base de datos (PostgreSQL) | Cada módulo lee y escribe **solo sus propias tablas** | SQL / JPA | Repository |
| Requisitos y documentos | Almacenamiento privado | Guarda documentos y comprobantes | HTTPS | Adapter |
| Requisitos y documentos | Caché | Guarda y lee los requisitos públicos | En memoria | Decorator |
| Postulantes | RENIEC (simulado) | Verifica la identidad | Adaptador simulado | Adapter |
| Postulantes | SNC (simulado) | Consulta antecedentes del conductor | Adaptador simulado | Adapter |
| Pagos | Banco o pasarela (simulado) | Verifica el pago | Adaptador simulado | Adapter |
| Evaluaciones | Centro médico (simulado) | Valida la aptitud médica | Adaptador simulado | Adapter |
| Asistente virtual | Proveedor de IA | Genera respuestas sobre el contenido aprobado | HTTPS/REST | Adapter |
| Notificaciones | Correo (opcional) | Envía avisos fuera de la plataforma | SMTP | Adapter |

---

## 6. Reglas del monolito modular

| # | Regla | Motivo |
|---|---|---|
| 1 | Todos los componentes se despliegan juntos en el contenedor API Licencias | Es un monolito: un solo proceso y un solo despliegue (ADR-001) |
| 2 | Un módulo usa a otro solo a través de su interfaz pública | Evita que un cambio interno en un módulo rompa a los demás (DA05) |
| 3 | Un módulo no lee ni escribe las tablas de otro módulo | Mantiene la independencia de los datos de cada módulo |
| 4 | Cada sistema externo se integra en un único módulo mediante un adaptador | La integración queda en un solo lugar y el simulador se reemplaza sin tocar el dominio (DA08) |
| 5 | Cada módulo se organiza por dentro con Clean Architecture | Las reglas del trámite no dependen de la tecnología (ADR-002, ver nivel 4) |
