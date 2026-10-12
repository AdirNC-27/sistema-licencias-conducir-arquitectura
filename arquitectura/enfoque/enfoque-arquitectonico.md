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

## ¿Por qué Clean Architecture y no Hexagonal?

| Criterio | Clean Architecture | Hexagonal | Sistema de licencias |
|---|---|---|---|
| **Cuándo usar** | Lógica de negocio compleja y crítica. | Muchas integraciones externas activas o sistemas distribuidos. | Las reglas del trámite son el centro del sistema: etapas, cupos e integridad de resultados. |
| **Integraciones** | Se resuelven con contratos del dominio implementados en infraestructura. | Son el eje del diseño. | RENIEC, SNC, banco y centro médico son **simulados** y quedan como integraciones futuras. |
| **Organización** | Capas claras y fáciles de explicar al equipo. | Núcleo, puertos y adaptadores de entrada y salida. | Equipo pequeño que necesita una estructura clara por capas. |

Por estas razones se eligió **Clean Architecture**. La inversión de dependencias que propone permite agregar en el futuro las integraciones institucionales sin modificar las reglas del trámite.

## Capas

Las capas se presentan desde el núcleo hacia los detalles externos.

### Dominio

Contiene las entidades, las reglas del negocio y los contratos del sistema:

- Postulante, expediente, requisito y documento.
- Pago, cita, evaluación y resultado.
- Estados del trámite y eventos de auditoría.
- Reglas de etapas, permisos, cupos e integridad de resultados.

El dominio no depende de Spring Boot, PostgreSQL, React ni proveedores externos.

### Aplicación

Contiene los casos de uso que coordinan el dominio:

- Crear y revisar expedientes.
- Verificar documentos y pagos.
- Programar citas.
- Registrar y validar resultados.
- Consultar el seguimiento y enviar notificaciones.

### Presentación

El portal React es un cliente externo que consume la API. La capa de Presentación del backend contiene:

- Controladores REST.
- Autenticación y autorización por roles.
- Validación de solicitudes.
- Respuestas JSON y documentación OpenAPI.

### Infraestructura

Implementa los contratos definidos en el dominio mediante:

- Spring Data JPA y PostgreSQL.
- Almacenamiento privado de documentos.
- Notificaciones y caché de información pública.
- Adaptadores para RENIEC, SNC, banco, centro médico e inteligencia artificial.

Las integraciones institucionales restringidas serán simuladas durante la primera versión académica.

## Contratos y adaptadores

Los contratos son interfaces definidas en el dominio. La infraestructura las implementa mediante adaptadores.

| Contrato del dominio | Adaptador en la primera versión | Adaptador futuro |
|---|---|---|
| `RepositorioExpedientes` | Spring Data JPA y PostgreSQL | — |
| `RepositorioEvaluaciones` | Spring Data JPA y PostgreSQL | — |
| `AlmacenamientoDocumentos` | Almacenamiento privado local | Almacenamiento compatible con S3 |
| `VerificadorIdentidad` | `SimuladorReniec` o revisión manual del gestor | Servicio autorizado de RENIEC |
| `ConsultaSNC` | `SimuladorSNC` | Integración autorizada con el SNC |
| `VerificadorPagos` | `VerificadorPagosManual` | Banco o pasarela de pagos |
| `ValidadorAptitudMedica` | `RegistroAptitudManual` | Centro médico autorizado |
| `ServicioNotificaciones` | Notificaciones internas | Correo o mensajería |
| `RegistroAuditoria` | PostgreSQL | — |
| `ServicioAsistenteVirtual` | Respuestas desde contenido aprobado | Proveedor de IA controlado |

La clase de configuración de Spring actúa como raíz de composición y selecciona qué adaptador implementa cada contrato. Así, un simulador podrá sustituirse por una integración autorizada sin cambiar el dominio.

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
6. `ServicioNotificaciones` informa al postulante.

## Diagrama del enfoque arquitectónico

![Clean Architecture aplicada al Sistema de Licencias Clase B](../../img/diagrama-clean-architecture.png)