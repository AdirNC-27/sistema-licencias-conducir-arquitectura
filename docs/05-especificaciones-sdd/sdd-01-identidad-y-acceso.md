# SDD-01 · Identidad y acceso

| Requisitos | Relación con la arquitectura | Estado |
|---|---|---|
| RF01, RF16 | DA01 · ADR-004 · EQ-01 | Implementado (sprint 2) |

## Historia

Como **usuario del sistema** quiero iniciar sesión con un solo formulario para entrar al panel de mi rol, sin elegir el rol yo mismo.

## Criterios de aceptación

| # | Escenario | Dado | Cuando | Entonces |
|---|---|---|---|---|
| CA1 | Inicio de sesión correcto | existe la cuenta `gestor` con clave `demo123` | envía `POST /api/auth/login` | recibe 200 con un token JWT que incluye el rol GESTOR |
| CA2 | Clave incorrecta | la cuenta existe | envía una clave distinta | recibe 401 y ningún token |
| CA3 | Rol sin permiso | un evaluador tiene un token válido | llama a `PATCH /api/expedientes/{id}/emision` | recibe 403 y no cambia nada |
| CA4 | Sin token | no envía el encabezado Authorization | llama a un endpoint protegido | recibe 401 |
| CA5 | Cambio de rol auditado | el administrador inicia sesión | cambia el rol de una cuenta del personal | el rol cambia y queda un registro CAMBIAR_ROL en auditoría |

## Tareas técnicas

- [x] Entidad `Usuario` y contratos `RepositorioUsuarios`, `CifradorClaves`, `EmisorTokens`
- [x] Casos de uso `IniciarSesionUseCase` y `CambiarRolUseCase`
- [x] Adaptadores `CifradorBcrypt` y `EmisorTokensJwt`
- [x] Guardas globales `GuardaJwt` y `GuardaRoles` con los decoradores `@Roles()` y `@Publico()`
- [x] Cuentas de demostración en la migración de datos iniciales

## Endpoints (Swagger: `/api/docs`)

| Método | Ruta | Rol |
|---|---|---|
| POST | `/api/auth/login` | Público |
| GET | `/api/auth/yo` | Autenticado |
| GET | `/api/usuarios` | ADMINISTRADOR |
| PATCH | `/api/usuarios/{id}/rol` | ADMINISTRADOR |

## Pruebas que lo comprueban

- `modulos/identidad/__tests__/identidad.spec.ts`
- `test/flujo-tramite.e2e-spec.ts` (bloque Seguridad: 401 y matriz de 403)
