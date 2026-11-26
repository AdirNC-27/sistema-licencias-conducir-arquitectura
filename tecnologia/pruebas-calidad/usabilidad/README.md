# Prueba de usabilidad (EQ-05)

Material para la sesión con 5 participantes. La guía completa está en [`docs/06-validacion-calidad/prueba-usabilidad.md`](../../../docs/06-validacion-calidad/prueba-usabilidad.md).

| Archivo | Para qué |
|---|---|
| `hoja-participante.pdf` | Imprimir 5 copias: tareas con marcas y tiempo, y el cuestionario SUS (2 páginas). Se genera desde `hoja-participante.html` |
| `observacion-plantilla.csv` | Pasar las marcas de cada tarea (S, A, N o -) y el tiempo total |
| `sus-plantilla.csv` | Pasar las 10 respuestas del SUS de cada participante (1 a 5) |
| `calcular-resultados.mjs` | Calcula el SUS, cuenta quién terminó sin ayuda en ≤ 10 min y escribe `resultados.md` con el estado de cada meta |

```bash
node calcular-resultados.mjs observacion.csv sus.csv resultados.md
```
