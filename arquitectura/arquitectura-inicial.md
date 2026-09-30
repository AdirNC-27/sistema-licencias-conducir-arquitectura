# Arquitectura inicial del sistema

El sistema utilizará una **arquitectura monolítica modular** basada en principios de Clean Architecture. Esta estructura permitirá separar la interfaz, los módulos funcionales, las reglas de negocio y la infraestructura.

## Diagrama de arquitectura

```mermaid
flowchart TB
    subgraph ACTORES["ACTORES"]
        A1["Postulante"]
        A2["Gestor de trámites"]
        A3["Evaluador"]
        A4["Supervisor o validador"]
        A5["Administrador del sistema"]
    end

    ACTORES --> FRONTEND

    FRONTEND["FRONTEND WEB<br/>React + TypeScript"]

    FRONTEND --> API

    API["API REST Y SEGURIDAD<br/>Spring Boot + JWT"]

    API --> MODULOS

    MODULOS["MÓDULOS FUNCIONALES<br/><br/>Usuarios y roles<br/>Expedientes y documentos<br/>Pagos y comprobantes<br/>Citas y evaluaciones<br/>Seguimiento y validación<br/>Notificaciones internas<br/>Asistente con IA<br/>Administración y auditoría"]

    MODULOS --> CASOS

    CASOS["CASOS DE USO<br/>Procesos y flujo del sistema"]

    CASOS --> DOMINIO

    DOMINIO["DOMINIO<br/>Entidades y reglas de negocio"]

    DOMINIO --> INFRA

    INFRA["INFRAESTRUCTURA Y ADAPTADORES"]

    INFRA --> DB[("PostgreSQL")]
    INFRA --> ARCHIVOS["Almacenamiento privado<br/>Documentos y comprobantes"]
    INFRA --> IA["Servicio de inteligencia artificial"]

    FUTURO["INTEGRACIONES FUTURAS<br/>RENIEC · SNC · Servicios bancarios"]

    INFRA -. "Fuera del MVP" .-> FUTURO
```

## Componentes principales

- **Frontend:** presenta los paneles según el rol del usuario.
- **API REST:** recibe solicitudes y controla la autenticación y los permisos.
- **Módulos funcionales:** gestionan expedientes, pagos, citas, evaluaciones, seguimiento e inteligencia artificial.
- **Dominio:** contiene las reglas principales del trámite.
- **Infraestructura:** administra la base de datos, archivos y servicios externos.
- **Asistente con IA:** brinda orientación, pero no aprueba trámites ni modifica resultados.

## Tecnologías propuestas

| Componente | Tecnología |
|---|---|
| Frontend | React y TypeScript |
| Backend | Java y Spring Boot |
| Seguridad | Spring Security y JWT |
| Base de datos | PostgreSQL |
| Inteligencia artificial | API de un modelo de lenguaje |
| Despliegue | Docker y Docker Compose |