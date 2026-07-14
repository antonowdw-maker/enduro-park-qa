import { Page, expect } from '@playwright/test';

/** Данные для валидной формы байка */
export type BikeFormFill = {
  brand: string;
  model: string;
  year: number | string;
  mileage: number | string;
  vin: string;
  status?: 'available' | 'repair' | 'sold';
  lastService?: string;
  notes?: string;
};

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

  /** Модалка закрыта */
  async expectClosed() {
    await expect(this.save()).toHaveCount(0);
  }

  /** Заполнить форму валидными значениями (create/edit) */
  async fill(data: BikeFormFill) {
    await this.brand().fill(data.brand);
    await this.model().fill(data.model);
    await this.year().fill(String(data.year));
    await this.mileage().fill(String(data.mileage));
    await this.vin().fill(data.vin);
    if (data.status) {
      await this.status().selectOption(data.status);
    }
    if (data.lastService !== undefined) {
      await this.lastService().fill(data.lastService);
    }
    if (data.notes !== undefined) {
      await this.notes().fill(data.notes);
    }
  }

  async submit() {
    await this.save().click();
  }
}
