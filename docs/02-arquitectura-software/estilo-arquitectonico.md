# Estilo arquitectónico del sistema

## Estilo seleccionado

El Sistema de Licencias de Conducir Clase B utilizará un **monolito modular con arquitectura web cliente-servidor**.

El sistema se ejecutará como una sola aplicación backend desplegable, organizada en **12 módulos** con responsabilidades claramente definidas. Esta organización mantiene una implementación accesible para el equipo y facilita la modificación o evolución de cada módulo.

## Justificación

Se seleccionó un monolito modular porque se ajusta a las condiciones del proyecto: un equipo pequeño, una sola municipalidad y un trámite en el que una misma operación involucra varios módulos (por ejemplo, validar un resultado actualiza la evaluación, avanza la etapa del expediente y registra la auditoría en una sola transacción). Además, responde a la restricción RC08.

Este estilo permite:

- Mantener una sola aplicación backend desplegable.
- Separar las funcionalidades mediante módulos.
- Usar una única base de datos con separación lógica por módulo.
- Simplificar el desarrollo, las pruebas y el despliegue.
- Aplicar seguridad y auditoría de manera centralizada.
- Preparar los módulos para una posible separación futura.

## Diagrama del estilo arquitectónico

![Estilo arquitectónico del Sistema de Licencias de Conducir Clase B](../../img/estilo-arquitectonico.png)

> Archivo editable: `img/fuentes/estilo-arquitectonico.drawio`

## Cómo se lee el diagrama

1. Los **usuarios** acceden mediante un **acceso seguro**: dominio y DNS, HTTPS (certificado SSL/TLS) y CDN para los archivos estáticos.
2. El **portal web** (React + TypeScript) envía las solicitudes por **HTTPS/JSON** a la **API REST**, que valida el rol con **JWT**.
3. La API pasa la solicitud a los **casos de uso y fachadas**, que conectan los **12 módulos**.
4. Los módulos guardan la información en **PostgreSQL**, la única base de datos, y usan una **caché en memoria** para la información pública.
5. Los **adaptadores** conectan el sistema con los **servicios externos reales**.
6. El gestor **verifica en los portales oficiales** los sistemas que no ofrecen una API pública.

## Componentes principales

| Componente | Responsabilidad |
|---|---|
| **Acceso seguro** | Dominio, DNS, certificado SSL/TLS (HTTPS) y CDN para los archivos estáticos del portal. |
| **Portal web** | Interfaces para postulantes, gestores, evaluadores, supervisores y administradores. Incluye un enlace a la consulta de licencias del MTC. |
| **API REST y seguridad** | Recibir las solicitudes del portal web, autenticar con JWT y autorizar según el rol. |
| **Casos de uso y fachadas** | Coordinar los módulos; cada módulo se comunica con los demás solo mediante su fachada. |
| **Módulos** | Ejecutar las reglas del trámite de cada área funcional. |
| **Caché en memoria** | Guardar temporalmente los requisitos y las categorías públicas. No es otra base de datos. |
| **Adaptadores** | Conectar el sistema con API Perú, la IA de orientación y el correo electrónico. |
| **PostgreSQL** | Base de datos única: usuarios, expedientes, documentos, pagos, citas, resultados, estados y auditoría. |

## Tecnologías

| Componente | Tecnología |
|---|---|
| Cliente web | React y TypeScript |
| Backend | Java y Spring Boot (una sola aplicación) |
| Seguridad | Spring Security y JWT |
| Base de datos | PostgreSQL |
| Caché | Caché en memoria de Spring |
| Despliegue | Contenedor Docker |

## Módulos del monolito

- **Identidad y acceso:** autenticación, usuarios, roles y permisos.
- **Postulantes:** datos personales y validación del DNI con API Perú.
- **Expedientes:** solicitudes (emisión, revalidación y duplicado), etapas, validación del expediente y emisión.
- **Requisitos y documentos:** requisitos según el TUPA, documentos adjuntos, vigencia del certificado médico y verificación del gestor.
- **Pagos:** registro del recibo del SAT y su verificación.
- **Citas:** días de examen, cupos y elección de la cita por el postulante.
- **Evaluaciones:** resultados de los exámenes de conocimientos y de manejo, con un máximo de 3 intentos.
- **Seguimiento:** estado, historial, pendientes y plazo legal de 10 días hábiles.
- **Notificaciones:** avisos internos y recordatorios por correo electrónico.
- **Asistente virtual:** orientación con contenido aprobado mediante la IA de orientación.
- **Administración:** configuración de requisitos, días de examen, cupos, contenidos y reportes.
- **Auditoría:** registro de las operaciones y modificaciones importantes.

## Servicios externos

### Integraciones reales

| Servicio | Uso | Protocolo |
|---|---|---|
| **API Perú** | Consulta de datos del DNI | HTTPS/REST |
| **IA de orientación** | Respuestas del asistente virtual sobre contenido aprobado | HTTPS/REST |
| **Correo electrónico** | Recordatorios de examen y de vencimientos | SMTP |

### Verificación del gestor en portales oficiales

| Sistema | Qué se verifica |
|---|---|
| SNC (MTC) | Certificado médico y constancia COFIPRO |
| SAT Huamanga | Recibo de pago |
| Registro Nacional de Sanciones | Multas y sanciones pendientes |
| Sistema de gestión documental de la MPH | Número de expediente |

Estos sistemas no ofrecen una API pública. El sistema registra la verificación del gestor y queda preparado para una integración futura mediante la Plataforma de Interoperabilidad del Estado (PIDE), con convenio.

## Despliegue y seguridad

- Dominio propio y configuración de DNS.
- Certificado SSL/TLS y uso obligatorio de HTTPS.
- Frontend con CDN para los archivos estáticos.
- Backend desplegado como un contenedor Docker.
- PostgreSQL como base de datos única, con copias de seguridad periódicas.
- Variables de entorno para proteger las credenciales (token de API Perú, IA y correo).
- Contraseñas almacenadas mediante algoritmos de hash seguros.
- Caché limitada a información pública.
- Registro de operaciones en la bitácora de auditoría.

Aunque la base de datos y el CDN se ejecuten como servicios separados, el backend se mantiene como un **monolito modular**: sus 12 módulos se ejecutan y despliegan como una sola aplicación.

## Relación con los drivers

- **DA01:** control de acceso según roles.
- **DA02:** protección de datos personales.
- **DA03:** trazabilidad de las operaciones.
- **DA04:** integridad de los resultados y del trámite.
- **DA05:** mantenibilidad y evolución modular.
- **DA08:** integraciones desacopladas.
- **DA09:** rendimiento y disponibilidad.
- **DA10:** facilidad de uso y accesibilidad.
