import { Page, expect } from '@playwright/test';

/**
 * Page Object: модалка добавления / редактирования байка.
 * Локаторы — data-testid из BikeFormModal.
 */
export class BikeFormPage {
  constructor(private readonly page: Page) {}

  readonly brand = () => this.page.getByTestId('input-brand');
  readonly model = () => this.page.getByTestId('input-model');
  readonly year = () => this.page.getByTestId('input-year');
  readonly mileage = () => this.page.getByTestId('input-mileage');
  readonly vin = () => this.page.getByTestId('input-vin');
  readonly status = () => this.page.getByTestId('select-status');
  readonly lastService = () => this.page.getByTestId('input-lastService');
  readonly lastServiceCalendar = () => this.page.getByTestId('input-lastService-calendar');
  readonly notes = () => this.page.getByTestId('input-notes');
  readonly save = () => this.page.getByTestId('form-save-btn');
  readonly cancel = () => this.page.getByTestId('form-cancel-btn');
  readonly serverError = () => this.page.getByTestId('form-server-error');

  error(field: string) {
    return this.page.getByTestId(`error-${field}`);
  }

  /** Модалка открыта (есть кнопка сохранить) */
  async expectOpen() {
    await expect(this.save()).toBeVisible();
  }
}
