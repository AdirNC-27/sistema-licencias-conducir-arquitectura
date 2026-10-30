# Tecnología

Stack tecnológico definido para implementar el Sistema de Licencias de Conducir Clase B. Las tecnologías responden a las decisiones arquitectónicas (ADR) y se implementarán en los siguientes sprints.

## Stack

| Capa | Tecnología | Uso en el sistema | Decisión |
|---|---|---|---|
| Frontend | React + TypeScript | Portal web con interfaces por rol | ADR-003 |
| Backend | Java 17 + Spring Boot 3 | API REST del monolito modular con 12 módulos | ADR-001, ADR-002 |
| Seguridad | Spring Security + JWT | Autenticación y autorización por roles | ADR-004 |
| Persistencia | Spring Data JPA | Repositorios que implementan los contratos del dominio | ADR-005 |
| Base de datos | PostgreSQL | Información transaccional del trámite | ADR-005 |
| Caché | Caché en memoria de Spring (`@Cacheable`) | Requisitos y contenido público | ADR-009 |
| Documentación de la API | OpenAPI (Swagger) | Documentación de los endpoints `/api/v1` | ADR-003 |
| Pruebas | JUnit 5 y Mockito | Pruebas del dominio y de los casos de uso (EQ-09) | DA04 |
| Despliegue | Docker y Docker Compose | Frontend, backend y base de datos en contenedores | ADR-010 |

## Estructura prevista del código

```text
tecnologia/
├── frontend/                 # React + TypeScript
│   └── src/
│       ├── paginas/          # una carpeta por rol: postulante, gestor, evaluador, supervisor, administrador
│       ├── componentes/
│       └── servicios/        # llamadas a la API REST
├── backend/                  # Java + Spring Boot (monolito modular)
│   └── src/main/java/pe/licencias/
│       ├── compartido/
│       ├── identidad/
│       ├── postulantes/
│       ├── expedientes/
│       ├── documentos/
│       ├── pagos/
│       ├── citas/
│       ├── evaluaciones/     # módulo de referencia (ver diseño interno de módulos)
│       ├── seguimiento/
│       ├── notificaciones/
│       ├── asistente/
│       ├── administracion/
│       └── auditoria/
└── docker-compose.yml        # frontend, backend y PostgreSQL
```

Cada módulo del backend se organiza con Clean Architecture en los paquetes `presentacion`, `aplicacion`, `dominio` e `infraestructura`, como se describe en [Diseño interno de módulos](../docs/03-diseño-de-software/diseño-interno/diseño-interno-de-modulos.md).

## Integraciones externas

| Servicio | Primera versión | Implementación |
|---|---|---|
| RENIEC | Simulado | `SimuladorReniec` y verificación manual del gestor |
| Sistema Nacional de Conductores (MTC) | Simulado | `SimuladorSNC` |
| Banco o pasarela de pagos | Simulado | `VerificadorPagosManual` |
| Centro médico | Simulado | `RegistroAptitudManual` |

Cada simulador implementa un contrato del dominio. Cuando exista un convenio institucional, se reemplazará por un adaptador que consuma el servicio real, sin modificar las reglas del trámite.
