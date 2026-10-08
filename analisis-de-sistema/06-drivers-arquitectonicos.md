# Drivers arquitectónicos

Los drivers arquitectónicos son los requisitos, atributos de calidad y restricciones que influyen directamente en las decisiones de arquitectura del Sistema de Licencias de Conducir Clase B.

| ID | Driver arquitectónico | Origen | Impacto en la arquitectura |
|---|---|---|---|
| **DA01** | Control de acceso según roles | RF01, RF16, AC01 | La plataforma debe implementar autenticación y autorización para postulantes, gestores, evaluadores, supervisores y administradores. |
| **DA02** | Protección de datos personales y médicos | AC02, RC10 | Los datos sensibles deben almacenarse de forma segura, transmitirse mediante HTTPS y ser accesibles únicamente por usuarios autorizados. |
| **DA03** | Trazabilidad de las operaciones | RF17, AC07 | Las modificaciones de documentos, pagos, evaluaciones y estados deben registrarse en un módulo de auditoría. |
| **DA04** | Integridad de los resultados | RF08, RF09, RF11 | Los resultados podrán corregirse antes de su validación, pero deberán bloquearse después de ser aprobados por el supervisor. |
| **DA05** | Mantenibilidad y evolución modular | AC06, RC08 | El sistema debe permitir modificar requisitos, categorías, etapas y funcionalidades sin afectar innecesariamente otros módulos. Esto influye en la separación de responsabilidades, modularidad y control de dependencias. |
| **DA06** | Verificación manual de pagos e identidad | RF04, RF05, RF06, RC02, RC04 | El sistema debe permitir adjuntar documentos y comprobantes para que el gestor realice su revisión manual. |
| **DA07** | Asistente virtual controlado | RF14, RF15, AC08, RC06 | La IA debe utilizar información aprobada, limitarse a brindar orientación y derivar las consultas cuando no disponga de una respuesta confiable. |
| **DA08** | Integraciones institucionales desacopladas | RC03 | Las conexiones futuras con RENIEC, el SNC, bancos u otros sistemas deberán implementarse mediante interfaces y adaptadores sin modificar la lógica principal. |
| **DA09** | Rendimiento y disponibilidad | AC03, AC04 | La solución debe responder oportunamente, utilizar caché solamente para información pública y permitir la recuperación ante fallos mediante respaldos periódicos. |
| **DA10** | Facilidad de uso y accesibilidad | AC05 | Las interfaces deben mostrar pasos, estados, observaciones y acciones pendientes de forma clara para reducir los errores de los usuarios. |

## Decisiones arquitectónicas derivadas

A partir de los drivers identificados, se plantean inicialmente las siguientes decisiones:

- Utilizar un monolito modular como estilo arquitectónico principal.
- Aplicar Clean Architecture con principios de puertos y adaptadores.
- Implementar una API REST para la comunicación entre el frontend y el backend.
- Utilizar autenticación y control de acceso basado en roles.
- Mantener una base de datos central con separación lógica por módulos.
- Registrar las operaciones importantes en una bitácora de auditoría.
- Utilizar interfaces y adaptadores para servicios externos o simulados.
- Limitar el asistente virtual a funciones de orientación.
- Proteger los documentos y datos sensibles mediante permisos, cifrado y conexiones HTTPS.
- Utilizar caché para información pública que no contenga datos personales.
- Desplegar la solución mediante contenedores para facilitar su instalación y mantenimiento.
- Preparar el sistema para utilizar dominio propio, DNS, certificado SSL/TLS y CDN.