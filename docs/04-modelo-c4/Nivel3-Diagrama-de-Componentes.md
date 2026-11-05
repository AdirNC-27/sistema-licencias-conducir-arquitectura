# Nivel 3 · Diagrama de componentes

## Objetivo

Abrir el contenedor API Licencias y mostrar sus módulos, sus adaptadores y la base de datos.

## Diagrama

![Diagrama de componentes de la API Licencias](../../img/nivel3-componentes.png)

> Archivo editable: `img/fuentes/nivel3-componentes.drawio`

## Componentes

| Componente | Responsabilidad | Requisitos |
|---|---|---|
| **API REST y seguridad** | Rutas `/api/v1`, JWT y validación | RF01 |
| **Identidad y acceso** | Usuarios y roles | RF01 |
| **Postulantes** | Datos personales y DNI | RF03, RF04 |
| **Expedientes** | Emisión, revalidación, duplicado y etapas | RF02, RF11, RF12, RF20, RF25, RF26 |
| **Requisitos y documentos** | Requisitos del TUPA y vigencia del certificado | RF22, RF23, RF24 |
| **Pagos** | Recibo del SAT | RF05, RF06 |
| **Citas** | Días de examen y cupos | RF07, RF21 |
| **Evaluaciones** | Resultados, máximo 3 intentos | RF08, RF09, RF19 |
| **Seguimiento** | Estado y plazo legal | RF10 |
| **Notificaciones** | Avisos y correo | RF13 |
| **Asistente virtual** | Orientación con IA | RF14, RF15 |
| **Administración** | Configuración y reportes | RF16, RF18 |
| **Auditoría** | Registro de operaciones | RF17 |

## Adaptadores

| Módulo | Adaptador | Servicio externo |
|---|---|---|
| Postulantes | `ApiPeruDniAdapter` | API Perú |
| Asistente virtual | `AdaptadorIA` | IA de orientación |
| Notificaciones | `NotificadorCorreo` | Correo electrónico (SMTP) |

## Reglas del monolito modular

- Todos los módulos se despliegan juntos (ADR-001).
- Un módulo usa a otro solo mediante su fachada y no accede a sus tablas.
- Cada servicio externo se conecta en un solo módulo mediante un adaptador.
