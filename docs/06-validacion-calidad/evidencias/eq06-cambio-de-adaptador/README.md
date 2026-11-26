# EQ-06 · Cambio controlado de un adaptador

**Escenario:** se cambia el proveedor de correo. **Medida:** el cambio solo toca el adaptador y su configuración, el dominio no cambia y se modifican 2 archivos de código o menos (ver `08-escenarios-atributos-calidad.md`).

## El cambio

Se agregó el envío de correos con la **API HTTP de Brevo** junto al SMTP de Gmail. No es un cambio de prueba: Brevo es el proveedor previsto para el despliegue del Sprint 3, porque el SMTP de Gmail limita los envíos y muchos servidores en la nube bloquean el puerto 587.

| Archivo | Tipo | Qué cambia |
|---|---|---|
| `modulos/notificaciones/infraestructura/notificador-brevo.ts` | Código (nuevo) | Adaptador que implementa el mismo puerto `ServicioNotificaciones` |
| `modulos/notificaciones/notificaciones.module.ts` | Código | El proveedor del puerto se elige con `CORREO_PROVEEDOR` (`smtp` por defecto o `brevo`) |
| `.env.example` | Configuración | `CORREO_PROVEEDOR` y `BREVO_API_KEY` |
| `modulos/notificaciones/__tests__/notificador-brevo.spec.ts` | Prueba (nueva) | Envío, falta de clave y rechazo o caída de Brevo |

Salida de `git diff --stat`: [git-diff-stat.txt](git-diff-stat.txt).

## Resultado

| Medida | Comprometido | Obtenido | Estado |
|---|---|---|---|
| Archivos de código modificados | ≤ 2 | **2** (el adaptador nuevo y el módulo), más 1 de configuración y 1 de pruebas | Cumple |
| Dominio y aplicación de Notificaciones | Sin cambios | Sin cambios: `NotificarListener`, `ServicioNotificaciones` y `RepositorioAvisos` quedan igual | Cumple |
| Reglas de arquitectura | 100 % | 0 violaciones en 153 módulos ([dependency-cruiser.txt](dependency-cruiser.txt)) | Cumple |
| El trámite funciona con ambos proveedores | Sin regresiones | Pruebas de la API con PostgreSQL: 39 de 39 con `CORREO_PROVEEDOR=smtp` y 39 de 39 con `CORREO_PROVEEDOR=brevo` ([smtp](../trazabilidad/jest-api.json), [brevo](../trazabilidad/jest-api-brevo.json)). La prueba «el correo usa el proveedor configurado…» comprueba qué adaptador quedó activo | Cumple |
| Adaptador probado | Pruebas unitarias | 3 de 3: arma la petición a Brevo con el remitente configurado; sin clave no llama a la API; si Brevo rechaza o no responde, devuelve `false` y el aviso interno se guarda igual (SDD-09 CA3) | Cumple |

## Por qué el cambio es tan pequeño

`NotificarListener` (aplicación) depende del puerto `ServicioNotificaciones` (dominio) y no conoce Nodemailer ni Brevo (inversión de dependencias, patrón Adapter). El módulo de NestJS es el único lugar que une el puerto con una implementación. Las reglas `dominio-independiente` y `aplicacion-sin-infraestructura` de dependency-cruiser impiden que el dominio o la aplicación importen un adaptador.

## Pendiente

La clave real de Brevo se configurará al desplegar (Sprint 3). Hasta entonces el sistema usa el SMTP de Gmail, que ya envía correos reales ([captura](../capturas/integraciones/)).
