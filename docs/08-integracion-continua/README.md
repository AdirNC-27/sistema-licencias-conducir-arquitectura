# Integración y entrega continua

Cada cambio pasa por verificaciones automáticas en GitHub Actions antes de integrarse a `main`.

| Práctica | ¿Se aplica? | Cómo |
|---|---|---|
| Integración continua (CI) | Sí | Cada push y cada Pull Request ejecuta las pruebas y construye las imágenes |
| Entrega continua | Sí, para la API | Si todo pasa en `main`, la imagen de la API se publica en GitHub Container Registry (GHCR) |
| Despliegue continuo | No | El servidor se actualiza aparte (sprint 3). Publicar una imagen no es desplegar |

## Workflows

**`CI · Backend`** (`.github/workflows/ci.yml`): en un push, se ejecuta cuando cambian el backend, la colección de Postman o el contrato; en un Pull Request hacia `main`, siempre.

| Job | Qué comprueba | Si falla |
|---|---|---|
| Arquitectura, Jest y contrato | Compila; reglas de arquitectura (dependency-cruiser); `openapi.json` igual al código; pruebas unitarias con cobertura ≥ 80 %; pruebas de la API con PostgreSQL | No se ejecuta nada más |
| Contrato y Postman | Levanta la API con la base recién migrada y ejecuta las 151 solicitudes de Newman | No se publica la imagen |
| Imagen Docker de la API | Construye la imagen, la inicia junto a PostgreSQL y comprueba que migra y responde al login | No se publica la imagen |
| Publicar la imagen en GHCR | Solo en `main` y solo si los anteriores pasan. Publica `latest` y la etiqueta del commit (`sha-xxxxxxx`) | — |

**`CI · Portal web`** (`.github/workflows/ci-frontend.yml`): en un push, se ejecuta cuando cambian el portal o el código de la API; en un Pull Request hacia `main`, siempre.

| Job | Qué comprueba |
|---|---|
| e2e | Lint y compilación del portal; API y PostgreSQL reales; 20 pruebas de Playwright (trámite completo, control de acceso, vista móvil y accesibilidad con axe) |
| Imagen Docker del portal | Construye la imagen Nginx y comprueba que sirve el portal |

## Reglas del pipeline

- Ninguna etapa usa `continue-on-error`: si una prueba falla, el workflow falla.
- Las credenciales del CI son de laboratorio y viven en el YAML; las reales (API Perú, SMTP, IA) nunca están en el repositorio ni en la imagen (`.gitignore` y `.dockerignore` excluyen `.env` y `.env.*`).
- Para publicar se usa el token temporal `GITHUB_TOKEN` con el permiso mínimo `packages: write`, solo en el job de publicación.

## Flujo de trabajo con ramas

1. Crear una rama: `git switch -c feature/<cambio>`.
2. Subirla: `git push -u origin feature/<cambio>`.
3. Abrir un Pull Request hacia `main`: GitHub Actions ejecuta los dos workflows.
4. Integrar solo si todos los checks están en verde. En `main` se ejecutan otra vez y se publica la imagen.

Protección de `main` (Settings → Rules → Rulesets → `proteger-main`): no se puede borrar ni forzar; todo cambio entra por Pull Request y solo si pasan `Arquitectura, Jest y contrato` y `e2e`. Por eso los dos workflows se ejecutan en todos los Pull Request, aunque solo cambien documentos: si no, los checks obligatorios quedarían esperando para siempre.

## Usar la imagen publicada

```bash
docker pull ghcr.io/adirnc-27/licencias-api:latest
```

La primera publicación crea el paquete como privado. Para que cualquiera pueda descargarlo: perfil de GitHub → Packages → `licencias-api` → Package settings → Change visibility → Public.

## Evidencias

| Evidencia | Dónde |
|---|---|
| Ejecuciones de cada push y Pull Request | Pestaña **Actions** del repositorio |
| Reportes de cobertura, Newman y Playwright | Artifacts de cada ejecución |
| Imagen publicada y sus etiquetas | Pestaña **Packages** del repositorio |
| Capturas | `capturas/` en esta carpeta |
