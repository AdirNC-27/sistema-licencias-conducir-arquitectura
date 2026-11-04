# Glosario

Términos utilizados en la documentación del Sistema de Licencias de Conducir Clase B.

## Términos del trámite

| Término | Significado |
|---|---|
| **Licencia clase B** | Licencia para conducir vehículos menores, emitida por la Municipalidad Provincial |
| **Categoría II-B** | Licencia para conducir motocicletas |
| **Categoría II-C** | Licencia para conducir mototaxis (vehículos de tres ruedas) |
| **Postulante** | Ciudadano que solicita la licencia |
| **Expediente** | Conjunto de datos, documentos, pagos, citas y resultados de un trámite |
| **Etapa** | Paso del trámite: certificado médico, pago, examen de conocimientos, examen de manejo, validación y emisión |
| **Validación** | Aprobación del supervisor que bloquea un resultado o el expediente |
| **Emisión de prueba** | Registro de la licencia sin validez legal, para demostrar el flujo completo (RC05) |
| **RENIEC** | Registro Nacional de Identificación y Estado Civil; valida la identidad |
| **SNC** | Sistema Nacional de Conductores del MTC; registra las licencias del país |
| **MTC** | Ministerio de Transportes y Comunicaciones |
| **MPH** | Municipalidad Provincial de Huamanga |
| **TUPA** | Texto Único de Procedimientos Administrativos: documento oficial con los requisitos, costos y plazos de cada trámite |
| **MAC** | Centro de Mejor Atención al Ciudadano: local donde varias entidades del Estado atienden juntas |
| **SAT Huamanga** | Servicio de Administración Tributaria de Huamanga; recibe el pago del trámite |
| **COFIPRO** | Programa de Formación de Conductores, obligatorio para la categoría II-C |
| **Registro Nacional de Sanciones** | Registro de multas y sanciones de tránsito de los conductores |
| **Revalidación** | Renovación de la licencia al vencer su vigencia de 5 años |
| **Duplicado** | Nueva emisión de la licencia por pérdida, robo o deterioro |
| **PIDE** | Plataforma de Interoperabilidad del Estado: vía oficial para que las entidades públicas compartan información |
| **Sistema de gestión documental** | Sistema de la MPH para la mesa de partes y el seguimiento de documentos por oficina |

## Términos de arquitectura

| Término | Significado |
|---|---|
| **HU** | Historia de usuario: necesidad escrita desde el punto de vista del usuario |
| **RF** | Requisito funcional: lo que el sistema debe hacer |
| **AC** | Atributo de calidad: qué tan bien debe funcionar el sistema |
| **RC** | Restricción: límite técnico, funcional u operativo del proyecto |
| **DA** | Driver arquitectónico: requisito, atributo o restricción que influye en la arquitectura |
| **ADR** | Registro de una decisión arquitectónica y su justificación |
| **EQ** | Escenario de calidad: fuente, estímulo, condición, respuesta y medida |
| **Monolito modular** | Una sola aplicación desplegable dividida en módulos con responsabilidades separadas |
| **Clean Architecture** | Enfoque que separa el código en capas y dirige las dependencias hacia el dominio |
| **Dominio** | Capa que contiene las entidades y las reglas del trámite |
| **Caso de uso** | Clase de la capa de aplicación que coordina los pasos de una operación |
| **Contrato** | Interfaz definida en el dominio que la infraestructura implementa |
| **Adaptador** | Clase que implementa un contrato y conecta el sistema con una tecnología o servicio externo |
| **Verificación del gestor** | Confirmación que hace el gestor en un portal oficial (SNC, SAT o Registro Nacional de Sanciones) y que el sistema registra con usuario y fecha |
| **Fachada** | Interfaz pública de un módulo que usan los demás módulos |
| **API Perú** | Servicio de terceros que permite consultar los datos de un DNI mediante un token |
| **API REST** | Interfaz HTTP con la que el portal web se comunica con el backend |
| **JWT** | Token firmado que identifica al usuario y su rol en cada petición |
| **Modelo C4** | Forma de documentar la arquitectura en cuatro niveles: contexto, contenedores, componentes y código |
