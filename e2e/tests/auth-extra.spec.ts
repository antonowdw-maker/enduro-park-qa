import { test, expect } from '@playwright/test';
import { LoginPage } from '../src/pages/login.page';
import { MainPage } from '../src/pages/main.page';
import { getSeedCredentials } from '../src/helpers/env';

/**
 * Auth gaps (волна 10.6): AUTH-05/06/09 (+ уже 01/04).
 */
test.describe('Auth coverage', () => {
  const { admin } = getSeedCredentials();

  test('TC-AUTH-05: несуществующий пользователь → login-error', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.open();
    await loginPage.login('unknown_user_e2e', 'AnyPassword!99');
    await expect(loginPage.error()).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('TC-AUTH-06: выход → header-login-btn', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const mainPage = new MainPage(page);

    await loginPage.open();
    await loginPage.login(admin.username, admin.password);
    await mainPage.expectLoggedInAs('admin', 'admin');

    await mainPage.logout().click();
    await expect(mainPage.headerLogin()).toBeVisible();
    await expect(mainPage.addBike()).toHaveCount(0);
    await expect(page).toHaveURL(/\/$/);
  });

  test('TC-AUTH-09: back-to-home с /login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const mainPage = new MainPage(page);

    await loginPage.open();
    await loginPage.backHome().click();
    await expect(page).toHaveURL(/\/$/);
    await mainPage.expectTableHasRows();
    await expect(mainPage.headerLogin()).toBeVisible();
  });
});
