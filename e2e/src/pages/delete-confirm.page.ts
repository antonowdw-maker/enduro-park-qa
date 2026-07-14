import { Page, expect } from '@playwright/test';

/**
 * Page Object: модалка подтверждения удаления.
 */
export class DeleteConfirmPage {
  constructor(private readonly page: Page) {}

  readonly modal = () => this.page.getByTestId('delete-confirm-modal');
  readonly confirm = () => this.page.getByTestId('delete-confirm-btn');
  readonly cancel = () => this.page.getByTestId('delete-cancel-btn');
  readonly error = () => this.page.getByTestId('delete-error-message');

  async expectOpen() {
    await expect(this.modal()).toBeVisible();
  }

  async confirmDelete() {
    await this.confirm().click();
  }
}
