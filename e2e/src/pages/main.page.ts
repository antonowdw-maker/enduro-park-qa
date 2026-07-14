import { Page, expect } from '@playwright/test';

/**
 * Page Object: главная / — шапка, фильтры, таблица, пагинация.
 * Локаторы только через data-testid.
 */
export class MainPage {
  constructor(private readonly page: Page) {}

  // --- шапка ---
  readonly headerLogin = () => this.page.getByTestId('header-login-btn');
  readonly logout = () => this.page.getByTestId('logout-btn');
  readonly userUsername = () => this.page.getByTestId('user-username');
  readonly userRole = () => this.page.getByTestId('user-role');
  readonly addBike = () => this.page.getByTestId('add-bike-btn');

  // --- фильтры статусов ---
  readonly filterAll = () => this.page.getByTestId('filter-all');
  readonly filterAvailable = () => this.page.getByTestId('filter-available');
  readonly filterRepair = () => this.page.getByTestId('filter-repair');
  readonly filterSold = () => this.page.getByTestId('filter-sold');
  readonly filterClearAll = () => this.page.getByTestId('filter-clear-all');

  // --- фильтры диапазонов ---
  readonly yearFrom = () => this.page.getByTestId('filter-year-from');
  readonly yearTo = () => this.page.getByTestId('filter-year-to');
  readonly mileageFrom = () => this.page.getByTestId('filter-mileage-from');
  readonly mileageTo = () => this.page.getByTestId('filter-mileage-to');

  readonly paginationLimit = () => this.page.getByTestId('pagination-limit');

  /** Строка таблицы по VIN */
  bikeRow(vin: string) {
    return this.page.getByTestId(`bike-row-${vin}`);
  }

  editBike(vin: string) {
    return this.page.getByTestId(`edit-bike-${vin}`);
  }

  deleteBike(vin: string) {
    return this.page.getByTestId(`delete-bike-${vin}`);
  }

  /** Открыть главную (публичный список) */
  async open() {
    await this.page.goto('/');
  }

  /** Дождаться, что таблица отрисовала хотя бы одну строку байка */
  async expectTableHasRows() {
    await expect(this.page.getByTestId(/^bike-row-/).first()).toBeVisible();
  }

  /** Показать максимум строк на странице (удобно для фильтров по якорным VIN) */
  async setLimit50() {
    await this.paginationLimit().selectOption('50');
    await this.expectTableHasRows();
  }

  /**
   * Найти строку байка с учётом пагинации (новые записи могут быть не на 1-й странице).
   */
  async ensureBikeVisible(vin: string) {
    await this.setLimit50();
    for (let pageIndex = 0; pageIndex < 10; pageIndex += 1) {
      if (await this.bikeRow(vin).count()) {
        await expect(this.bikeRow(vin)).toBeVisible();
        return;
      }
      const next = this.page.getByTestId('pagination-next');
      if (await next.isDisabled()) break;
      await next.click();
      await this.expectTableHasRows();
    }
    await expect(this.bikeRow(vin)).toBeVisible();
  }

  /** Проверка шапки после успешного входа */
  async expectLoggedInAs(username: string, role: string) {
    await expect(this.userUsername()).toHaveText(username);
    await expect(this.userRole()).toHaveText(role);
    await expect(this.logout()).toBeVisible();
  }

  /** Текст статуса в ячейке строки (BUG-01: repair → «В ремонте») */
  statusCell(vin: string) {
    return this.bikeRow(vin).locator('td').nth(5);
  }
}
