# Escenarios de atributos de calidad del Sistema de Licencias Clase B

Cada atributo de calidad definido en `04-atributos-de-calidad.md` se convierte en un escenario medible que indica quién origina la exigencia, en qué condiciones ocurre y con qué valor se comprueba su cumplimiento. Las medidas marcadas como propuesta deben validarse en el entorno de prueba del prototipo.

## EQ-01. Seguridad: acceso según el rol

| Elemento | Descripción |
|---|---|
| **Origen** | AC01 · DA01 |
| **Atributo de calidad** | Seguridad |
| **Fuente** | Usuario sin sesión, con credenciales inválidas o con un rol sin permiso (por ejemplo, un evaluador que intenta validar un expediente). |
| **Estímulo** | El usuario intenta ejecutar una función protegida que no corresponde a su rol. |
| **Condición** | El sistema funciona normalmente y los roles de postulante, gestor, evaluador, supervisor y administrador están configurados. |
| **Respuesta esperada** | El sistema rechaza la operación, no modifica información y no expone datos en la respuesta. |
| **Medida** | Rechazar el 100 % de los intentos no autorizados incluidos en las pruebas definidas (respuesta 401 o 403), sin exposición de datos sensibles. |
| **Verificación** | Ejecutar pruebas de acceso con cada rol sobre cada operación protegida y revisar las respuestas. |
| **Estado** | Pendiente de completar la matriz de permisos por rol y operación. |

## EQ-02. Privacidad: acceso a documentos y datos médicos

| Elemento | Descripción |
|---|---|
| **Origen** | AC02 · DA02 |
| **Atributo de calidad** | Privacidad |
| **Fuente** | Usuario autenticado que no tiene relación con el expediente (por ejemplo, otro postulante). |
| **Estímulo** | El usuario intenta consultar documentos, comprobantes, resultados o datos médicos de otro postulante. |
| **Condición** | Los documentos se encuentran en almacenamiento privado y las comunicaciones utilizan HTTPS. |
| **Respuesta esperada** | El sistema deniega el acceso y solo permite consultar la información a los usuarios autorizados para ese expediente. |
| **Medida** | Denegar el 100 % de los accesos no autorizados probados. Ningún documento es accesible mediante una URL pública permanente. |
| **Verificación** | Intentar acceder a expedientes ajenos con distintos usuarios y comprobar que los enlaces a documentos requieren autorización o expiran. |
| **Estado** | Pendiente de definir la duración de los enlaces temporales y los datos considerados sensibles. |

## EQ-03. Rendimiento: consultas habituales

| Elemento | Descripción |
|---|---|
| **Origen** | AC03 · DA09 |
| **Atributo de calidad** | Rendimiento |
| **Fuente** | Postulante o personal de gestión |
| **Estímulo** | El usuario consulta requisitos, el estado de su expediente o la lista de expedientes pendientes. |
| **Condición** | Operación normal durante el horario de atención, con datos representativos. |
| **Respuesta esperada** | El sistema muestra la información solicitada sin errores inesperados. |
| **Medida** | **Propuesta por validar:** el 95 % de las consultas responde en 3 segundos o menos, con menos del 1 % de errores técnicos, durante una prueba con 100 usuarios simultáneos. |
| **Verificación** | Ejecutar pruebas de carga y registrar los tiempos de respuesta, los errores y la cantidad de usuarios simultáneos. |
| **Estado** | Pendiente de confirmar la cantidad esperada de usuarios y el entorno de prueba. |

## EQ-04. Disponibilidad: servicio en horario de atención y recuperación

| Elemento | Descripción |
|---|---|
| **Origen** | AC04 · DA09 |
| **Atributo de calidad** | Disponibilidad |
| **Fuente** | Falla del servidor o de la base de datos |
| **Estímulo** | El sistema deja de responder o se pierde información durante el horario de atención. |
| **Condición** | El sistema está publicado, cuenta con monitoreo y con copias de seguridad periódicas. |
| **Respuesta esperada** | El sistema se restaura a partir del último respaldo y retoma la atención con la menor pérdida de información posible. |
| **Medida** | **Propuesta por validar:** disponibilidad de 99 % en el horario de atención; restauración en 4 horas o menos y pérdida máxima de 24 horas de información. |
| **Verificación** | Revisar los registros de monitoreo y realizar una prueba de restauración desde un respaldo. |
| **Estado** | Pendiente de definir el horario de atención y la frecuencia de los respaldos. |

## EQ-05. Usabilidad: identificar la siguiente acción

| Elemento | Descripción |
|---|---|
| **Origen** | AC05 · DA10 |
| **Atributo de calidad** | Usabilidad |
| **Fuente** | Postulante que usa la plataforma por primera vez |
| **Estímulo** | El postulante registra su solicitud, adjunta sus documentos y consulta qué debe hacer a continuación. |
| **Condición** | Prueba con usuarios representativos, desde computadora y desde celular. |
| **Respuesta esperada** | El sistema muestra con claridad los pasos, el estado, las observaciones y la siguiente acción pendiente. |
| **Medida** | **Propuesta por validar:** el 80 % de los participantes completa el registro y la carga de documentos sin ayuda en 10 minutos o menos e identifica correctamente su siguiente acción. |
| **Verificación** | Realizar una prueba de usabilidad con tareas definidas y registrar tiempos, errores y consultas de ayuda. |
| **Estado** | Pendiente de definir los participantes y las tareas de la prueba. |

