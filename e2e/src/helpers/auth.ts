import { Page, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { MainPage } from '../pages/main.page';

/** Учётка seed: username + password */
export type SeedUser = { username: string; password: string };

/**
 * UI-логин через /login и ожидание главной.
 * Для сценариев, где нужен уже авторизованный пользователь.
 */
export async function loginAs(page: Page, user: SeedUser) {
  const loginPage = new LoginPage(page);
  const mainPage = new MainPage(page);

  await loginPage.open();
  await loginPage.login(user.username, user.password);
  await expect(page).toHaveURL(/\/$/);
  await mainPage.expectLoggedInAs(user.username, user.username === 'admin' ? 'admin' : 'mechanic');
}
