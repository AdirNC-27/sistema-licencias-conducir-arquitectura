# Identificación de actores

**Objetivo:** identificar a las personas que interactúan directamente con el Sistema de Licencias de Conducir.

| Actor | ¿Qué necesita realizar? |
|---|---|
| **Postulante** | Registrar su solicitud, proporcionar sus datos, adjuntar documentos y comprobantes de pago, consultar observaciones, revisar citas, rendir las evaluaciones programadas, consultar sus resultados, recibir notificaciones y realizar el seguimiento de su trámite. |
| **Gestor de trámites** | Revisar las solicitudes, verificar documentos y comprobantes de pago, formular observaciones, registrar o programar citas, controlar el avance del expediente y comunicar al postulante las actividades pendientes. |
| **Evaluador** | Consultar las evaluaciones asignadas y registrar resultados según su especialidad: evaluación médica y psicológica, evaluación de conocimientos o evaluación de habilidades en la conducción. |
| **Supervisor o validador** | Revisar que los documentos, pagos y evaluaciones estén completos, validar el expediente, aprobar u observar el trámite y autorizar el paso a la emisión simulada de la licencia. |
| **Administrador del sistema** | Administrar cuentas, roles, permisos, categorías, requisitos, preguntas, avisos, parámetros y configuraciones. También consulta registros de auditoría y supervisa el funcionamiento general de la plataforma. |

## Especialidades del evaluador

El actor **Evaluador** utilizará una misma interfaz general, pero tendrá permisos según la especialidad asignada:

| Especialidad | Responsabilidad |
|---|---|
| **Evaluación médica y psicológica** | Registrar la condición de apto, no apto u observado, junto con las restricciones u observaciones, a partir del certificado emitido por el centro médico autorizado. |
| **Evaluación de conocimientos** | Gestionar la evaluación teórica y registrar el puntaje y el resultado obtenido. |
| **Evaluación de manejo** | Registrar la calificación de las maniobras evaluadas y el resultado de la prueba de conducción. |

Cada evaluador solamente podrá acceder y modificar las evaluaciones correspondientes a su especialidad.

## Responsabilidades relacionadas con los pagos

El postulante realizará el pago mediante un canal externo autorizado y registrará:

- Concepto del pago.
- Monto pagado.
- Fecha de la operación.
- Número de operación.
- Comprobante digital.

El gestor de trámites verificará el comprobante y registrará uno de los siguientes estados:

- Pendiente de verificación.
- Verificado.
- Observado.
- Rechazado.

El sistema conservará el usuario, la fecha y la observación relacionada con la verificación.

## Asistente virtual con inteligencia artificial

El asistente virtual con inteligencia artificial será un componente de apoyo de la plataforma y no un actor humano. Permitirá:

- Responder preguntas frecuentes.
- Explicar requisitos y etapas.
- Orientar sobre documentos y pagos.
- Explicar observaciones del expediente.
- Informar las actividades pendientes.
- Derivar consultas al gestor cuando no pueda responder.

El asistente no aprobará expedientes, no verificará pagos, no calificará evaluaciones y no autorizará licencias.

## Sistemas externos

RENIEC, el Sistema Nacional de Conductores, los servicios bancarios, los centros médicos y otros sistemas estatales no serán actores conectados en el MVP. Sus posibles integraciones serán representadas mediante servicios simulados, debido a que requieren autorización y acceso institucional.