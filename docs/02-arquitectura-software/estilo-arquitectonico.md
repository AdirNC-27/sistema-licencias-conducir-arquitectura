# Estilo arquitectónico del sistema

## Monolito modular cliente-servidor

El sistema es una sola aplicación backend (Spring Boot) dividida en 12 módulos, con un portal web en React y una base de datos PostgreSQL.

Se eligió porque es una sola municipalidad, el equipo es pequeño y un mismo trámite usa varios módulos a la vez (RC08, ADR-001).

| Parte | Tecnología | Función |
|---|---|---|
| **Cliente** | Portal web en React + TypeScript | Interfaz para los 5 roles en el navegador |
| **Servidor** | Monolito Spring Boot, 12 módulos | Reglas del trámite, seguridad JWT y adaptadores |
| **Datos** | PostgreSQL | Una sola base de datos con expedientes y documentos |

## Diagrama del estilo arquitectónico

![Estilo arquitectónico del Sistema de Licencias de Conducir Clase B](../../img/estilo-arquitectonico.png)

> Archivo editable: `img/fuentes/estilo-arquitectonico.drawio`
