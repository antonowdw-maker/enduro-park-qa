import { test, expect } from '@playwright/test';
import { LoginPage } from '../src/pages/login.page';
import { MainPage } from '../src/pages/main.page';
import { getSeedCredentials } from '../src/helpers/env';

/**
 * Smoke-авторизация (волна 10.1)
 * Проверяем критичный путь: публичная главная → логин admin → роль в шапке.
 */
test.describe('Auth smoke', () => {
  const { admin } = getSeedCredentials();

  test('TC-AUTH: успешный вход под admin', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const mainPage = new MainPage(page);

    // Главная доступна без cookie
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

  test('TC-AUTH: неверный пароль показывает ошибку', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.open();
    await loginPage.login(admin.username, 'DefinitelyWrongPass!99');

    await expect(loginPage.error()).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});
