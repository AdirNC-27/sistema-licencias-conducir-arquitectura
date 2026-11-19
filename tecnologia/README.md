# Tecnología

Stack tecnológico definido para implementar el Sistema de Licencias de Conducir Clase B. Las tecnologías responden a las decisiones arquitectónicas (ADR) y se implementan desde el sprint 2.

## Stack

| Capa | Tecnología | Uso en el sistema | Decisión |
|---|---|---|---|
| Frontend | React + TypeScript (Vite), Tailwind CSS | Portal web adaptable con interfaces por rol · ver frontend/README.md | ADR-003 |
| Backend | Node.js 22 + NestJS 11 (TypeScript) | API REST del monolito modular con 12 módulos | ADR-001, ADR-002, ADR-014 |
| Seguridad | `@nestjs/jwt` + Passport + guardas por rol | Autenticación y autorización por roles | ADR-004 |
| Validación | class-validator | Validar los datos que llegan a la API | ADR-008 |
| Persistencia | TypeORM (con migraciones) | Repositorios que implementan los contratos del dominio | ADR-005 |
| Base de datos | PostgreSQL 16 | Información transaccional del trámite | ADR-005 |
| Caché | `@nestjs/cache-manager` (en memoria) | Requisitos y contenido público | ADR-009 |
| Eventos internos | `@nestjs/event-emitter` | Avisar a Notificaciones y Auditoría cuando cambia un estado | ADR-006 |
| Documentación de la API | OpenAPI con `@nestjs/swagger` | Swagger UI en `/api/docs` | ADR-003 |
| Correo | Nodemailer (SMTP) | Recordatorios de examen y vencimientos | ADR-013 |
| Despliegue | Docker y Docker Compose | Frontend, backend y base de datos en contenedores | ADR-010 |
| Integración continua | GitHub Actions | Backend: arquitectura, Jest y cobertura. Portal: compilación y pruebas E2E con API y PostgreSQL | ADR-014 |

## Herramientas de prueba

| Herramienta | Qué prueba | Escenario |
|---|---|---|
| Jest | Reglas de negocio del dominio y casos de uso, con reporte de cobertura | EQ-06, EQ-09 |
| Jest + Supertest | Endpoints de la API, roles y auditoría | EQ-01, EQ-07, EQ-09 |
| dependency-cruiser | Que el dominio no dependa de NestJS ni de la infraestructura | EQ-06 |
| Playwright | Trámite completo en el navegador con los 5 roles, control de acceso y vista móvil | EQ-02, EQ-05 |
| axe-core | Accesibilidad WCAG 2.1 AA de las pantallas con sesión | EQ-05 |
| `EXPLAIN ANALYZE` + `pg_stat_statements` | Planes de las consultas reales con 30,000 expedientes | EQ-03 |
| k6 | Carga progresiva hasta 2,000 usuarios virtuales | EQ-03 |
| Postman + Newman | Acceso a expedientes ajenos | EQ-02 |
| OWASP ZAP | Vulnerabilidades de la API | EQ-01 |
| Lighthouse | Rendimiento y accesibilidad del portal | EQ-03, EQ-05 |
| `@nestjs/terminus` + UptimeRobot + pg_dump | Salud del servicio, monitoreo y respaldo | EQ-04 |
| promptfoo | Respuestas del asistente de IA | EQ-08 |

## Estructura del código

```text
tecnologia/
├── backend/                  # Node.js + NestJS (monolito modular) · ver backend/README.md
│   ├── src/compartido/       # guardas de roles, errores del dominio, eventos
│   ├── src/modulos/          # identidad, postulantes, requisitos, expedientes, documentos,
│   │                         # pagos, citas, evaluaciones, notificaciones, auditoria, salud
│   ├── src/migraciones/      # esquema y datos iniciales (TypeORM)
│   └── test/                 # pruebas de la API (Jest + Supertest)
├── frontend/                 # React + TypeScript (Vite) · ver frontend/README.md
│   ├── src/paginas/          # pantallas por rol: postulante, gestor, evaluador, supervisor, admin
│   └── e2e/                  # pruebas E2E y de accesibilidad (Playwright + axe-core)
├── pruebas-calidad/k6/       # pruebas de carga hasta 2,000 usuarios
├── postgres/init.sql         # base de pruebas y pg_stat_statements
├── postgres/analisis/        # volumen, EXPLAIN ANALYZE y prueba de concurrencia
└── docker-compose.yml        # PostgreSQL y API
.github/workflows/ci.yml           # backend: arquitectura, Jest y cobertura en cada push
.github/workflows/ci-frontend.yml  # portal: lint, compilación y E2E contra la API
```

Cada módulo del backend se organiza con Clean Architecture en las carpetas `presentacion`, `aplicacion`, `dominio` e `infraestructura`, como se describe en [Diseño interno de módulos](../docs/03-diseño-de-software/diseño-interno/diseño-interno-de-modulos.md).

## Integraciones externas

| Servicio | Tipo | Implementación |
|---|---|---|
| API Perú | Integración real (HTTPS/REST con token) | `ApiPeruDniAdapter` |
| IA de orientación | Integración real (HTTPS/REST) | `AdaptadorIA` |
| Correo electrónico | Integración real (SMTP con Nodemailer) | `NotificadorCorreo` |
| SNC, SAT y Registro Nacional de Sanciones | Verificación del gestor en portales oficiales | El sistema registra la verificación |

Cada integración implementa un contrato del dominio. La integración futura con el SNC y el SAT se haría mediante la Plataforma de Interoperabilidad del Estado (PIDE), con convenio, agregando un adaptador sin modificar las reglas del trámite.