## EQ-06. Mantenibilidad: cambiar una regla o una integración

| Elemento | Descripción |
|---|---|
| **Origen** | AC06 · DA05 · DA08 |
| **Atributo de calidad** | Mantenibilidad |
| **Fuente** | Equipo de desarrollo |
| **Estímulo** | Se modifica un requisito o una etapa del trámite, o se reemplaza el simulador de RENIEC por una integración autorizada. |
| **Condición** | El sistema está organizado en módulos con Clean Architecture y dispone de pruebas. |
| **Respuesta esperada** | El cambio se concentra en el módulo responsable o en un nuevo adaptador, sin modificar el dominio de otros módulos. |
| **Medida** | El reemplazo de un adaptador solo requiere la nueva clase y su registro en la configuración. Las pruebas del módulo y las de regresión acordadas se aprueban. |
| **Verificación** | Revisar los archivos modificados, ejecutar las pruebas e inspeccionar las dependencias entre módulos. |
| **Estado** | Pendiente de definir las reglas de dependencias y las pruebas obligatorias. |

## EQ-07. Trazabilidad: registro de operaciones importantes

| Elemento | Descripción |
|---|---|
| **Origen** | AC07 · DA03 |
| **Atributo de calidad** | Trazabilidad |
| **Fuente** | Gestor, evaluador, supervisor o administrador |
| **Estímulo** | El usuario modifica un documento, un pago, un resultado o el estado de un expediente. |
| **Condición** | Operación normal del sistema. |
| **Respuesta esperada** | El sistema registra la operación en la bitácora de auditoría. |
| **Medida** | El 100 % de las operaciones importantes probadas queda registrado con usuario, fecha y hora, acción, motivo y valores anterior y nuevo. |
| **Verificación** | Ejecutar las operaciones de prueba y comparar cada una con su registro de auditoría. |
| **Estado** | Pendiente de definir la lista cerrada de operaciones auditables. |

## EQ-08. Confiabilidad de la IA: respuestas controladas

| Elemento | Descripción |
|---|---|
| **Origen** | AC08 · DA07 |
| **Atributo de calidad** | Confiabilidad de la IA |
| **Fuente** | Postulante |
| **Estímulo** | El postulante pregunta al asistente virtual algo que no está en el contenido aprobado o le pide realizar una acción (por ejemplo, aprobar su expediente). |
| **Condición** | El asistente funciona con el contenido aprobado por el administrador. |
| **Respuesta esperada** | El asistente no inventa información, no ejecuta acciones sobre el trámite y deriva la consulta al gestor. |
| **Medida** | En un conjunto de 50 preguntas de prueba, el 100 % de las respuestas se basa en el contenido aprobado o se deriva al gestor, y no se ejecuta ninguna acción sobre expedientes. |
| **Verificación** | Ejecutar el conjunto de preguntas de prueba y revisar cada respuesta. |
| **Estado** | Pendiente de elaborar el conjunto de preguntas y el contenido aprobado. |

## EQ-09. Integridad: resultado validado bloqueado

| Elemento | Descripción |
|---|---|
| **Origen** | RF09 · DA04 |
| **Atributo de calidad** | Integridad |
| **Fuente** | Evaluador o cualquier otro usuario |
| **Estímulo** | Se intenta modificar un resultado de evaluación que ya fue validado por el supervisor. |
| **Condición** | El resultado se encuentra en estado VALIDADO. |
| **Respuesta esperada** | El sistema rechaza la modificación, conserva el resultado original y registra el intento en auditoría. |
| **Medida** | Rechazar el 100 % de los intentos de modificación probados (respuesta 409) sin alterar el resultado. |
| **Verificación** | Ejecutar pruebas unitarias del dominio y pruebas de la API sobre resultados validados. |
| **Estado** | Pendiente de implementar las pruebas en el prototipo. |

## Resumen de escenarios

| Código | Origen | Atributo de calidad | Qué se busca comprobar |
|---|---|---|---|
| EQ-01 | AC01 · DA01 | Seguridad | Que cada usuario solo ejecute las funciones de su rol. |
| EQ-02 | AC02 · DA02 | Privacidad | Que los documentos y datos médicos solo sean accesibles para usuarios autorizados. |
| EQ-03 | AC03 · DA09 | Rendimiento | Que las consultas habituales respondan dentro del tiempo establecido. |
| EQ-04 | AC04 · DA09 | Disponibilidad | Que el sistema esté disponible y pueda recuperarse ante fallos. |
| EQ-05 | AC05 · DA10 | Usabilidad | Que el postulante identifique fácilmente sus pasos y acciones pendientes. |
| EQ-06 | AC06 · DA05 · DA08 | Mantenibilidad | Que los cambios y las nuevas integraciones no afecten otros módulos. |
| EQ-07 | AC07 · DA03 | Trazabilidad | Que las operaciones importantes queden registradas. |
| EQ-08 | AC08 · DA07 | Confiabilidad de la IA | Que el asistente solo oriente con contenido aprobado. |
| EQ-09 | RF09 · DA04 | Integridad | Que los resultados validados no puedan modificarse. |