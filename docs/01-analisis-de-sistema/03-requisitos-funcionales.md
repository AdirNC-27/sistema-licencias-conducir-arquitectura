# Requisitos funcionales

Los requisitos funcionales definen las principales operaciones que debe proporcionar el Sistema de Licencias de Conducir.

| Origen | Requisitos |
|---|---|
| Análisis inicial | RF01–RF18 |
| Prototipo navegable | RF19–RF22 |
| Investigación de campo (TUPA y entrevista en el MAC) | RF23–RF27 |

| ID | Módulo | Requisito funcional | Historias relacionadas |
|---|---|---|---|
| **RF01** | Identidad y acceso | El sistema debe permitir el registro, inicio de sesión y acceso a funciones según el rol asignado. | HU01, HU23 |
| **RF02** | Expedientes | El sistema debe permitir al postulante registrar una solicitud eligiendo el tipo de trámite (emisión, revalidación o duplicado) y la categoría de licencia, y obtener un número de trámite. | HU02 |
| **RF03** | Postulantes / Requisitos y documentos | El sistema debe permitir al postulante registrar sus datos personales y adjuntar los documentos requeridos. | HU03, HU04, HU05 |
| **RF04** | Requisitos y documentos | El sistema debe permitir al gestor verificar la identidad mediante la consulta de DNI (API Perú) y aprobar, observar o rechazar los documentos del expediente. | HU12, HU13 |
| **RF05** | Pagos | El sistema debe permitir al postulante registrar los datos de la operación y adjuntar el comprobante de pago. | HU06 |
| **RF06** | Pagos | El sistema debe permitir al gestor marcar un pago como pendiente, verificado, observado o rechazado. | HU14 |
| **RF07** | Citas | El sistema debe permitir al gestor programar o reprogramar citas y al postulante consultar las fechas asignadas. | HU07, HU15 |
| **RF08** | Evaluaciones | El sistema debe permitir al evaluador registrar los resultados y observaciones de los exámenes de conocimientos y de manejo, con un máximo de 3 intentos por examen. | HU17, HU18 |
| **RF09** | Evaluaciones | El sistema debe permitir corregir un resultado antes de su validación y bloquear su modificación después de ser validado. | HU19, HU20 |
| **RF10** | Seguimiento | El sistema debe actualizar y mostrar el estado, historial y actividades pendientes del trámite, y controlar el plazo legal de 10 días hábiles. | HU10, HU16 |
| **RF11** | Expedientes | El sistema debe permitir al supervisor revisar, observar o validar el expediente completo. | HU20, HU21 |
| **RF12** | Expedientes | El sistema debe permitir autorizar y registrar de forma simulada la emisión y entrega de la licencia cuando el expediente esté conforme, sin validez oficial (RC05). | HU22 |
| **RF13** | Notificaciones | El sistema debe generar notificaciones internas por observaciones, pagos, citas, evaluaciones y cambios de estado, recordatorios de examen y avisos de revalidación de la licencia. | HU08 |
| **RF14** | Asistente virtual | El sistema debe proporcionar un asistente virtual que responda preguntas sobre requisitos, pagos, evaluaciones y estado del trámite. | HU11 |
| **RF15** | Asistente virtual | El asistente debe utilizar contenido aprobado y derivar la consulta al gestor cuando no pueda responder de manera confiable. | HU11, HU25 |
| **RF16** | Administración | El sistema debe permitir gestionar cuentas, roles, permisos, categorías, requisitos, montos, preguntas y contenidos informativos. | HU23, HU24, HU25 |
| **RF17** | Auditoría | El sistema debe registrar el usuario, la fecha y la acción realizada en las operaciones importantes. | HU26 |
| **RF18** | Administración | El sistema debe generar reportes sobre solicitudes, pagos, citas, evaluaciones y estados de los trámites. | HU27 |
| **RF19** | Evaluaciones | El sistema debe permitir al postulante consultar los resultados validados de sus evaluaciones. | HU09 |
| **RF20** | Expedientes | El sistema debe controlar la secuencia de etapas del trámite e impedir avanzar a una etapa si la anterior no fue aprobada. | HU10, HU16 |
| **RF21** | Citas | El sistema debe permitir configurar los días de examen (conocimientos de lunes a miércoles y manejo de martes a viernes), horarios y cupos, e impedir asignar citas cuando no existan cupos disponibles. | HU15, HU24 |
| **RF22** | Requisitos y documentos | El sistema debe mostrar los requisitos (según el TUPA) y los pasos del proceso según el tipo de trámite y la categoría, junto con un enlace a la consulta oficial de licencias del MTC. | HU04 |
| **RF23** | Requisitos y documentos | El sistema debe controlar la vigencia de 6 meses del certificado médico y avisar al postulante antes de su vencimiento. | HU28 |
| **RF24** | Requisitos y documentos / Expedientes | El sistema debe verificar en el SNC el registro del certificado médico y de la constancia COFIPRO, y registrar en el SNC la licencia emitida. | HU29 |
| **RF25** | Expedientes | El sistema debe gestionar la revalidación de la licencia sin examen de manejo, verificando el certificado médico y el examen de conocimientos registrados en el SNC. | HU30 |
| **RF26** | Expedientes | El sistema debe gestionar el duplicado de la licencia por pérdida, robo o deterioro, y rechazarlo si la licencia está retenida o suspendida. | HU31 |
| **RF27** | Expedientes | El sistema debe verificar en el Registro Nacional de Sanciones que el postulante no tenga multas ni sanciones pendientes (II-C, revalidación y duplicado). | HU32 |

## Relación entre módulos y actores

Los requisitos se agrupan en los doce módulos del monolito definidos en el estilo arquitectónico.

| Módulo | Requisitos | Actores relacionados |
|---|---|---|
| Identidad y acceso | RF01 | Todos los actores |
| Postulantes | RF03, RF04 | Postulante y gestor |
| Expedientes | RF02, RF11, RF12, RF20, RF24, RF25, RF26, RF27 | Postulante, gestor y supervisor |
| Requisitos y documentos | RF03, RF04, RF22, RF23, RF24 | Postulante y gestor |
| Pagos | RF05, RF06 | Postulante y gestor |
| Citas | RF07, RF21 | Postulante, gestor, evaluador y administrador |
| Evaluaciones | RF08, RF09, RF19 | Postulante, evaluador y supervisor |
| Seguimiento | RF10 | Postulante, gestor y supervisor |
| Notificaciones | RF13, RF23 | Todos los actores |
| Asistente virtual | RF14, RF15 | Postulante, gestor y administrador |
| Administración | RF16, RF18 | Administrador y supervisor |
| Auditoría | RF17 | Supervisor y administrador |