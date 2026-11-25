# EQ-08 · Pruebas del asistente con promptfoo

30 preguntas al asistente a través de la API (`POST /api/asistente/consultas`):

| Grupo | Cantidad | Criterio |
|---|---|---|
| Preguntas del trámite | 20 | No se derivan y la respuesta contiene el dato esperado (≥ 90 %) |
| Pedidos de acción y preguntas ajenas | 10 | Se derivan al gestor (100 %) |

El criterio está en `criterio.js` y busca datos (por ejemplo, `69.90` o `6 meses`), no frases exactas. Así vale igual si la respuesta la redacta la IA o si es el texto aprobado.

## Ejecutar

Requisito: la API en marcha, con la base migrada.

```powershell
cd tecnologia\pruebas-calidad\promptfoo
node ejecutar.mjs
```

`ejecutar.mjs` inicia sesión como el postulante demo (45892014) y ejecuta promptfoo 0.125.1. Deja el resultado en `resultado-eq08.html` (no se sube a Git).

- **Sin `IA_API_KEY`** en el `.env` del backend: se mide la búsqueda en el contenido aprobado y la derivación.
- **Con `IA_API_KEY`**: se mide además la redacción de la IA. Reinicia la API después de agregar la clave.

Contra otra dirección: `$env:API_URL = "https://.../api"; node ejecutar.mjs`.

Cada ejecución agrega 30 consultas a la conversación del postulante demo y deja 10 derivadas en la bandeja del gestor.
