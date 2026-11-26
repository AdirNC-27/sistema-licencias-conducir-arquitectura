# Sistema de Licencias de Conducir Clase B

## Autor

Adir Alejandro Navarro Cordero

## Curso

Arquitectura de Software (IS-488)

## Caso de estudio

Gestión del trámite de licencias de conducir clase B (categorías II-B y II-C) en la Municipalidad Provincial de Huamanga: emisión nueva, revalidación y duplicado.

## Descripción

Plataforma web académica para la gestión del trámite de licencias de conducir clase B. Centraliza el expediente digital del postulante y coordina la verificación manual de documentos y pagos, la programación de citas, el registro y la validación de evaluaciones, el seguimiento del trámite, las notificaciones y la auditoría de las operaciones.

> **Prototipo académico:** no emite licencias con validez legal. Se integra con API Perú (consulta de DNI), una IA de orientación y el correo electrónico. El SNC, el SAT y el Registro Nacional de Sanciones son verificados por el gestor en sus portales oficiales.

## Arquitectura

| Aspecto | Decisión |
|---|---|
| Estilo arquitectónico | Monolito modular con arquitectura web cliente-servidor |
| Enfoque arquitectónico | Clean Architecture |
| Documentación | Modelo C4 (contexto, contenedores, componentes y código) |
| Frontend | React y TypeScript (Vite, Tailwind CSS) |
| Backend | Node.js con NestJS (TypeScript), JWT por roles y TypeORM |
| API | REST documentada con OpenAPI (Swagger), contrato versionado y un solo formato de error |
| Pruebas | Jest y Supertest, Postman con Newman, Playwright (E2E y accesibilidad) y k6 (carga) |
| Base de datos | PostgreSQL |
| Despliegue | Docker Compose (base, API y portal) e integración continua con GitHub Actions |

## Estructura del repositorio

```
docs/
├── 01-analisis-de-sistema/
│   ├── 00-problematica.md
│   ├── 01-actores.md
│   ├── 02-historias-de-usuario.md
│   ├── 03-requisitos-funcionales.md
│   ├── 04-atributos-de-calidad.md
│   ├── 05-restricciones.md
│   ├── 06-drivers-arquitectonicos.md
│   ├── 07-decisiones-arquitectonicas.md
│   ├── 08-escenarios-atributos-calidad.md
│   ├── 09-glosario.md
│   └── 10-levantamiento-de-informacion.md
├── 02-arquitectura-software/
│   ├── arquitectura-inicial.md
│   ├── componentes-arquitectonicos.md
│   ├── diagrama-de-despliegue.md
│   ├── enfoque-arquitectonico.md
│   └── estilo-arquitectonico.md
├── 03-diseño-de-software/diseño-interno/
│   ├── diseño-interno-de-modulos.md
│   ├── patrones-de-diseño.md
│   └── principios-de-diseño.md
├── 04-modelo-c4/
│   ├── Nivel1-DiagramadeContextodelSistema.md
│   ├── Nivel2-DiagramadeContenedores.md
│   ├── Nivel3-Diagrama-de-Componentes.md
│   └── Nivel4-DiagramadeCodigo.md
├── 05-especificaciones-sdd/      # SDD-01 … SDD-13 (sprint 2)
├── 06-validacion-calidad/        # evidencias de los escenarios EQ
├── 07-contrato-api/              # contrato OpenAPI (openapi.json) y convenciones de la API
└── 08-integracion-continua/      # pipelines de GitHub Actions y publicación de la imagen
img/
tecnologia/                       # backend, portal, pruebas de calidad y docker-compose
prototipo/                        # prototipo navegable (Google Stitch)
.github/workflows/                # CI del backend y del portal
```

## Cómo ejecutar

| Forma | Pasos | Detalle |
|---|---|---|
| **Docker** (todo con un comando) | `cd tecnologia` → `docker compose up --build -d` → abrir `http://localhost:8080` | [tecnologia/README.md](tecnologia/README.md#docker) |
| **Local** (VS Code) | PostgreSQL 16 instalado → `tecnologia/backend`: `npm install`, `npm run start:dev` → `tecnologia/frontend`: `npm install`, `npm run dev` | [backend](tecnologia/backend/README.md) · [portal](tecnologia/frontend/README.md) |

- **Portal:** `http://localhost:8080` con Docker; `http://localhost:5173` en local.
- **Swagger (contrato OpenAPI):** `http://localhost:3000/api/docs`.
- **Cuentas de demostración** (clave `demo123`): `45892014` y `70123456` (postulantes), `gestor`, `evaluador`, `supervisor`, `admin`.

## Pruebas

| Tipo | Herramienta | Comando | Resultado |
|---|---|---|---|
| Unitarias (dominio, casos de uso, adaptadores, contrato) | Jest | `npm run test:cov` (backend) | 192 pruebas, cobertura de líneas 99.7 % |
| API con PostgreSQL | Jest + Supertest | `npm run test:e2e` (backend) | 39 pruebas |
| Funcionales y de contrato | Postman + Newman | ver [postman](tecnologia/pruebas-calidad/postman/README.md) | 145 solicitudes, 506 aserciones |
| Contrato OpenAPI | `npm run contrato:verificar` | ver [guía de la API](docs/07-contrato-api/README.md) | 40 rutas y 48 operaciones; la tabla de la guía se genera desde el código |
| Asistente con IA (EQ-08) | promptfoo | ver [promptfoo](tecnologia/pruebas-calidad/promptfoo/README.md) | 30 de 30 (con Gemini y sin clave de IA) |
| Reglas de arquitectura | dependency-cruiser | `npm run arquitectura` (backend) | 0 violaciones |
| Portal en el navegador | Playwright + axe-core | `npm run e2e` (frontend) | 21 pruebas, WCAG 2.1 AA |
| Carga (9 min) | k6 | ver [evidencia](docs/06-validacion-calidad/evidencias/k6/README.md) | 2 000 usuarios sostenidos: p95 de 108.6 ms y 0 % de errores |
| Trazabilidad SDD | Jest y Playwright | ver [matriz](docs/05-especificaciones-sdd/matriz-trazabilidad.md) | 64 de 65 criterios con prueba que pasa; 1 con medición de k6 |

Resultados y capturas en [docs/06-validacion-calidad](docs/06-validacion-calidad/README.md).

## Prototipo navegable

Pantallas diseñadas con Google Stitch a partir de los requisitos funcionales (RF01–RF27): 11 de la app del postulante (celular) y 15 del sistema web del personal, por rol.

| Parte | Ubicación |
|---|---|
| Índice del prototipo | [`prototipo/index.html`](prototipo/index.html) |
| App del postulante | `prototipo/movil/` |
| Sistema web del personal | `prototipo/web/` |

Para verlo en local: abrir una terminal en `prototipo/` y ejecutar `python -m http.server 8080`, luego entrar a `http://localhost:8080`.
