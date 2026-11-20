import { expect, test, type Page } from '@playwright/test';

/**
 * Recorre el trámite completo desde el portal, con los cinco roles, contra la API real.
 * Cada paso inicia sesión en un navegador limpio, como lo haría cada persona.
 */
const CAPTURAS = process.env.E2E_CAPTURAS; // carpeta opcional para guardar evidencias
const PDF = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF');

async function capturar(page: Page, nombre: string) {
  if (CAPTURAS) await page.screenshot({ path: `${CAPTURAS}/${nombre}.png`, fullPage: true });
}

async function ingresar(page: Page, usuario: string, destino: RegExp) {
  await page.goto('/login');
  await page.getByLabel('DNI o usuario').fill(usuario);
  await page.getByLabel('Contraseña').fill('demo123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page).toHaveURL(destino);
}

async function calificar(page: Page, nota: string) {
  await ingresar(page, 'evaluador', /\/evaluador$/);
  await page.getByRole('button', { name: /Calificar/ }).first().click();
  await page.getByLabel(/Nota/).fill(nota);
  await page.getByRole('button', { name: 'Registrar resultado' }).click();
  await expect(page.getByText('Pasa al supervisor')).toBeVisible();
}

async function validar(page: Page, captura?: string) {
  await ingresar(page, 'supervisor', /\/supervisor$/);
  if (captura) await capturar(page, captura);
  await page.getByRole('button', { name: 'Validar y bloquear' }).first().click();
  await expect(page.getByText('Resultado validado y bloqueado')).toBeVisible();
}

async function reservarCita(page: Page, captura: string) {
  await ingresar(page, '45892014', /\/postulante$/);
  await page.goto('/postulante/cita');
  await page.getByRole('button', { name: /libres/ }).first().click();
  await capturar(page, captura);
  await page.getByRole('button', { name: 'Confirmar cita' }).click();
  await expect(page.getByText('Cita reservada')).toBeVisible();
}

test.describe.serial('Trámite de licencia II-C de inicio a fin', () => {
  test('el login muestra las cuentas y rechaza una clave incorrecta', async ({ page }) => {
    await page.goto('/login');
    await capturar(page, '01-login');
    await page.getByLabel('DNI o usuario').fill('gestor');
    await page.getByLabel('Contraseña').fill('equivocada');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await expect(page.getByText(/incorrect/i)).toBeVisible();
  });

  test('el postulante inicia el trámite y adjunta sus documentos', async ({ page }) => {
    await ingresar(page, '45892014', /\/postulante$/);
    await page.getByRole('button', { name: /Mototaxi/ }).click();
    await page.getByRole('button', { name: 'Iniciar trámite' }).click();
    await expect(page.getByText('EXP-2026-00001')).toBeVisible();
    await capturar(page, '02-postulante-inicio');

    await page.getByRole('link', { name: /Subir mis documentos/ }).click();
    const filas = page.locator('li', { has: page.locator('input[type=file]') });
    await expect(filas.first()).toBeVisible();
    while ((await filas.count()) > 0) {
      const fila = filas.first();
      await fila.locator('input[type=file]').setInputFiles({ name: 'documento.pdf', mimeType: 'application/pdf', buffer: PDF });
      const fecha = fila.locator('input[type=date]');
      if (await fecha.count()) await fecha.fill(new Date().toISOString().slice(0, 10));
      const antes = await filas.count();
      await fila.getByRole('button', { name: /Adjuntar/ }).click();
      await expect(filas).toHaveCount(antes - 1);
    }
    await capturar(page, '03-postulante-documentos');
  });

  test('el gestor revisa y aprueba los documentos', async ({ page }) => {
    await ingresar(page, 'gestor', /\/gestor$/);
    await capturar(page, '04-gestor-bandeja');
    await page.getByRole('link', { name: /Revisar/ }).first().click();
    await capturar(page, '05-gestor-detalle');
    // Peor caso de red: cada recarga del expediente responde antes que la anterior. Una respuesta
    // vieja ("Documentos") no debe reemplazar a la nueva ("Pago"); este error apareció en la CI.
    let recarga = 0;
    await page.route(/\/api\/expedientes\/\d+$/, async (ruta) => {
      const espera = Math.max(0, 1200 - 300 * recarga++);
      const respuesta = await ruta.fetch();
      await new Promise((r) => setTimeout(r, espera));
      await ruta.fulfill({ response: respuesta });
    });
    const aprobar = page.getByRole('button', { name: 'Aprobar' });
    // count() no espera: primero se espera a que carguen los 4 documentos (en la CI la página tarda más)
    await expect(aprobar).toHaveCount(4);
    while ((await aprobar.count()) > 0) {
      const antes = await aprobar.count();
      await aprobar.first().click();
      await expect(aprobar).toHaveCount(antes - 1);
    }
    // Se espera a que lleguen todas las respuestas: el estado FINAL debe ser Pago, no solo aparecer un instante
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Pago', { exact: true }).first()).toBeVisible();
  });

  test('el postulante registra su pago y el gestor lo verifica', async ({ page, browser }) => {
    await ingresar(page, '45892014', /\/postulante$/);
    await page.goto('/postulante/pago');
    await page.getByLabel('Número de operación').fill('0012345678');
    await page.getByLabel('Fecha de pago').fill(new Date().toISOString().slice(0, 10));
    await page.getByRole('button', { name: /Registrar pago/ }).click();
    await expect(page.getByText('Operación 0012345678')).toBeVisible();
    await capturar(page, '06-postulante-pago');

    const gestor = await browser.newPage();
    await ingresar(gestor, 'gestor', /\/gestor$/);
    await gestor.goto('/gestor/expedientes/1');
    await gestor.getByRole('button', { name: 'Verificar' }).click();
    await expect(gestor.getByText('Pago verificado')).toBeVisible();
    await gestor.close();
  });

  test('conocimientos: cita, resultado y validación', async ({ page, browser }) => {
    await reservarCita(page, '07-postulante-cita');
    const evaluador = await browser.newPage();
    await calificar(evaluador, '16');
    await capturar(evaluador, '08-evaluador');
    await evaluador.close();
    const supervisor = await browser.newPage();
    await validar(supervisor, '09-supervisor-validar');
    await supervisor.close();
  });

  test('manejo: cita, resultado y validación', async ({ page, browser }) => {
    await reservarCita(page, '10-postulante-cita-manejo');
    const evaluador = await browser.newPage();
    await calificar(evaluador, '15');
    await evaluador.close();
    const supervisor = await browser.newPage();
    await validar(supervisor);
    await supervisor.close();
  });

  test('el supervisor autoriza la emisión y queda en la auditoría', async ({ page }) => {
    await ingresar(page, 'supervisor', /\/supervisor$/);
    await page.getByRole('link', { name: 'Autorizar emisión' }).first().click();
    await page.getByRole('button', { name: 'Autorizar' }).first().click();
    await expect(page.getByText(/Emisión autorizada para EXP-2026-00001/)).toBeVisible();
    await page.getByRole('link', { name: 'Auditoría' }).first().click();
    await expect(page.getByRole('cell', { name: /evaluacion/ }).first()).toBeVisible();
    await capturar(page, '11-supervisor-auditoria');
  });

  test('el postulante ve su licencia emitida y sus resultados', async ({ page }) => {
    await ingresar(page, '45892014', /\/postulante$/);
    await page.goto('/postulante/resultados');
    await expect(page.getByText('¡Tu licencia fue emitida!')).toBeVisible();
    await expect(page.getByText('Intentos usados: 1 de 3')).toHaveCount(2);
    await capturar(page, '12-postulante-resultados');
  });
});

test.describe('Control de acceso en el portal (EQ-02)', () => {
  test('un postulante no entra al área del administrador', async ({ page }) => {
    await ingresar(page, '45892014', /\/postulante$/);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/postulante$/);
  });

  test('sin sesión se redirige al login', async ({ page }) => {
    await page.goto('/gestor');
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe('Vista móvil', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  test('el postulante navega con la barra inferior', async ({ page }) => {
    await ingresar(page, '45892014', /\/postulante$/);
    await expect(page.getByText('EXP-2026-00001')).toBeVisible();
    await capturar(page, '13-movil-inicio');
  });
});
