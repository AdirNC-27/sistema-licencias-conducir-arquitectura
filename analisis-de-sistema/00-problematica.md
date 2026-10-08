# Problemática identificada

## Contexto

La obtención de una licencia de conducir clase B en la provincia de Huamanga comprende diferentes actividades: consulta de requisitos, presentación de documentos, pago de derechos, acreditación de la aptitud médica, evaluación de conocimientos, evaluación de habilidades en la conducción, validación del expediente y emisión de la licencia. Estas actividades son gestionadas por la Municipalidad Provincial de Huamanga conforme a la normativa del Ministerio de Transportes y Comunicaciones.

## Problema identificado

La gestión del trámite involucra a varios participantes, como el postulante, el personal de revisión, los evaluadores y los responsables de validar el expediente. Cuando la información se registra de forma manual, en documentos físicos o en canales separados, resulta difícil mantener un expediente completo, conocer su estado y controlar el avance de cada etapa.

Para el **postulante**, la información sobre requisitos, documentos, pagos, citas y resultados puede encontrarse dispersa. Esto le impide saber con claridad qué ha completado, qué observaciones tiene y cuál es la siguiente acción que debe realizar.

Para el **personal que gestiona el trámite**, la revisión de documentos y comprobantes, la programación de citas, el registro de resultados y la validación del expediente pueden realizarse sin un registro centralizado, lo que dificulta el control de cupos, la corrección de errores y la identificación de quién realizó cada modificación.

## Consecuencias

Las principales consecuencias identificadas son:

- Presentación de expedientes incompletos o con documentos vencidos.
- Confusión del postulante respecto a los requisitos, el orden de las etapas y las acciones pendientes.
- Visitas presenciales innecesarias por falta de información o de preparación.
- Dificultad para verificar documentos y comprobantes de pago de manera ordenada.
- Posible duplicidad o sobreasignación de citas y cupos de evaluación.
- Riesgo de modificar resultados después de haber sido validados.
- Poca trazabilidad sobre quién revisó, aprobó, observó o modificó la información.
- Dificultad para obtener reportes sobre solicitudes, pagos, citas y evaluaciones.

## Necesidad del sistema

Se requiere una **plataforma web de gestión del trámite de licencias de conducir clase B** que centralice el expediente digital y coordine el trabajo de los distintos participantes:

- El **postulante** registra su solicitud, adjunta documentos y comprobantes, consulta sus citas, resultados y observaciones, y sigue el avance de su trámite.
- El **gestor de trámites** verifica manualmente la identidad, los documentos y los pagos, programa las citas y actualiza el expediente.
- Los **evaluadores** registran los resultados de las evaluaciones de su especialidad.
- El **supervisor** valida el expediente y bloquea los resultados aprobados.
- El **administrador** configura usuarios, roles, categorías, requisitos y contenidos.

La plataforma registrará en auditoría las operaciones importantes, generará notificaciones internas y ofrecerá un asistente virtual limitado a orientación basada en contenido aprobado.

## Alcance del prototipo

El sistema se desarrolla como un **prototipo académico**. Por ello:

- No emite licencias con validez legal ni procesa actos administrativos reales.
- La emisión y la entrega se registran únicamente de forma simulada para demostrar el flujo completo.
- No se conecta con los sistemas de la Municipalidad, RENIEC, el Sistema Nacional de Conductores, entidades bancarias ni centros médicos.
- Estas integraciones se representan mediante **adaptadores simulados** y requerirían autorización institucional para implementarse en un entorno real.
- La identidad, los pagos y la aptitud médica se verifican **manualmente** a partir de los documentos registrados.