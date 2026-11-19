# SDD-02 · Registro del postulante con DNI

| Requisitos | Relación con la arquitectura | Estado |
|---|---|---|
| RF03, RF04 | DA06 · DA08 · ADR-012 | Implementado (sprint 2) |

## Historia

Como **postulante** quiero crear mi cuenta con mi DNI para que el sistema complete mis nombres sin errores.

## Criterios de aceptación

| # | Escenario | Dado | Cuando | Entonces |
|---|---|---|---|---|
| CA1 | Registro correcto | el DNI tiene 8 dígitos y existe en API Perú | envía `POST /api/postulantes` | se crea el postulante con los nombres de API Perú y una cuenta con rol POSTULANTE |
| CA2 | DNI repetido | el DNI ya tiene cuenta | intenta registrarse otra vez | recibe 409 |
| CA3 | DNI inválido | el DNI tiene menos de 8 dígitos | envía el formulario | recibe 400 y no se consulta API Perú |

## Tareas técnicas

- [x] Objeto de valor `Dni` y entidad `Postulante`
- [x] Contrato `VerificadorIdentidad` y adaptador `ApiPeruDniAdapter` (patrón Adapter)
- [x] Caso de uso `RegistrarPostulanteUseCase`, que crea también la cuenta en Identidad
- [x] Variable `APIPERU_TOKEN` en `.env`

## Endpoints (Swagger: `/api/docs`)

| Método | Ruta | Rol |
|---|---|---|
| POST | `/api/postulantes` | Público |

## Pruebas que lo comprueban

- `modulos/postulantes/__tests__/postulantes.spec.ts`
- `test/flujo-tramite.e2e-spec.ts` (registro y DNI repetido)
