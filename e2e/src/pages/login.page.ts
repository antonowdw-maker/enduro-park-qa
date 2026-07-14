import { Page, expect } from '@playwright/test';

/**
 * Page Object: экран входа /login
 * Локаторы — только data-testid (стабильны при смене вёрстки).
 */
export class LoginPage {
  constructor(private readonly page: Page) {}

  // --- локаторы ---
  readonly username = () => this.page.getByTestId('input-username');
  readonly password = () => this.page.getByTestId('input-password');
  readonly submit = () => this.page.getByTestId('login-btn');
  readonly error = () => this.page.getByTestId('login-error-message');
  readonly backHome = () => this.page.getByTestId('back-to-home-btn');

  /** Открыть страницу логина */
  async open() {
    await this.page.goto('/login');
    await expect(this.submit()).toBeVisible();
  }

  /** Вход с указанными учётными данными */
  async login(username: string, password: string) {
    await this.username().fill(username);
    await this.password().fill(password);
    await this.submit().click();
  }
}
