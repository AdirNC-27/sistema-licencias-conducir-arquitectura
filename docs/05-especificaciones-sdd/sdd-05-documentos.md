# SDD-05 · Documentos del expediente

| Requisitos | Relación con la arquitectura | Estado |
|---|---|---|
| RF03, RF04, RF23 | DA02 · DA04 · EQ-02 | Implementado (sprint 2) |

## Historia

Como **postulante** quiero subir mis documentos, y como **gestor** quiero aprobarlos u observarlos.

## Criterios de aceptación

| # | Escenario | Dado | Cuando | Entonces |
|---|---|---|---|---|
| CA1 | Subir documento | el expediente está en DOCUMENTOS | sube un PDF de hasta 2 MB | queda PENDIENTE |
| CA2 | Archivo no permitido | el archivo es .txt o pesa más de 2 MB | lo sube | recibe 422 |
| CA3 | Certificado vencido | el certificado médico tiene más de 6 meses | el gestor intenta aprobarlo | recibe 422 |
| CA4 | Expediente completo | todos los documentos obligatorios de la categoría están aprobados | el gestor aprueba el último | el expediente pasa a PAGO |
| CA5 | Archivo privado | otro postulante pide el archivo | llama a `GET /api/documentos/{id}/archivo` | recibe 403; sin token, 401 |

## Tareas técnicas

- [x] Entidad `Documento` con `revisar()` y la regla de 6 meses
- [x] `documentosObligatorios(categoria)`: II-C agrega COFIPRO
- [x] Archivos en PostgreSQL (`bytea`), nunca en una URL pública
- [x] Subida con `multipart/form-data` (Multer) y límite de 2 MB

## Endpoints (Swagger: `/api/docs`)

| Método | Ruta | Rol |
|---|---|---|
| POST | `/api/expedientes/{id}/documentos` | POSTULANTE |
| GET | `/api/expedientes/{id}/documentos` | Dueño o personal |
| GET | `/api/documentos/{id}/archivo` | Dueño o personal |
| PATCH | `/api/documentos/{id}/revision` | GESTOR |

## Pruebas que lo comprueban

- `modulos/documentos/__tests__/documentos.spec.ts`
- `test/flujo-tramite.e2e-spec.ts` (subida, revisión y acceso al archivo)
