# Identificación de actores

**Objetivo:** identificar a las personas que interactúan directamente con el Sistema de Licencias de Conducir. Los actores corresponden a los roles reales identificados en el TUPA de la MPH y en la entrevista realizada en el MAC Ayacucho.

| Actor | Quién es en la realidad | ¿Qué necesita realizar? |
|---|---|---|
| **Postulante** | Ciudadano que tramita su licencia II-B o II-C | Registrar su solicitud (emisión, revalidación o duplicado), adjuntar sus documentos y su recibo de pago, consultar qué le falta y su siguiente paso, revisar sus citas y resultados, y recibir recordatorios y alertas de vencimiento. |
| **Gestor de trámites** | Personal de ventanilla de la MPH en el MAC | Registrar el expediente, verificar la identidad mediante la consulta de DNI, revisar los documentos y el recibo del SAT, verificar los registros del SNC y del Registro Nacional de Sanciones, y programar los exámenes. |
| **Evaluador** | Examinador de la Subgerencia de Tránsito y Seguridad Vial | Registrar los resultados del examen de conocimientos y del examen de manejo, con un máximo de 3 intentos por examen. |
| **Supervisor** | Subgerencia de Tránsito y Seguridad Vial | Revisar el expediente completo, aprobarlo u observarlo, autorizar la emisión de la licencia y controlar el plazo legal de 10 días hábiles. |
| **Administrador del sistema** | Personal de tecnologías de la información de la MPH | Administrar cuentas, roles y permisos; configurar los requisitos por trámite y categoría, los días de examen, los cupos, los contenidos informativos y el asistente virtual; consultar la auditoría y los reportes. |

## Exámenes a cargo del evaluador

| Examen | Días | Regla |
|---|---|---|
| **Conocimientos** | Lunes a miércoles | Máximo 3 intentos. Las preguntas las proporciona el MTC |
| **Manejo** | Martes a viernes | Solo después de aprobar el examen de conocimientos. Máximo 3 intentos |

El **certificado médico** no lo evalúa la municipalidad: lo emite una **clínica autorizada por el MTC** y se registra en el SNC. El sistema lo verifica en el SNC y controla su vigencia de 6 meses.

## Responsabilidades relacionadas con los pagos

El postulante realiza un **pago único** en el **SAT Huamanga**, que incluye los dos exámenes:

| Trámite | Monto |
|---|---|
| Emisión II-B | S/ 69.90 |
| Emisión II-C | S/ 69.40 |
| Revalidación | S/ 59.70 |
| Duplicado | S/ 38.10 |

El postulante registra en el sistema el **número de recibo** y adjunta el comprobante. El gestor lo verifica y registra uno de los siguientes estados:

- Pendiente de verificación.
- Verificado.
- Observado.
- Rechazado.

El sistema conserva el usuario, la fecha y la observación de cada verificación.

## Asistente virtual con inteligencia artificial

El asistente virtual es un componente de apoyo de la plataforma y no un actor humano. Permite:

- Responder preguntas frecuentes.
- Explicar los requisitos y los pasos del proceso.
- Explicar las observaciones del expediente.
- Informar las actividades pendientes.
- Derivar consultas al gestor cuando no pueda responder.

El asistente no aprueba expedientes, no verifica pagos, no registra resultados y no autoriza licencias.

## Sistemas externos

| Sistema | Uso en el sistema | Primera versión |
|---|---|---|
| **API Perú** | Consulta de datos del DNI | **Integración real** (servicio con token) |
| **SNC (MTC)** | Verificar el certificado médico y el COFIPRO, y registrar la licencia emitida | Simulado |
| **Registro Nacional de Sanciones** | Verificar que no existan multas ni sanciones pendientes | Simulado |
| **SAT Huamanga** | Pago del derecho de trámite | Simulado; el gestor verifica el recibo |
| **Sistema de gestión documental de la MPH** | Registro del expediente en mesa de partes | Simulado |
| **Proveedor de IA** | Respuestas del asistente sobre contenido aprobado | Integración controlada |

Las integraciones simuladas requieren un convenio institucional y se reemplazarán por adaptadores reales sin modificar las reglas del trámite.
