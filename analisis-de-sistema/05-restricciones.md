# Restricciones del sistema

Las restricciones establecen los límites técnicos, funcionales y operativos que deben considerarse durante el diseño del Sistema de Licencias de Conducir.

| ID | Categoría | Restricción | Impacto en la arquitectura |
|---|---|---|---|
| **RC01** | Alcance | El MVP estará orientado a la obtención inicial de licencias clase B, principalmente categorías II-B y II-C. | La revalidación, recategorización y duplicado no serán desarrollados inicialmente. |
| **RC02** | Identidad | El sistema no tendrá acceso real a los servicios de RENIEC. | La identidad será revisada manualmente por el gestor mediante los datos y documentos registrados. |
| **RC03** | Integración institucional | El MVP no se conectará con el Sistema Nacional de Conductores, MTC ni sistemas municipales. | Las consultas y registros institucionales serán representados mediante datos simulados. |
| **RC04** | Pagos | El sistema no utilizará una pasarela de pagos ni confirmará operaciones bancarias automáticamente. | El postulante adjuntará un comprobante y el gestor realizará la verificación manual. |
| **RC05** | Evaluaciones | Los resultados registrados en el prototipo no tendrán validez oficial. | Las evaluaciones serán utilizadas para demostrar el flujo funcional del sistema. |
| **RC06** | Inteligencia artificial | El asistente virtual no podrá aprobar trámites, validar pagos, calificar evaluaciones ni modificar expedientes. | La IA será utilizada únicamente para brindar orientación basada en contenidos aprobados. |
| **RC07** | Notificaciones | El MVP utilizará notificaciones internas dentro de la plataforma. | No será obligatorio integrar correo electrónico, mensajes SMS o aplicaciones de mensajería. |
| **RC08** | Tecnología | La solución se desarrollará como una aplicación web con arquitectura monolítica modular. | Los módulos compartirán un mismo backend y una base de datos central, manteniendo separación lógica. |
| **RC09** | Conectividad | Los usuarios necesitarán acceso a Internet y un navegador actualizado. | No se desarrollará inicialmente una aplicación móvil nativa ni funcionamiento completamente sin conexión. |
| **RC10** | Protección de datos | Los documentos médicos, resultados y datos personales solo podrán ser consultados por usuarios autorizados. | La arquitectura deberá aplicar autenticación, permisos por roles, cifrado y auditoría. |