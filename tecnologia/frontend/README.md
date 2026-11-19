# Portal web · Licencias Clase B

Portal en React que consume la API NestJS. Un solo inicio de sesión: el rol de la cuenta decide qué ve cada persona.

| Rol | Pantallas |
|---|---|
| Postulante | Inicio con etapa y plazo, requisitos y documentos, pago, cita, resultados, avisos |
| Gestor | Bandeja con filtros y paginación, detalle con revisión de documentos y pagos, enlaces a portales oficiales |
| Evaluador | Exámenes por calificar: registrar y corregir resultados |
| Supervisor | Resultados por validar, autorizar emisión, auditoría |
| Administrador | Usuarios y roles, días y cupos, auditoría |

**Tecnología:** Vite, React 19, TypeScript, Tailwind CSS, React Router. Fuentes e íconos empaquetados (sin CDN externo).

## Estructura

```
src/
├── api/          cliente HTTP con JWT, tipos y textos
├── sesion/       sesión y redirección por rol
├── componentes/  diseño base, tabla de expedientes y hooks de datos
└── paginas/      publico · postulante · gestor · evaluador · supervisor · admin · compartido
e2e/              pruebas de punta a punta con Playwright
```

## Ejecutar

Con la API en marcha (`tecnologia/backend`, `npm run start:dev`):

```bash
cp .env.example .env      # VITE_API_URL=http://localhost:3000/api
npm install
npm run dev               # http://localhost:5173
```

Cuentas de demostración (clave `demo123`): `45892014` (postulante), `gestor`, `evaluador`, `supervisor`, `admin`.

## Pruebas E2E

Recorren el trámite completo con los cinco roles, el control de acceso y la vista móvil. Necesitan la base recién migrada, porque crean el expediente `EXP-2026-00001`.

```bash
npx playwright install chromium    # solo la primera vez
npm run e2e                        # contra http://localhost:5173
```

Para guardar capturas en PowerShell: `$env:E2E_CAPTURAS="capturas"; npm run e2e`. En GitHub Actions se ejecutan en el flujo **CI · Portal web**.
