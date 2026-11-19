# API · Sistema de Licencias de Conducir Clase B

Backend del sistema: **monolito modular con Clean Architecture** en **NestJS (TypeScript)** y **PostgreSQL** (ADR-001, ADR-002, ADR-005, ADR-014).

## Requisitos

- Node.js 22 LTS y npm
- Docker Desktop (para PostgreSQL)

## Puesta en marcha (VS Code)

```bash
# 1. Base de datos (desde la carpeta tecnologia)
cd tecnologia
docker compose up -d postgres

# 2. API
cd backend
npm install
copy .env.example .env      # en Git Bash o Linux: cp .env.example .env
npm run start:dev
```

- API: `http://localhost:3000/api`
- **Swagger (OpenAPI):** `http://localhost:3000/api/docs`
- Salud: `http://localhost:3000/api/health`

Las migraciones se ejecutan solas al iniciar: crean las 11 tablas y los datos de demostración.

## Cuentas de demostración (clave `demo123`)

| Usuario | Rol |
|---|---|
| `45892014` | Postulante (Juan Carlos Quispe Mendoza) |
| `gestor` | Gestor de trámites |
| `evaluador` | Evaluador |
| `supervisor` | Supervisor |
| `admin` | Administrador |

## Pruebas

| Comando | Qué ejecuta |
|---|---|
| `npm test` | Pruebas unitarias de dominio y casos de uso (Jest) |
| `npm run test:cov` | Las mismas, con reporte de cobertura en `coverage/index.html` |
| `npm run test:e2e` | Pruebas de la API con PostgreSQL real (Jest + Supertest), base `licencias_test` |
| `npm run arquitectura` | Reglas de Clean Architecture y del monolito modular (dependency-cruiser) |

GitHub Actions ejecuta los cuatro en cada push (`.github/workflows/ci.yml`).

## Estructura de un módulo

```text
src/modulos/evaluaciones/
├── dominio/          # entidades, reglas y contratos (TypeScript puro)
├── aplicacion/       # casos de uso
├── infraestructura/  # TypeORM y adaptadores externos
├── presentacion/     # controladores REST y DTO con Swagger
├── __tests__/        # pruebas Jest
└── evaluaciones.module.ts   # raíz de composición
```

## Integraciones reales

| Servicio | Variable en `.env` | Adaptador |
|---|---|---|
| API Perú (DNI) | `APIPERU_TOKEN` (gratuito en apiperu.dev) | `ApiPeruDniAdapter` |
| Correo SMTP | `SMTP_HOST`, `SMTP_USUARIO`, `SMTP_CLAVE` | `NotificadorCorreo` |

Sin token de API Perú, el registro de nuevos postulantes responde 422; el resto del sistema funciona con las cuentas de demostración. Sin SMTP, los avisos se guardan en la plataforma y no se envía correo.
