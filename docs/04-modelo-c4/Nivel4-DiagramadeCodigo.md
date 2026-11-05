# Nivel 4 · Diagrama de código

## Objetivo

Mostrar las clases del módulo **Evaluaciones** y cómo colaboran para validar un resultado.

## Diagrama de clases

![Diagrama de clases del módulo Evaluaciones](../../img/nivel4-clases.png)

> Archivo editable: `img/fuentes/nivel4-clases.drawio`

| Capa | Clases principales |
|---|---|
| **Presentación** | `EvaluacionesController` |
| **Aplicación** | `RegistrarResultadoUseCase`, `ValidarResultadoUseCase` |
| **Dominio** | `Evaluacion` (máximo 3 intentos y bloqueo), `CalificacionStrategy`, `IntentosAgotadosException`, `ResultadoBloqueadoException`, interfaces de repositorio, auditoría y notificaciones |
| **Infraestructura** | `RepositorioEvaluacionesJpa`, `NotificadorCorreo`, `BitacoraAuditoriaJpa` |

## Diagrama de secuencia: validar resultado

![Diagrama de secuencia de validar resultado](../../img/nivel4-secuencia.png)

> Archivo editable: `img/fuentes/nivel4-secuencia.drawio`

1. El supervisor pide validar el resultado.
2. El controlador ejecuta `ValidarResultadoUseCase`.
3. Se busca la evaluación y se llama a `validar()`.
4. Si ya estaba validada, responde **409**.
5. Si no, se guarda, se avanza la etapa, se audita y se avisa por correo: **200 OK**.

## Patrones y principios en este nivel

| Elemento | Patrón o principio |
|---|---|
| `RepositorioEvaluaciones` y `RepositorioEvaluacionesJpa` | **Repository** |
| `CalificacionStrategy` (conocimientos y manejo) | **Strategy** |
| `NotificadorCorreo` | **Adapter** |
| El caso de uso recibe interfaces | **Inversión de dependencias** (SOLID) |
| Una responsabilidad por clase | **Responsabilidad única** (SOLID) |
