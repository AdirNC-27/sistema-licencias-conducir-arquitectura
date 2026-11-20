# API · Sistema de Licencias de Conducir Clase B

Backend del sistema: **monolito modular con Clean Architecture** en **NestJS (TypeScript)** y **PostgreSQL** (ADR-001, ADR-002, ADR-005, ADR-014).

## Requisitos

- Node.js 22 o 24 LTS y npm
- PostgreSQL 16 instalado, o Docker Desktop

## Puesta en marcha (VS Code)

**Opción A · PostgreSQL instalado en el equipo** (base `licencias`, usuario `licencias`, clave `licencias`, puerto 5432):

```bash
cd tecnologia/backend
npm install
copy .env.example .env      # en Git Bash o Linux: cp .env.example .env
npm run start:dev
```

**Opción B · Todo con Docker** (base, API y portal): ver [Docker](../README.md#docker).

- API: `http://localhost:3000/api`
- **Swagger (OpenAPI):** `http://localhost:3000/api/docs` · JSON: `http://localhost:3000/api/docs-json`
- Salud: `http://localhost:3000/api/health`

Las migraciones se ejecutan solas al iniciar: crean las 11 tablas y los datos de demostración.

## Cuentas de demostración (clave `demo123`)

| Usuario | Rol |
|---|---|
| `45892014` | Postulante (Juan Carlos Quispe Mendoza) |
| `70123456` | Postulante (María Elena Rojas Palomino), para las pruebas de privacidad |
| `gestor` | Gestor de trámites |
| `evaluador` | Evaluador |
| `supervisor` | Supervisor |
| `admin` | Administrador |

## Contrato de la API

Cada operación declara con `@Contrato` su respuesta exitosa y los errores que puede devolver. Todos los errores usan el mismo formato (`ErrorRespuesta`), en español. El contrato se versiona en [`docs/07-contrato-api/openapi.json`](../../docs/07-contrato-api/openapi.json).

| Comando | Qué hace |
|---|---|
| `npm run contrato` | Regenera `openapi.json` desde el código (después de cambiar un endpoint) |
| `npm run contrato:verificar` | Falla si el archivo no coincide con el código (lo usa la CI) |

## Pruebas

| Comando | Qué ejecuta |
|---|---|
| `npm test` | Pruebas unitarias de dominio, casos de uso, formato de errores y reglas del contrato (Jest) |
| `npm run test:cov` | Las mismas, con reporte de cobertura en `coverage/index.html` |
| `npm run test:e2e` | Pruebas de la API con PostgreSQL real (Jest + Supertest), base `licencias_test` |
| `npm run arquitectura` | Reglas de Clean Architecture y del monolito modular (dependency-cruiser) |

La colección de Postman está en [`tecnologia/pruebas-calidad/postman`](../pruebas-calidad/postman/README.md). GitHub Actions ejecuta todo en cada push (`.github/workflows/ci.yml`).

## Estructura de un módulo

```text
src/modulos/evaluaciones/
├── dominio/          # entidades, reglas y contratos (TypeScript puro)
├── aplicacion/       # casos de uso
├── infraestructura/  # TypeORM y adaptadores externos
├── presentacion/     # controladores REST, DTO de entrada y clases de respuesta (contrato)
├── __tests__/        # pruebas Jest
└── evaluaciones.module.ts   # raíz de composición
```

## Integraciones reales

| Servicio | Variable en `.env` | Adaptador |
|---|---|---|
| API Perú (DNI) | `APIPERU_TOKEN` (gratuito en apiperu.dev) | `ApiPeruDniAdapter` |
| Correo SMTP | `SMTP_HOST`, `SMTP_USUARIO`, `SMTP_CLAVE` | `NotificadorCorreo` |

Sin token de API Perú, el registro de nuevos postulantes responde 422; el resto del sistema funciona con las cuentas de demostración. Sin SMTP, los avisos se guardan en la plataforma y no se envía correo.
