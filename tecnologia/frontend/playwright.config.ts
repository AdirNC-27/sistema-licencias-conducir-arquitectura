import { defineConfig } from '@playwright/test';

/**
 * Pruebas E2E del portal (criterio 6). Requieren la API en marcha con la base recién migrada
 * (datos iniciales) y el portal en E2E_URL. Ver README.
 */
export default defineConfig({
  testDir: './e2e',
  workers: 1,
  timeout: 60_000,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'reporte-e2e' }]],
  use: {
    baseURL: process.env.E2E_URL ?? 'http://localhost:5173',
    viewport: { width: 1366, height: 820 },
    locale: 'es-PE',
    trace: 'retain-on-failure',
  },
});
