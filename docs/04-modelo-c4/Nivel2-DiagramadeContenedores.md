# Nivel 2 · Diagrama de contenedores

> **Proyecto:** Sistema de Licencias de Conducir Clase B  
> **Modelo:** C4 · Nivel 2 de 4 · **Versión:** 2.0

---

## 1. Objetivo

Abrir la caja «Sistema de Licencias Clase B» del nivel 1 y mostrar los **contenedores** que la forman: las aplicaciones y la base de datos que se ejecutan por separado, la tecnología de cada uno y cómo se comunican.

| Aspecto | Descripción |
|---|---|
| Pregunta que responde | ¿De qué piezas ejecutables se compone el sistema y con qué tecnología? |
| Audiencia | Arquitectos, desarrolladores, operaciones |
| Qué es un contenedor | Algo que se ejecuta o almacena datos de forma independiente: una aplicación web, una API, una base de datos (no es lo mismo que un contenedor Docker) |
| Nivel anterior | `Nivel1-DiagramadeContextodelSistema.md` |
| Siguiente nivel | `Nivel3-Diagrama-de-Componentes.md` |

---

## 2. Diagrama

![Diagrama de contenedores del Sistema de Licencias Clase B](../../img/nivel2-contenedores.png)

> Archivo editable: `img/fuentes/nivel2-contenedores.drawio`

---

## 3. Contenedores

| Contenedor | Tecnología | Responsabilidad | Datos que maneja |
|---|---|---|---|
| **Portal web** | SPA · React + TypeScript | Interfaz por rol en el navegador. Incluye el enlace a la consulta de licencias del MTC | Ninguno persistente; solo el estado de la pantalla y el token de sesión |
| **API Licencias** | Java + Spring Boot | Monolito modular de 12 módulos: API REST con JWT, reglas del trámite, caché en memoria de la información pública y adaptadores de los servicios externos | Ninguno propio; usa la base de datos |
| **PostgreSQL** | Base de datos única | Almacena de forma permanente la información del trámite y los documentos | Usuarios, expedientes, documentos, pagos, citas, resultados, notificaciones y auditoría |

---

## 4. Relaciones

| Origen | Destino | Descripción | Protocolo |
|---|---|---|---|
| Usuarios | Portal web | Usan la aplicación desde el navegador | HTTPS |
| Portal web | API Licencias | Llama a la API | HTTPS/JSON + JWT |
| API Licencias | PostgreSQL | Lee y escribe información | SQL / JPA |
| API Licencias | API Perú | Valida el DNI | HTTPS/REST |
| API Licencias | IA de orientación | Consulta respuestas | HTTPS/REST |
| API Licencias | Correo electrónico | Envía recordatorios | SMTP |
| API Licencias | Verificación del gestor | Registra la verificación realizada en el SNC, el SAT y el Registro Nacional de Sanciones | — |

---

## 5. Decisiones arquitectónicas reflejadas

| Decisión | Motivo |
|---|---|
| Un único contenedor de backend (monolito modular) | Una sola aplicación desplegable con 12 módulos separados, adecuada para un equipo pequeño (ADR-001) |
| Frontend separado del backend (SPA + API REST) | El frontend y el backend evolucionan y se despliegan de forma independiente (ADR-003) |
| PostgreSQL como única base de datos | Expedientes, pagos, cupos y resultados necesitan transacciones y consistencia; una sola base simplifica la operación (ADR-005) |
| Caché en memoria dentro de la API | Mejora el tiempo de respuesta de la información pública sin agregar otra base de datos (ADR-009) |
| Solo la API se comunica con los servicios externos | Las credenciales y los adaptadores quedan en el servidor (ADR-007) |

---

## 6. Seguridad entre contenedores

| Comunicación | Medida |
|---|---|
| Navegador → Portal web y API | Tráfico cifrado con HTTPS, dominio propio y CDN (ADR-011) |
| Portal web → API | Autenticación con token JWT y autorización por rol en cada petición (ADR-004) |
| API → PostgreSQL | Acceso solo desde la red interna; credenciales en variables de entorno |
| API → Documentos | Acceso a los documentos solo según los permisos del rol (ADR-008) |
| API → Servicios externos | Tokens y credenciales de API Perú, la IA y el correo guardados solo en el servidor |
