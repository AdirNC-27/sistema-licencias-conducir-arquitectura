# Arquitectura inicial del sistema

El sistema utilizará una **arquitectura monolítica modular** organizada internamente con Clean Architecture. Esta estructura separa la interfaz, los módulos funcionales, las reglas del trámite y la infraestructura.

> **Nota:** esta es la primera propuesta del Laboratorio 2. Los ocho grupos de módulos se refinaron después en los **12 módulos** del estilo arquitectónico y del diagrama de componentes (C4 nivel 3), y las integraciones se ajustaron con la investigación de campo.

## Diagrama de arquitectura

```mermaid
flowchart TB
    subgraph ACTORES["ACTORES"]
        A1["Postulante"]
        A2["Gestor de trámites"]
        A3["Evaluador"]
        A4["Supervisor"]
        A5["Administrador"]
    end

    ACTORES --> ACCESO["ACCESO SEGURO<br/>Dominio y DNS · HTTPS · CDN"]
    ACCESO --> FRONTEND["PORTAL WEB<br/>React + TypeScript"]
    FRONTEND -- "HTTPS / JSON" --> API["API REST Y SEGURIDAD<br/>Spring Boot + JWT"]

    API --> MODULOS["MÓDULOS FUNCIONALES<br/><br/>Identidad · Postulantes · Expedientes<br/>Requisitos y documentos · Pagos · Citas<br/>Evaluaciones · Seguimiento · Notificaciones<br/>Asistente virtual · Administración · Auditoría"]
    MODULOS --> CASOS["CASOS DE USO"]
    CASOS --> DOMINIO["DOMINIO<br/>Entidades y reglas del trámite"]

    INFRA["INFRAESTRUCTURA Y ADAPTADORES<br/>Caché en memoria"]
    INFRA -. "implementa contratos" .-> DOMINIO

    INFRA --> DB[("PostgreSQL<br/>base de datos única")]
    INFRA -- "HTTPS/REST" --> APIPERU["API Perú<br/>consulta de DNI"]
    INFRA -- "HTTPS/REST" --> IA["IA de orientación"]
    INFRA -- "SMTP" --> CORREO["Correo electrónico<br/>recordatorios"]

    GESTOR["Verificación del gestor en portales oficiales<br/>SNC · SAT · Registro Nacional de Sanciones"]
    A2 -. "verifica" .-> GESTOR
```

> En el diagrama, las flechas continuas indican el flujo de las solicitudes. La flecha discontinua entre infraestructura y dominio indica que la infraestructura implementa los contratos del dominio: las dependencias del código apuntan hacia el dominio.

## Componentes principales

- **Acceso seguro:** dominio, DNS, certificado SSL/TLS y CDN.
- **Portal web:** presenta los paneles según el rol del usuario.
- **API REST:** recibe las solicitudes y controla la autenticación y los permisos.
- **Módulos funcionales:** gestionan expedientes, requisitos, pagos, citas, evaluaciones, seguimiento y notificaciones.
- **Dominio:** contiene las reglas del trámite (3 intentos, vigencia del certificado, orden de los exámenes y bloqueo de resultados).
- **Infraestructura:** administra la base de datos, la caché y los adaptadores de los servicios externos.

## Integraciones

| Servicio | Tipo |
|---|---|
| API Perú (consulta de DNI) | Integración real |
| IA de orientación | Integración real |
| Correo electrónico (SMTP) | Integración real |
| SNC, SAT y Registro Nacional de Sanciones | Verificación del gestor en portales oficiales |

## Tecnologías propuestas

| Componente | Tecnología |
|---|---|
| Frontend | React y TypeScript |
| Backend | Java y Spring Boot |
| Seguridad | Spring Security y JWT |
| Base de datos | PostgreSQL |
| Inteligencia artificial | API de un modelo de lenguaje |
| Despliegue | Docker y Docker Compose |
