# Nivel 2 · Diagrama de contenedores

## Objetivo

Mostrar las piezas que se ejecutan por separado, su tecnología y cómo se comunican.

## Diagrama

![Diagrama de contenedores del Sistema de Licencias Clase B](../../img/nivel2-contenedores.png)

> Archivo editable: `img/fuentes/nivel2-contenedores.drawio`

## Contenedores

| Contenedor | Tecnología | Responsabilidad |
|---|---|---|
| **Portal web** | React + TypeScript | Interfaz por rol en el navegador |
| **API Licencias** | Java + Spring Boot | Monolito de 12 módulos con JWT, caché en memoria y adaptadores |
| **PostgreSQL** | Base de datos única | Expedientes, documentos, pagos, citas, resultados y auditoría |

## Relaciones

| Origen | Destino | Protocolo |
|---|---|---|
| Usuarios | Portal web | HTTPS |
| Portal web | API Licencias | HTTPS/JSON + JWT |
| API Licencias | PostgreSQL | SQL / JPA |
| API Licencias | API Perú e IA de orientación | HTTPS/REST |
| API Licencias | Correo electrónico | SMTP |

## Decisiones reflejadas

| Decisión | Alternativa descartada | Motivo |
|---|---|---|
| Un solo backend (monolito modular) | Microservicios | Una municipalidad y un equipo pequeño; un módulo puede separarse después |
| Portal separado del backend (SPA + API REST) | Páginas generadas en el servidor | Cada parte evoluciona y se despliega por separado |
| PostgreSQL como única base de datos | Base de datos NoSQL | Expedientes, pagos y notas necesitan transacciones y consistencia |
| Caché en memoria solo para requisitos públicos | Redis como otro contenedor | Es poca información y nunca incluye datos personales |

## Seguridad entre contenedores

| Comunicación | Medida |
|---|---|
| Navegador → Portal y API | HTTPS |
| Portal → API | Token JWT con el rol en cada petición |
| API → PostgreSQL | Solo desde la red interna; credenciales en variables de entorno |
| API → servicios externos | Tokens de API Perú, IA y correo guardados solo en el servidor |
