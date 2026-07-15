import { Page, expect } from '@playwright/test';
import { waitForBikesApi } from '../helpers/bikes-api';

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
  readonly brandFilter = () => this.page.getByTestId('filter-brand');
  readonly modelFilter = () => this.page.getByTestId('filter-model');
  readonly searchFilter = () => this.page.getByTestId('filter-search');
  readonly brandFilterClear = () => this.page.getByTestId('filter-brand-clear');
  readonly modelFilterClear = () => this.page.getByTestId('filter-model-clear');
  readonly searchFilterClear = () => this.page.getByTestId('filter-search-clear');
  readonly listEmpty = () => this.page.getByTestId('list-empty');
  readonly listError = () => this.page.getByTestId('list-error');
  readonly listRetry = () => this.page.getByTestId('list-retry');
  readonly yearFromClear = () => this.page.getByTestId('filter-year-from-clear');
  readonly yearToClear = () => this.page.getByTestId('filter-year-to-clear');

  readonly paginationLimit = () => this.page.getByTestId('pagination-limit');
  readonly paginationPrev = () => this.page.getByTestId('pagination-prev');
  readonly paginationNext = () => this.page.getByTestId('pagination-next');

  /** Заголовки сортировки (F-SORT) */
  sortHeader(field: 'brand' | 'model' | 'year' | 'vin' | 'mileage' | 'status' | 'lastService') {
    return this.page.getByTestId(`sort-${field}`);
  }

  /** Все видимые строки таблицы */
  bikeRows() {
    return this.page.getByTestId(/^bike-row-/);
  }

  /** Текст «СТРАНИЦА X ИЗ Y» */
  pageIndicator() {
    return this.page.getByText(/СТРАНИЦА\s+\d+\s+ИЗ\s+\d+/i);
  }

  filterError(field: 'year-from' | 'year-to' | 'mileage-from' | 'mileage-to') {
    return this.page.getByTestId(`error-filter-${field}`);
  }

  /** «Всего в базе: N» */
  totalInDb() {
    return this.page.getByText(/Всего в базе:\s*\d+/);
  }

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

  /**
   * UI-действие, которое должно вызвать GET /api/bikes, + опциональный assert query.
   * Волна B: не ассертим строки по устаревшему DOM.
   */
  async runAndWaitForBikes(
    action: () => Promise<unknown>,
    expectedQuery?: Record<string, string | RegExp>,
    options?: import('../helpers/bikes-api').WaitForBikesOptions,
  ) {
    return waitForBikesApi(this.page, action, expectedQuery, options);
  }

  /** Открыть главную и дождаться первой загрузки списка */
  async open() {
    await this.runAndWaitForBikes(async () => {
      await this.page.goto('/');
    });
  }

  /** Дождаться, что таблица отрисовала хотя бы одну строку байка */
  async expectTableHasRows() {
    await expect(this.page.getByTestId(/^bike-row-/).first()).toBeVisible();
  }

  /** Показать максимум строк на странице (удобно для фильтров по якорным VIN) */
  async setLimit50() {
    // Уже 50 → selectOption не шлёт GET; не вешаем waitForResponse (см. CI: crud / VIN edit)
    const current = await this.paginationLimit().inputValue();
    if (current !== '50') {
      await this.runAndWaitForBikes(
        async () => {
          await this.paginationLimit().selectOption('50');
        },
        { limit: '50' },
      );
    }
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
      const next = this.paginationNext();
      if (await next.isDisabled()) break;
      await this.runAndWaitForBikes(async () => {
        await next.click();
      });
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
