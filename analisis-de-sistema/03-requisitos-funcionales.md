# Requisitos funcionales

Los requisitos funcionales definen las principales operaciones que debe proporcionar el Sistema de Licencias de Conducir.

| ID | Módulo | Requisito funcional | Historias relacionadas |
|---|---|---|---|
| **RF01** | Identidad y acceso | El sistema debe permitir el registro, inicio de sesión y acceso a funciones según el rol asignado. | HU01, HU23 |
| **RF02** | Expedientes | El sistema debe permitir al postulante registrar una solicitud, seleccionar la categoría de licencia y obtener un número de trámite. | HU02 |
| **RF03** | Postulantes / Requisitos y documentos | El sistema debe permitir al postulante registrar sus datos personales y adjuntar los documentos requeridos. | HU03, HU04, HU05 |
| **RF04** | Requisitos y documentos | El sistema debe permitir al gestor verificar la identidad y aprobar, observar o rechazar los documentos del expediente. | HU12, HU13 |
| **RF05** | Pagos | El sistema debe permitir al postulante registrar los datos de la operación y adjuntar el comprobante de pago. | HU06 |
| **RF06** | Pagos | El sistema debe permitir al gestor marcar un pago como pendiente, verificado, observado o rechazado. | HU14 |
| **RF07** | Citas | El sistema debe permitir al gestor programar o reprogramar citas y al postulante consultar las fechas asignadas. | HU07, HU15 |
| **RF08** | Evaluaciones | El sistema debe mostrar al evaluador las evaluaciones correspondientes a su especialidad y permitir registrar resultados y observaciones. | HU17, HU18 |
| **RF09** | Evaluaciones | El sistema debe permitir corregir un resultado antes de su validación y bloquear su modificación después de ser validado. | HU19, HU20 |
| **RF10** | Seguimiento | El sistema debe actualizar y mostrar el estado, historial y actividades pendientes del trámite. | HU10, HU16 |
| **RF11** | Expedientes | El sistema debe permitir al supervisor revisar, observar o validar el expediente completo. | HU20, HU21 |
| **RF12** | Expedientes | El sistema debe permitir autorizar y registrar de forma simulada la emisión y entrega de la licencia cuando el expediente esté conforme, sin validez oficial (RC05). | HU22 |
| **RF13** | Notificaciones | El sistema debe generar notificaciones internas por observaciones, pagos, citas, evaluaciones y cambios de estado. | HU08 |
| **RF14** | Asistente virtual | El sistema debe proporcionar un asistente virtual que responda preguntas sobre requisitos, pagos, evaluaciones y estado del trámite. | HU11 |
| **RF15** | Asistente virtual | El asistente debe utilizar contenido aprobado y derivar la consulta al gestor cuando no pueda responder de manera confiable. | HU11, HU25 |
| **RF16** | Administración | El sistema debe permitir gestionar cuentas, roles, permisos, categorías, requisitos, montos, preguntas y contenidos informativos. | HU23, HU24, HU25 |
| **RF17** | Auditoría | El sistema debe registrar el usuario, la fecha y la acción realizada en las operaciones importantes. | HU26 |
| **RF18** | Administración | El sistema debe generar reportes sobre solicitudes, pagos, citas, evaluaciones y estados de los trámites. | HU27 |

## Relación entre módulos y actores

Los requisitos se agrupan en los doce módulos del monolito definidos en el estilo arquitectónico.

| Módulo | Requisitos | Actores relacionados |
|---|---|---|
| Identidad y acceso | RF01 | Todos los actores |
| Postulantes | RF03 | Postulante y gestor |
| Expedientes | RF02, RF11, RF12 | Postulante, gestor y supervisor |
| Requisitos y documentos | RF03, RF04 | Postulante y gestor |
| Pagos | RF05, RF06 | Postulante y gestor |
| Citas | RF07 | Postulante y gestor |
| Evaluaciones | RF08, RF09 | Evaluador y supervisor |
| Seguimiento | RF10 | Postulante, gestor y supervisor |
| Notificaciones | RF13 | Todos los actores |
| Asistente virtual | RF14, RF15 | Postulante, gestor y administrador |
| Administración | RF16, RF18 | Administrador y supervisor |
| Auditoría | RF17 | Supervisor y administrador |