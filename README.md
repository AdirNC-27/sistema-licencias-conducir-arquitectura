# Sistema de Licencias de Conducir Clase B

## Integrantes

- Adir Alejandro Navarro Cordero
- Edths Yhurdin Prado Gomez

## Curso

Arquitectura de Software (IS-488)

## Caso de estudio

Proceso de obtención de licencias de conducir clase B (categorías II-B y II-C) en la provincia de Huamanga.

## Descripción

Plataforma web académica para la gestión del trámite de licencias de conducir clase B. Centraliza el expediente digital del postulante y coordina la verificación manual de documentos y pagos, la programación de citas, el registro y la validación de evaluaciones, el seguimiento del trámite, las notificaciones y la auditoría de las operaciones.

> **Prototipo académico:** no emite licencias con validez legal. Las integraciones con RENIEC, el Sistema Nacional de Conductores, bancos y centros médicos se representan mediante adaptadores simulados.

## Arquitectura

| Aspecto | Decisión |
|---|---|
| Estilo arquitectónico | Monolito modular con arquitectura web cliente-servidor |
| Enfoque arquitectónico | Clean Architecture con puertos y adaptadores |
| Frontend | React y TypeScript |
| Backend | Java y Spring Boot, con Spring Security y JWT |
| Base de datos | PostgreSQL |
| Despliegue | Contenedores Docker |

## Estructura del repositorio

```
analisis-de-sistema/
├── 00-problematica.md
├── 01-actores.md
├── 02-historias-de-usuario.md
├── 03-requisitos-funcionales.md
├── 04-atributos-de-calidad.md
├── 05-restricciones.md
└── 06-drivers-arquitectonicos.md
arquitectura/
├── arquitectura-inicial.md
├── decisiones-arquitectonicas.md
├── estilo-arquitectonico.md
├── imagenes/estilo-arquitectonico.png
└── enfoque/
    ├── enfoque-arquitectonico.md
    └── diagrama-clean-architecture.png
```