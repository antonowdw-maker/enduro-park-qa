import { test, expect } from '@playwright/test';
import { loginAs } from '../src/helpers/auth';
import { MainPage } from '../src/pages/main.page';
import { BikeFormPage } from '../src/pages/bike-form.page';
import { getSeedCredentials } from '../src/helpers/env';
import { buildUniqueVin } from '../src/helpers/vin';

/**
 * Волна G — UI CSRF: Axios шлёт X-CSRF-Token на мутациях (замечание QA TL P2).
 */
test.describe('CSRF UI (wave G)', () => {
  const { admin } = getSeedCredentials();

  test('TC-SEC-CSRF-UI-01: logout → X-CSRF-Token = cookie csrf → UI anon', async ({ page }) => {
    await loginAs(page, admin);
    const mainPage = new MainPage(page);
    await mainPage.expectLoggedInAs('admin', 'admin');

    const cookies = await page.context().cookies();
    const csrfCookie = cookies.find((c) => c.name === 'csrf');
    expect(csrfCookie, 'ожидалась cookie csrf после загрузки SPA').toBeTruthy();
    expect(csrfCookie!.httpOnly).toBe(false);
    expect(csrfCookie!.value.length).toBeGreaterThan(16);

    const logoutWait = page.waitForResponse(
      (res) =>
        res.url().includes('/api/auth/logout') && res.request().method() === 'POST',
    );

    await mainPage.logout().click();
    const logoutRes = await logoutWait;

    expect(logoutRes.status()).toBe(200);
    const headerToken = logoutRes.request().headers()['x-csrf-token'];
    expect(headerToken, 'Axios должен слать X-CSRF-Token').toBeTruthy();
    expect(headerToken).toBe(csrfCookie!.value);

    await expect(mainPage.headerLogin()).toBeVisible();
    await expect(mainPage.logout()).toHaveCount(0);
    await expect(page).toHaveURL(/\/$/);
  });

  test('TC-SEC-CSRF-UI-02: create bike → POST /bikes с X-CSRF-Token', async ({ page }) => {
    const mainPage = new MainPage(page);
    const form = new BikeFormPage(page);
    const vin = buildUniqueVin('S');

    await loginAs(page, admin);

    const cookies = await page.context().cookies();
    const csrfCookie = cookies.find((c) => c.name === 'csrf');
    expect(csrfCookie).toBeTruthy();

    const createWait = page.waitForResponse(
      (res) => res.url().includes('/api/bikes') && res.request().method() === 'POST',
    );

    await mainPage.addBike().click();
    await form.expectOpen();
    await form.fill({
      brand: 'AaaCsrf',
      model: 'CsrfUi',
      year: 2020,
      mileage: 10,
      vin,
      status: 'available',
      lastService: '2020-01-01',
    });
    await form.submit();

    const createRes = await createWait;
    expect(createRes.status()).toBe(201);
    const headerToken = createRes.request().headers()['x-csrf-token'];
    expect(headerToken).toBe(csrfCookie!.value);

    await form.expectClosed();
    await mainPage.ensureBikeVisible(vin);
  });
});
