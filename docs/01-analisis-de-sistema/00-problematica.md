# Problemática identificada

## Contexto

La **licencia de conducir clase B** autoriza a conducir vehículos menores: la categoría **II-B** (motocicletas, uso particular) y la categoría **II-C** (mototaxis, servicio de transporte público). En la provincia de Huamanga la emite la **Municipalidad Provincial de Huamanga (MPH)**, a través de la **Subgerencia de Tránsito y Seguridad Vial** de la Gerencia de Transporte, conforme al D.S. N.º 007-2016-MTC, la Ley N.º 27189 y la Ordenanza Municipal N.º 022-2012-MPH/A. La atención al ciudadano se realiza en la ventanilla de la MPH en el **MAC Ayacucho** (Terrapuerto Libertadores de América).

Es un trámite de **alta demanda**:

- En el departamento de Ayacucho, el **10 % de los hogares tiene motocicleta** y el **3 % tiene mototaxi** (ENAHO-INEI 2025, procesado por la AAP).
- En Huamanga existen **1 100 mototaxis autorizados** y se estima que circulan **más de 4 000 informales** (Diario Correo, 2022).

## Proceso actual

El proceso se levantó mediante una **entrevista al personal de la MPH en el MAC Ayacucho** (04/11/2026) y el **TUPA** de la municipalidad. El detalle se encuentra en el [levantamiento de información](10-levantamiento-de-informacion.md).

| # | Paso | Dónde se realiza |
|---|---|---|
| 1 | Certificado médico (vigencia de 6 meses) | Clínica autorizada por el MTC; el resultado se registra en el SNC |
| 2 | Solo II-C: capacitación COFIPRO | Escuela de conductores autorizada; se registra en el SNC |
| 3 | Llenado de formularios | Ventanilla de la MPH en el MAC |
| 4 | Pago único: S/ 69.90 (II-B) o S/ 69.40 (II-C); incluye los exámenes | SAT Huamanga (módulo 11 del MAC) |
| 5 | Registro del expediente | Sistema de gestión documental de la MPH |
| 6 | Programación del examen, con validación del DNI | Ventanilla de la MPH |
| 7 | Examen de conocimientos (lunes a miércoles) | Subgerencia de Tránsito, Av. 26 de Enero |
| 8 | Examen de manejo, solo tras aprobar el anterior (martes a viernes) | Circuito de manejo |
| 9 | Emisión de la licencia y registro en el SNC | MPH; plazo legal de 10 días hábiles |

**Reglas del trámite:** cada examen tiene **3 oportunidades** sin pago adicional. Si el certificado médico vence (6 meses), el postulante debe **pagar de nuevo** y obtener otro certificado.

## Problema central

> **El postulante no cuenta con una guía clara ni con un seguimiento de su avance en un trámite que se realiza en varios lugares y etapas. Por ello posterga los exámenes, alarga el trámite y corre el riesgo de perder su pago.**

**Evidencia.** Según el personal de la MPH entrevistado: *"Un problema muy común es que los ciudadanos postergan los exámenes. Una semana dan sus exámenes y después de dos semanas… ellos mismos lo alargan, y luego reclaman que no se les entrega su licencia o que se ha demorado."*

## Causas

1. **Trámite repartido en seis lugares:** clínica, escuela COFIPRO, SAT, ventanilla del MAC, Subgerencia de Tránsito y circuito de manejo.
2. **Información dispersa:** los requisitos están en el TUPA y en afiches, los resultados en el SNC (consulta con captcha) y el expediente en el sistema de gestión documental.
3. **Reglas que el postulante desconoce:** los 3 intentos por examen, la vigencia de 6 meses del certificado, los días de cada examen y el orden obligatorio.
4. **No existen recordatorios** de fechas de examen ni de vencimientos.
5. **Atención solo presencial**, según el TUPA de la MPH.
6. **Seguimiento general:** el sistema de gestión documental indica en qué oficina está el documento, pero no en qué etapa de la licencia se encuentra el postulante.

## Efectos

- **Exámenes postergados** y trámites más largos.
- **Reclamos por demora** ante la municipalidad.
- **Pérdida del pago y del certificado médico** cuando vencen los 6 meses.
- **Expedientes incompletos:** la II-C exige la constancia COFIPRO y ambas categorías piden 2 fotografías.
- **Mayor carga de consultas** en la ventanilla.
- **Licencias que no figuran en el SNC**, cuyos titulares luego no pueden revalidar.

## Riesgos de control identificados en el análisis

- **Modificación de resultados** después de su validación.
- **Falta de trazabilidad** sobre quién registró o modificó la información.
- **Sobreasignación de cupos** en los exámenes.

## Sistemas existentes y brecha

| Sistema | Qué hace | Qué no cubre |
|---|---|---|
| **SNC (MTC)** | Consulta de exámenes y licencias registradas | No gestiona el trámite. Usa captcha (no ofrece una API pública). El MTC indica que la integración de la clase B al SNC aún no culmina |
| **Sistema de gestión documental (MPH)** | Mesa de partes y consulta del documento por oficina | No controla etapas, intentos, vigencia del certificado, citas ni recordatorios de la licencia |
| **MAC Ayacucho** | Reúne las ventanillas de varias entidades en un solo local | La atención sigue siendo presencial |

## Propuesta

Una **plataforma web especializada en la licencia clase B** que acompañe al postulante durante todo el trámite:

- Expediente digital único.
- Requisitos y pasos del proceso según el tipo de trámite y la categoría.
- Estado y **siguiente paso** siempre visibles.
- Programación de exámenes según los días reales y los cupos.
- **Control de los 3 intentos** por examen.
- **Alerta de vencimiento** del certificado médico y **aviso de revalidación** de la licencia.
- **Recordatorios** para reducir la postergación de los exámenes.

La plataforma **se integra** con los sistemas existentes en lugar de reemplazarlos: **API Perú** (consulta de DNI), **SNC**, **Registro Nacional de Sanciones**, **SAT Huamanga** y el **sistema de gestión documental de la MPH**.

## Alcance del prototipo

- **Trámites:** emisión nueva, revalidación y duplicado de licencias II-B y II-C. El canje de licencias militares o policiales queda fuera del alcance (RC01).
- **Sin validez legal:** la emisión se registra de forma simulada (RC05).
- **Integración real:** consulta de DNI mediante API Perú.
- **Integraciones simuladas:** SNC, Registro Nacional de Sanciones, SAT y sistema de gestión documental, porque requieren convenio institucional.
- **Asistente de IA** limitado a contenido aprobado (RC06).

## Fuentes

- Municipalidad Provincial de Huamanga. *TUPA – Subgerencia de Tránsito y Seguridad Vial* (2018-2025).
- Entrevista al personal de la MPH en el MAC Ayacucho (04/11/2026).
- Asociación Automotriz del Perú. *Tenencia de vehículos 2025* (datos ENAHO-INEI).
- Diario Correo (23/12/2022). *Regidores aprueban norma para incrementar mototaxis en Huamanga.*
- Ministerio de Transportes y Comunicaciones. Portal de consulta de licencias de conducir.
