# Restricciones del sistema

Las restricciones establecen los límites técnicos, funcionales y operativos que deben considerarse durante el diseño del Sistema de Licencias de Conducir.

| ID | Categoría | Restricción | Impacto en la arquitectura |
|---|---|---|---|
| **RC01** | Alcance | El MVP cubre la emisión nueva, la revalidación y el duplicado de licencias clase B, categorías II-B y II-C. | El canje de licencias militares o policiales y los recursos administrativos no serán desarrollados inicialmente. |
| **RC02** | Identidad | El sistema no tendrá acceso directo a los servicios de RENIEC. | La identidad se validará mediante la consulta de DNI de API Perú (servicio de terceros con token) y la revisión del gestor. |
| **RC03** | Integración institucional | El MVP no se conectará directamente con el SNC, el SAT, el Registro Nacional de Sanciones ni el sistema de gestión documental, porque no ofrecen una API pública. | El gestor verifica en los portales oficiales y el sistema registra esa verificación; la integración futura se haría mediante la PIDE, con convenio. |
| **RC04** | Pagos | El sistema no procesará pagos en línea; el pago se realiza en el SAT Huamanga. | El postulante registrará el número de recibo y adjuntará el comprobante, y el gestor realizará la verificación. |
| **RC05** | Evaluaciones | Los resultados registrados en el prototipo no tendrán validez oficial. | Las evaluaciones serán utilizadas para demostrar el flujo funcional del sistema. |
| **RC06** | Inteligencia artificial | El asistente virtual no podrá aprobar trámites, validar pagos, calificar evaluaciones ni modificar expedientes. | La IA será utilizada únicamente para brindar orientación basada en contenidos aprobados. |
| **RC07** | Notificaciones | Las notificaciones se muestran dentro de la plataforma y los recordatorios se envían por correo electrónico. | No será obligatorio integrar mensajes SMS ni aplicaciones de mensajería. |
| **RC08** | Tecnología | La solución se desarrollará como una aplicación web con arquitectura monolítica modular. | Los módulos compartirán un mismo backend y una base de datos central, manteniendo separación lógica. |
| **RC09** | Conectividad | Los usuarios necesitarán acceso a Internet y un navegador actualizado. | No se desarrollará inicialmente una aplicación móvil nativa ni funcionamiento completamente sin conexión. |
| **RC10** | Protección de datos | Los documentos médicos, resultados y datos personales solo podrán ser consultados por usuarios autorizados. | La arquitectura deberá aplicar autenticación, permisos por roles, cifrado y auditoría. |