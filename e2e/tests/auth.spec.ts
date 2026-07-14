import { test, expect } from '@playwright/test';
import { LoginPage } from '../src/pages/login.page';
import { MainPage } from '../src/pages/main.page';
import { getSeedCredentials } from '../src/helpers/env';

/**
 * Smoke-авторизация (волна 10.1)
 * Трассировка: TC-AUTH-01, TC-AUTH-04 (+ частично TC-AUTH-07).
 */
test.describe('Auth smoke', () => {
  const { admin } = getSeedCredentials();

  test('TC-AUTH-01: успешный вход под admin', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const mainPage = new MainPage(page);

    // TC-AUTH-07 (частично): главная без cookie
    await mainPage.open();
    await mainPage.expectTableHasRows();
    await expect(mainPage.headerLogin()).toBeVisible();

    // Переход на /login и вход
    await mainPage.headerLogin().click();
    await expect(page).toHaveURL(/\/login/);
    await loginPage.login(admin.username, admin.password);

    // После входа — редирект на главную и данные пользователя в шапке
    await expect(page).toHaveURL(/\/$/);
    await mainPage.expectLoggedInAs('admin', 'admin');
    await expect(mainPage.addBike()).toBeVisible();
  });

  test('TC-AUTH-04: неверный пароль показывает ошибку', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.open();
    await loginPage.login(admin.username, 'DefinitelyWrongPass!99');

    await expect(loginPage.error()).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});
