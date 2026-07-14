import { test, expect } from '@playwright/test';
import { MainPage } from '../src/pages/main.page';
import { SEED_VINS } from '../src/data/seed-vins';
import { resetDatabaseSeed } from '../src/helpers/seed';

/**
 * Фильтры по статусу (волна 10.2)
 * Используем якорные VIN из seed — не завязаны на UUID.
 * beforeAll: пере-seed после CRUD-грязи в том же прогоне.
 */
test.describe('Filters', () => {
  test.beforeAll(() => {
    resetDatabaseSeed();
  });

  test.beforeEach(async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.open();
    await mainPage.expectTableHasRows();
    await mainPage.setLimit50();
  });

  test('TC-FILTER-MULTI-01: Доступен + Ремонт скрывает Продан', async ({ page }) => {
    const mainPage = new MainPage(page);

    await mainPage.filterAvailable().click();
    await mainPage.filterRepair().click();

    await expect(mainPage.bikeRow(SEED_VINS.availableKtm)).toBeVisible();
    await expect(mainPage.bikeRow(SEED_VINS.repairHonda)).toBeVisible();
    await expect(mainPage.bikeRow(SEED_VINS.soldYamaha)).toHaveCount(0);
  });

  test('TC-FILTER-MULTI-02: снятие Ремонт оставляет только Доступен', async ({ page }) => {
    const mainPage = new MainPage(page);

    await mainPage.filterAvailable().click();
    await mainPage.filterRepair().click();
    await expect(mainPage.bikeRow(SEED_VINS.repairHonda)).toBeVisible();

    // Повторный клик снимает «Ремонт»
    await mainPage.filterRepair().click();

    await expect(mainPage.bikeRow(SEED_VINS.availableKtm)).toBeVisible();
    await expect(mainPage.bikeRow(SEED_VINS.repairHonda)).toHaveCount(0);
    await expect(mainPage.bikeRow(SEED_VINS.soldYamaha)).toHaveCount(0);
  });

  test('TC-FILTER-MULTI-03: «Все» сбрасывает статусы', async ({ page }) => {
    const mainPage = new MainPage(page);

    await mainPage.filterSold().click();
    await expect(mainPage.bikeRow(SEED_VINS.soldYamaha)).toBeVisible();
    await expect(mainPage.bikeRow(SEED_VINS.availableKtm)).toHaveCount(0);

    await mainPage.filterAll().click();

    await expect(mainPage.bikeRow(SEED_VINS.availableKtm)).toBeVisible();
    await expect(mainPage.bikeRow(SEED_VINS.repairHonda)).toBeVisible();
    await expect(mainPage.bikeRow(SEED_VINS.soldYamaha)).toBeVisible();
  });

  test('TC-FILTER-YEAR-01: год от 2020', async ({ page }) => {
    const mainPage = new MainPage(page);

    await mainPage.yearFrom().fill('2020');

    // Якорь 2020 остаётся, Honda 2015 пропадает
    await expect(mainPage.bikeRow(SEED_VINS.availableKtm)).toBeVisible();
    await expect(mainPage.bikeRow(SEED_VINS.repairHonda)).toHaveCount(0);
  });

  test('TC-FILTER-YEAR-02: год до 2015', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.yearTo().fill('2015');
    await expect(mainPage.bikeRow(SEED_VINS.repairHonda)).toBeVisible();
    await expect(mainPage.bikeRow(SEED_VINS.availableKtm)).toHaveCount(0);
  });

  test('TC-FILTER-MILEAGE-01: пробег от 50000', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.mileageFrom().fill('50000');
    await expect(mainPage.bikeRow(SEED_VINS.vinEditHusq)).toBeVisible(); // 50000
    await expect(mainPage.bikeRow(SEED_VINS.availableKtm)).toHaveCount(0); // 12000
  });

  test('TC-FILTER-MILEAGE-02: пробег до 20000', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.mileageTo().fill('20000');
    await expect(mainPage.bikeRow(SEED_VINS.availableKtm)).toBeVisible(); // 12000
    await expect(mainPage.bikeRow(SEED_VINS.repairHonda)).toHaveCount(0); // 45000
  });

  test('TC-FILTER-RANGE-01: пустые диапазоны = полный набор якорей', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.yearFrom().fill('2020');
    await expect(mainPage.bikeRow(SEED_VINS.repairHonda)).toHaveCount(0);
    await mainPage.yearFromClear().click();
    await expect(mainPage.yearFrom()).toHaveValue('');
    await expect(mainPage.bikeRow(SEED_VINS.availableKtm)).toBeVisible();
    await expect(mainPage.bikeRow(SEED_VINS.repairHonda)).toBeVisible();
    await expect(mainPage.bikeRow(SEED_VINS.soldYamaha)).toBeVisible();
  });

  test('TC-FILTER-CLEAR-01: filter-clear-all сбрасывает статус, марку и диапазоны', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.filterAvailable().click();
    await mainPage.brandFilter().fill('KTM');
    await mainPage.yearFrom().fill('2020');
    await mainPage.mileageFrom().fill('1000');
    await expect(mainPage.bikeRow(SEED_VINS.repairHonda)).toHaveCount(0);

    await mainPage.filterClearAll().click();
    await expect(mainPage.brandFilter()).toHaveValue('');
    await expect(mainPage.yearFrom()).toHaveValue('');
    await expect(mainPage.mileageFrom()).toHaveValue('');
    await expect(mainPage.bikeRow(SEED_VINS.availableKtm)).toBeVisible();
    await expect(mainPage.bikeRow(SEED_VINS.repairHonda)).toBeVisible();
    await expect(mainPage.bikeRow(SEED_VINS.soldYamaha)).toBeVisible();
  });

  test('TC-FILTER-CLEAR-02: filter-year-from-clear', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.yearFrom().fill('2020');
    await expect(mainPage.bikeRow(SEED_VINS.repairHonda)).toHaveCount(0);
    await mainPage.yearFromClear().click();
    await expect(mainPage.yearFrom()).toHaveValue('');
    await expect(mainPage.bikeRow(SEED_VINS.repairHonda)).toBeVisible();
  });

  test('TC-FILTER-VALID-01: год до < от → error-filter-year-to', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.yearFrom().fill('2020');
    await mainPage.yearTo().fill('2015');
    await expect(mainPage.filterError('year-to')).toBeVisible();
    await expect(mainPage.filterError('year-to')).toContainText('Год «до» должен быть не меньше «от»');
    // Запрос не должен «сломать» предыдущее валидное состояние таблицы до ошибки —
    // при ошибке диапазона UI не применяет фильтр (якоря обоих лет остаются / или пусто).
    // Проверяем, что ошибка показана и поле «до» сохраняет ввод.
    await expect(mainPage.yearTo()).toHaveValue('2015');
  });

  test('TC-FILTER-VALID-02: пробег до < от → error-filter-mileage-to', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.mileageFrom().fill('50000');
    await mainPage.mileageTo().fill('10000');
    await expect(mainPage.filterError('mileage-to')).toBeVisible();
    await expect(mainPage.filterError('mileage-to')).toContainText(/не меньше|«до»|от/i);
  });

  test('TC-FILTER-VALID-03: минус в пробеге не принимается', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.mileageFrom().click();
    await mainPage.mileageFrom().pressSequentially('-5');
    await expect(mainPage.mileageFrom()).not.toHaveValue('-5');
  });

  test('TC-FILTER-VALID-04: год — не более 4 цифр', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.yearFrom().click();
    await mainPage.yearFrom().pressSequentially('12345');
    await expect(mainPage.yearFrom()).toHaveValue('1234');
  });

  test('TC-FILTER-BRAND-01: фильтр по марке KTM', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.brandFilter().fill('KTM');
    await expect(mainPage.bikeRow(SEED_VINS.availableKtm)).toBeVisible();
    await expect(mainPage.bikeRow(SEED_VINS.repairHonda)).toHaveCount(0);
    await expect(mainPage.bikeRow(SEED_VINS.soldYamaha)).toHaveCount(0);
  });

  test('TC-FILTER-MODEL-01: фильтр по модели EXC', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.modelFilter().fill('EXC');
    await expect(mainPage.bikeRow(SEED_VINS.availableKtm)).toBeVisible();
    await expect(mainPage.bikeRow(SEED_VINS.repairHonda)).toHaveCount(0);
  });

  test('TC-FILTER-BRAND-MODEL-01: марка + модель вместе', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.brandFilter().fill('Honda');
    await mainPage.modelFilter().fill('CRF');
    await expect(mainPage.bikeRow(SEED_VINS.repairHonda)).toBeVisible();
    await expect(mainPage.bikeRow(SEED_VINS.availableKtm)).toHaveCount(0);
  });

  test('TC-FILTER-BRAND-02: очистка filter-brand-clear', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.brandFilter().fill('Yamaha');
    await expect(mainPage.bikeRow(SEED_VINS.availableKtm)).toHaveCount(0);
    await mainPage.brandFilterClear().click();
    await expect(mainPage.brandFilter()).toHaveValue('');
    await expect(mainPage.bikeRow(SEED_VINS.availableKtm)).toBeVisible();
  });
});
