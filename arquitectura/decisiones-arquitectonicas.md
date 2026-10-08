# Decisiones arquitectónicas

Las decisiones arquitectónicas establecen las soluciones técnicas adoptadas para responder a los drivers del Sistema de Licencias de Conducir Clase B.

| ID | Decisión arquitectónica | Drivers relacionados | Justificación | Resultado |
|---|---|---|---|---|
| **ADR-001** | Implementar un monolito modular | DA05, DA09 | Permite organizar las funcionalidades en módulos con responsabilidades definidas, manteniendo una sola aplicación desplegable y una complejidad operativa accesible para el proyecto. | Módulos de identidad, postulantes, expedientes, requisitos, pagos, citas, evaluaciones, seguimiento, notificaciones, asistente virtual, administración y auditoría. |
| **ADR-002** | Aplicar Clean Architecture con puertos y adaptadores | DA05, DA08 | Separa las reglas del negocio de la interfaz web, la base de datos y los servicios externos. Facilita las modificaciones, pruebas y futuras integraciones. | Capas de Presentación, Aplicación, Dominio e Infraestructura, con interfaces para las dependencias externas. |
| **ADR-003** | Utilizar una API REST entre el frontend y el backend | DA05, DA09, DA10 | Establece una comunicación clara entre el portal web y la aplicación, permitiendo separar la interfaz de usuario de la lógica del sistema. | Endpoints organizados por módulos y transferencia de información mediante JSON sobre HTTPS. |
| **ADR-004** | Implementar autenticación y autorización basada en roles | DA01, DA02 | Las funciones y los datos deben estar disponibles únicamente para los usuarios autorizados según sus responsabilidades. | Roles de postulante, gestor, evaluador, supervisor y administrador, con permisos diferenciados. |
| **ADR-005** | Utilizar una base de datos PostgreSQL centralizada | DA02, DA03, DA04, DA06 | Las operaciones relacionadas con expedientes, pagos, citas y evaluaciones requieren integridad, consistencia y relaciones transaccionales. | Base de datos central con separación lógica de tablas y responsabilidades por módulos. |
| **ADR-006** | Registrar las operaciones importantes en una bitácora de auditoría | DA03, DA04 | Es necesario conocer quién realizó una acción, cuándo la realizó y qué información fue modificada. | Registro de cambios de documentos, pagos, resultados, estados y acciones administrativas. |
| **ADR-007** | Integrar servicios externos mediante interfaces y adaptadores | DA07, DA08 | Evita que la lógica principal dependa directamente de RENIEC, SNC, bancos, correo, almacenamiento o proveedores de inteligencia artificial. | Adaptadores sustituibles y servicios simulados durante la primera versión del proyecto. |
| **ADR-008** | Proteger las comunicaciones y los documentos | DA02, DA06 | El sistema manejará información personal, médica, documentos de identidad y comprobantes de pago. | Uso obligatorio de HTTPS, validación de archivos, permisos de acceso y almacenamiento privado. |
| **ADR-009** | Aplicar caché únicamente a información pública | DA09, DA10 | Las categorías, requisitos y contenidos informativos pueden consultarse repetidamente sin acceder siempre a la base de datos. Los datos personales no deben almacenarse en caché pública. | Caché para contenido público y encabezados de control que impidan almacenar información sensible. |
| **ADR-010** | Desplegar la aplicación mediante contenedores | DA05, DA09 | Los contenedores permiten mantener una configuración reproducible y simplifican la instalación del monolito en diferentes proveedores. | Frontend, backend y servicios necesarios configurados para un despliegue controlado. |
| **ADR-011** | Utilizar dominio propio, DNS, certificado SSL/TLS y CDN | DA02, DA09, DA10 | El sistema debe ofrecer acceso seguro, una dirección reconocible y una entrega eficiente de los archivos estáticos. | Dominio propio, HTTPS, configuración DNS y distribución de recursos públicos mediante CDN. |

## Relación general de las decisiones

El sistema se implementará como un monolito modular para reducir la complejidad de desarrollo y despliegue. Internamente utilizará Clean Architecture con puertos y adaptadores para mantener separadas las reglas del negocio, los casos de uso y las tecnologías externas.

El portal web se comunicará con el backend mediante una API REST protegida con HTTPS. El acceso a las funciones se controlará mediante autenticación y roles. PostgreSQL almacenará la información transaccional, mientras que los documentos se conservarán en almacenamiento privado.

La caché y el CDN se utilizarán exclusivamente para contenido público y archivos estáticos. Las futuras conexiones con instituciones y proveedores externos se implementarán mediante adaptadores sustituibles.