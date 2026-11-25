import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * EQ-05: accesibilidad WCAG 2.1 nivel A y AA con axe-core en las pantallas principales de cada rol.
 * Lighthouse no puede iniciar sesión; axe revisa también las pantallas protegidas.
 */
const PANTALLAS: { usuario: string | null; rutas: string[] }[] = [
  { usuario: null, rutas: ['/login', '/registro'] },
  { usuario: '45892014', rutas: ['/postulante', '/postulante/documentos', '/postulante/pago', '/postulante/cita', '/postulante/resultados', '/postulante/avisos', '/postulante/asistente'] },
  { usuario: 'gestor', rutas: ['/gestor', '/gestor/consultas'] },
  { usuario: 'evaluador', rutas: ['/evaluador'] },
  { usuario: 'supervisor', rutas: ['/supervisor', '/supervisor/emision', '/supervisor/auditoria'] },
  { usuario: 'admin', rutas: ['/admin', '/admin/cupos', '/admin/contenidos'] },
];

async function ingresar(page: Page, usuario: string) {
  await page.goto('/login');
  await page.getByLabel('DNI o usuario').fill(usuario);
  await page.getByLabel('Contraseña').fill('demo123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.waitForURL((u) => !u.pathname.endsWith('/login'));
}

for (const { usuario, rutas } of PANTALLAS) {
  test(`sin fallas graves de accesibilidad · ${usuario ?? 'público'}`, async ({ page }) => {
    if (usuario) await ingresar(page, usuario);
    for (const ruta of rutas) {
      await page.goto(ruta);
      await page.waitForLoadState('networkidle');
      const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const graves = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      const detalle = graves.map((v) => `${ruta} · ${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')})`);
      expect(detalle, detalle.join('\n')).toEqual([]);
    }
  });
}
