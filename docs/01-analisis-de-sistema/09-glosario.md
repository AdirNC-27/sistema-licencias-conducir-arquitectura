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
| **Etapa** | Paso del trámite: documentos, pago, evaluación médica, conocimientos, manejo, validación y emisión |
| **Validación** | Aprobación del supervisor que bloquea un resultado o el expediente |
| **Emisión simulada** | Registro de la licencia sin validez legal, para demostrar el flujo completo (RC05) |
| **RENIEC** | Registro Nacional de Identificación y Estado Civil; valida la identidad |
| **SNC** | Sistema Nacional de Conductores del MTC; registra las licencias del país |
| **MTC** | Ministerio de Transportes y Comunicaciones |

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
| **Simulador** | Adaptador que reemplaza a un servicio externo mientras no exista una integración autorizada |
| **Fachada** | Interfaz pública de un módulo que usan los demás módulos |
| **API REST** | Interfaz HTTP con la que el portal web se comunica con el backend |
| **JWT** | Token firmado que identifica al usuario y su rol en cada petición |
| **Modelo C4** | Forma de documentar la arquitectura en cuatro niveles: contexto, contenedores, componentes y código |
