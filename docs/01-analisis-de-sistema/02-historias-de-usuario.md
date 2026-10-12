# Historias de usuario

Las historias de usuario describen las necesidades de los actores que interactúan con el Sistema de Licencias de Conducir.

| ID | Actor | Historia de usuario |
|---|---|---|
| **HU01** | Postulante | Como postulante, quiero registrar una cuenta e iniciar sesión, para acceder de manera segura a mi información y trámites. |
| **HU02** | Postulante | Como postulante, quiero registrar una solicitud seleccionando la categoría de licencia, para iniciar el procedimiento correspondiente. |
| **HU03** | Postulante | Como postulante, quiero registrar mis datos personales y adjuntar mi documento de identidad, para que el gestor pueda verificar mi información. |
| **HU04** | Postulante | Como postulante, quiero consultar los requisitos y documentos necesarios, para preparar correctamente mi expediente. |
| **HU05** | Postulante | Como postulante, quiero adjuntar mis documentos, para presentarlos a revisión sin entregar inicialmente copias físicas. |
| **HU06** | Postulante | Como postulante, quiero registrar los datos de mi pago y adjuntar el comprobante, para solicitar su verificación. |
| **HU07** | Postulante | Como postulante, quiero consultar mis citas y evaluaciones programadas, para asistir en las fechas correspondientes. |
| **HU08** | Postulante | Como postulante, quiero recibir notificaciones internas, para conocer observaciones, citas, resultados y actividades pendientes. |
| **HU09** | Postulante | Como postulante, quiero consultar los resultados de mis evaluaciones, para conocer si puedo continuar con el trámite. |
| **HU10** | Postulante | Como postulante, quiero visualizar el estado y el historial de mi trámite, para saber qué etapas he completado y cuáles están pendientes. |
| **HU11** | Postulante | Como postulante, quiero consultar al asistente virtual con inteligencia artificial, para recibir orientación sobre requisitos, pagos, evaluaciones y observaciones. |
| **HU12** | Gestor de trámites | Como gestor de trámites, quiero revisar los datos de identidad y documentos del postulante, para verificar que el expediente esté completo. |
| **HU13** | Gestor de trámites | Como gestor de trámites, quiero aprobar, observar o rechazar documentos, para comunicar al postulante las correcciones necesarias. |
| **HU14** | Gestor de trámites | Como gestor de trámites, quiero verificar los comprobantes de pago, para confirmar que el postulante pueda continuar con el procedimiento. |
| **HU15** | Gestor de trámites | Como gestor de trámites, quiero programar y reprogramar citas, para organizar la atención y las evaluaciones. |
| **HU16** | Gestor de trámites | Como gestor de trámites, quiero actualizar el avance del expediente, para mantener informado al postulante. |
| **HU17** | Evaluador | Como evaluador, quiero consultar las evaluaciones asignadas según mi especialidad, para atender únicamente las pruebas que me corresponden. |
| **HU18** | Evaluador | Como evaluador, quiero registrar el resultado y las observaciones de una evaluación, para dejar constancia del desempeño del postulante. |
| **HU19** | Evaluador | Como evaluador, quiero corregir un resultado antes de su validación, para solucionar posibles errores de registro. |
| **HU20** | Supervisor o validador | Como supervisor, quiero revisar los documentos, pagos y evaluaciones del expediente, para comprobar que el procedimiento esté completo. |
| **HU21** | Supervisor o validador | Como supervisor, quiero devolver un expediente observado al gestor, para que se corrija antes de su aprobación. |
| **HU22** | Supervisor o validador | Como supervisor, quiero validar el expediente y autorizar la emisión de la licencia, para completar el procedimiento. |
| **HU23** | Administrador del sistema | Como administrador, quiero crear cuentas y asignar roles y permisos, para controlar el acceso a las funciones de la plataforma. |
| **HU24** | Administrador del sistema | Como administrador, quiero gestionar categorías, requisitos y parámetros, para mantener actualizada la configuración del trámite. |
| **HU25** | Administrador del sistema | Como administrador, quiero gestionar las preguntas y contenidos informativos, para mantener actualizadas las evaluaciones y el asistente virtual. |
| **HU26** | Administrador del sistema | Como administrador, quiero consultar la auditoría de acciones, para identificar quién realizó cada modificación dentro del sistema. |
| **HU27** | Administrador del sistema | Como administrador, quiero consultar reportes de solicitudes, pagos y evaluaciones, para supervisar el funcionamiento de la plataforma. |

## Reglas generales

- Cada usuario accederá mediante una cuenta y contraseña.
- Las funciones visibles dependerán del rol asignado.
- El evaluador solamente podrá gestionar evaluaciones de su especialidad.
- El gestor verificará manualmente los documentos y comprobantes.
- El supervisor validará el expediente antes de autorizar la emisión.
- Las notificaciones serán generadas dentro de la plataforma.
- El asistente virtual brindará orientación, pero no realizará aprobaciones ni modificará información del trámite.
- Las acciones importantes quedarán registradas en la auditoría.
- La emisión registrada en el prototipo es simulada y no tiene validez oficial.