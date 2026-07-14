import { Page, expect } from '@playwright/test';

/**
 * Page Object: главная / (таблица, шапка, фильтры — базовая поверхность для smoke)
 */
export class MainPage {
  constructor(private readonly page: Page) {}

  readonly headerLogin = () => this.page.getByTestId('header-login-btn');
  readonly logout = () => this.page.getByTestId('logout-btn');
  readonly userUsername = () => this.page.getByTestId('user-username');
  readonly userRole = () => this.page.getByTestId('user-role');
  readonly addBike = () => this.page.getByTestId('add-bike-btn');

  /** Открыть главную (публичный список) */
  async open() {
    await this.page.goto('/');
  }

  /** Дождаться, что таблица отрисовала хотя бы одну строку байка */
  async expectTableHasRows() {
    await expect(this.page.locator('[data-testid^="bike-row-"]').first()).toBeVisible();
  }

  /** Проверка шапки после успешного входа */
  async expectLoggedInAs(username: string, role: string) {
    await expect(this.userUsername()).toHaveText(username);
    await expect(this.userRole()).toHaveText(role);
    await expect(this.logout()).toBeVisible();
  }
}
