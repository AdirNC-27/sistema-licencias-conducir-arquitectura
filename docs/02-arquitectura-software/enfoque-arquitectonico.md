# Enfoque arquitectónico

## Enfoque seleccionado

El Sistema de Licencias de Conducir Clase B utilizará **Clean Architecture** (arquitectura limpia). Este enfoque separa las reglas del negocio de la interfaz web, la base de datos y los servicios externos.

Esta decisión responde a **DA05 (mantenibilidad y evolución modular)** y **DA08 (integraciones institucionales desacopladas)**, y se encuentra registrada en **ADR-002**.

| Elemento | Aplicación en el sistema |
|---|---|
| **Enfoque** | Clean Architecture. |
| **Objetivo** | Separar responsabilidades y dirigir las dependencias hacia el dominio. |
| **Problema que resuelve** | Evita el acoplamiento entre Spring Boot, PostgreSQL, el cliente React y los servicios externos. |
| **Capas del backend** | Presentación, Aplicación, Dominio e Infraestructura. |
| **Beneficio principal** | Permite sustituir tecnologías e integraciones sin modificar las reglas principales. |

## ¿Por qué Clean Architecture en este sistema?

| Necesidad del sistema | Cómo la resuelve Clean Architecture | Driver |
|---|---|---|
| Las reglas del trámite son el centro del sistema: etapas, cupos e integridad de resultados | Las reglas viven en el **dominio**, aisladas de la web, la base de datos y los servicios externos | DA04 |
| El sistema se conecta con API Perú, una IA de orientación y el correo, y en el futuro con el SNC y el SAT | El dominio define **contratos** y la infraestructura los implementa con **adaptadores**; un nuevo servicio se agrega sin tocar las reglas | DA08 |
| Los requisitos, categorías y etapas pueden cambiar | Cada capa tiene una responsabilidad; un cambio se concentra en un solo lugar | DA05 |
| Las reglas críticas deben poder probarse | El dominio no depende de Spring Boot ni de PostgreSQL, por lo que se prueba con pruebas unitarias | EQ-09 |
| El equipo es pequeño | Las cuatro capas (presentación, aplicación, dominio e infraestructura) dan una estructura clara y uniforme para los 12 módulos | DA05 |

La inversión de dependencias de Clean Architecture permite agregar en el futuro las integraciones institucionales sin modificar las reglas del trámite.

## Capas

Las capas se presentan desde el núcleo hacia los detalles externos.

### Dominio

Contiene las entidades, las reglas del negocio y los contratos del sistema:

- Postulante, expediente, requisito y documento.
- Pago, cita, evaluación, resultado y licencia.
- Estados del trámite y eventos de auditoría.
- Reglas del trámite: máximo 3 intentos por examen, vigencia de 6 meses del certificado médico, examen de manejo solo después de aprobar el de conocimientos, cupos y bloqueo de resultados validados.

El dominio no depende de Spring Boot, PostgreSQL, React ni proveedores externos.

### Aplicación

Contiene los casos de uso que coordinan el dominio:

- Registrar solicitudes (emisión, revalidación y duplicado).
- Verificar requisitos, documentos y pagos.
- Elegir y reprogramar citas de examen.
- Registrar y validar resultados.
- Emitir la licencia.
- Consultar el seguimiento y enviar recordatorios.

### Presentación

El portal React es un cliente externo que consume la API. La capa de Presentación del backend contiene:

- Controladores REST.
- Autenticación y autorización por roles.
- Validación de solicitudes.
- Respuestas JSON y documentación OpenAPI.

### Infraestructura

Implementa los contratos definidos en el dominio mediante:

- Spring Data JPA y PostgreSQL (base de datos única, incluidos los documentos).
- Caché en memoria de la información pública.
- Adaptadores reales: `ApiPeruDniAdapter` (DNI), `AdaptadorIA` (asistente virtual) y `NotificadorCorreo` (SMTP).

El SNC, el SAT y el Registro Nacional de Sanciones no ofrecen una API pública: el gestor los verifica en sus portales oficiales y el sistema registra esa verificación. Su integración futura se haría con un nuevo adaptador.

## Contratos y adaptadores

Los contratos son interfaces definidas en el dominio. La infraestructura las implementa mediante adaptadores.

| Contrato del dominio | Implementación | Tipo |
|---|---|---|
| `RepositorioExpedientes` | Spring Data JPA y PostgreSQL | Persistencia |
| `RepositorioEvaluaciones` | Spring Data JPA y PostgreSQL | Persistencia |
| `RegistroAuditoria` | Tabla de auditoría en PostgreSQL | Persistencia |
| `VerificadorIdentidad` | `ApiPeruDniAdapter` | Integración real |
| `AsistenteIA` | `AdaptadorIA` | Integración real |
| `ServicioNotificaciones` | `NotificadorCorreo` (SMTP) y avisos internos | Integración real |
| `VerificacionRegistros` | Registro de la verificación del gestor (SNC, SAT, sanciones) | Futuro adaptador vía PIDE |

La clase de configuración de Spring actúa como raíz de composición y selecciona qué adaptador implementa cada contrato. Así, cuando exista un convenio, la verificación del gestor podrá reemplazarse por una integración automática sin cambiar el dominio.

## Regla de dependencia

Las dependencias del código apuntan hacia el dominio:

```text
Cliente React ──HTTPS/JSON──► Presentación
Presentación ───────────────► Aplicación ───────────────► Dominio
Infraestructura ────────────► Contratos definidos en el Dominio
```

## Ejemplo: validar un resultado

1. El supervisor solicita la validación desde el cliente web.
2. El controlador ejecuta el caso de uso `ValidarResultado`.
3. El dominio verifica las reglas y bloquea el resultado validado.
4. `RepositorioEvaluaciones` guarda el cambio mediante PostgreSQL.
5. `RegistroAuditoria` registra la operación.
6. `ServicioNotificaciones` informa al postulante por correo electrónico.

## Diagrama del enfoque arquitectónico

![Clean Architecture aplicada al Sistema de Licencias Clase B](../../img/diagrama-clean-architecture.png)

> Archivo editable: `img/fuentes/diagrama-clean-architecture.drawio`