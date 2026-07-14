import { test, expect } from '@playwright/test';
import { MainPage } from '../src/pages/main.page';
import { SEED_BIKE_COUNT, SEED_VINS } from '../src/data/seed-vins';
import { resetDatabaseSeed } from '../src/helpers/seed';

/**
 * Фильтр марка/модель — техники тест-дизайна (ТТД):
 * - классы эквивалентности (валидные / невалидные / пусто)
 * - границы (maxLength 40)
 * - decision table: марка×модель×статус×год
 * - негатив: пустой результат, конфликт полей, пробелы
 */
test.describe('Filters brand/model (TTD)', () => {
  test.beforeAll(() => {
    resetDatabaseSeed();
  });

  test.beforeEach(async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.open();
    await mainPage.expectTableHasRows();
    await mainPage.setLimit50();
  });

  // --- Позитив: классы эквивалентности / подстрока ---

  test('TC-FILTER-BRAND-03: подстрока марки (EP) — «ond» → Honda', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.brandFilter().fill('ond');
    await expect(mainPage.bikeRow(SEED_VINS.repairHonda)).toBeVisible();
    await expect(mainPage.bikeRow(SEED_VINS.availableKtm)).toHaveCount(0);
    await expect(mainPage.bikeRow(SEED_VINS.soldYamaha)).toHaveCount(0);
  });

  test('TC-FILTER-BRAND-04: регистр не важен (EP) — «ktm»', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.brandFilter().fill('ktm');
    await expect(mainPage.bikeRow(SEED_VINS.availableKtm)).toBeVisible();
    await expect(mainPage.bikeRow(SEED_VINS.repairHonda)).toHaveCount(0);
  });

  test('TC-FILTER-MODEL-02: подстрока модели (EP) — «YZ250» → Yamaha', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.modelFilter().fill('YZ250');
    await expect(mainPage.bikeRow(SEED_VINS.soldYamaha)).toBeVisible();
    await expect(mainPage.bikeRow(SEED_VINS.availableKtm)).toHaveCount(0);
    await expect(mainPage.bikeRow(SEED_VINS.repairHonda)).toHaveCount(0);
  });

  test('TC-FILTER-MODEL-03: очистка filter-model-clear', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.modelFilter().fill('EXC');
    await expect(mainPage.bikeRow(SEED_VINS.repairHonda)).toHaveCount(0);
    await mainPage.modelFilterClear().click();
    await expect(mainPage.modelFilter()).toHaveValue('');
    await expect(mainPage.bikeRow(SEED_VINS.repairHonda)).toBeVisible();
  });

  // --- Негатив: пустой / конфликтный результат ---

  test('TC-FILTER-BRAND-NEG-01: несуществующая марка → 0 строк', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.brandFilter().fill('NoSuchBrandXYZ');
    await expect(mainPage.totalInDb()).toContainText('0');
    await expect(mainPage.bikeRows()).toHaveCount(0);
  });

  test('TC-FILTER-MODEL-NEG-01: несуществующая модель → 0 строк', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.modelFilter().fill('NoSuchModelXYZ');
    await expect(mainPage.totalInDb()).toContainText('0');
    await expect(mainPage.bikeRows()).toHaveCount(0);
  });

  test('TC-FILTER-BRAND-MODEL-NEG-01: конфликт марка+модель (KTM + CRF) → пусто', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.brandFilter().fill('KTM');
    await mainPage.modelFilter().fill('CRF');
    await expect(mainPage.totalInDb()).toContainText('0');
    await expect(mainPage.bikeRow(SEED_VINS.availableKtm)).toHaveCount(0);
    await expect(mainPage.bikeRow(SEED_VINS.repairHonda)).toHaveCount(0);
  });

  test('TC-FILTER-BRAND-NEG-02: только пробелы не фильтруют (EP пусто)', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.brandFilter().fill('   ');
    await expect(mainPage.totalInDb()).toContainText(String(SEED_BIKE_COUNT));
    await expect(mainPage.bikeRow(SEED_VINS.availableKtm)).toBeVisible();
    await expect(mainPage.bikeRow(SEED_VINS.repairHonda)).toBeVisible();
  });

  test('TC-FILTER-MODEL-NEG-02: модель не от той марки (Honda + EXC) → пусто', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.brandFilter().fill('Honda');
    await mainPage.modelFilter().fill('EXC');
    await expect(mainPage.totalInDb()).toContainText('0');
    await expect(mainPage.bikeRow(SEED_VINS.repairHonda)).toHaveCount(0);
  });

  // --- Границы (BVA) ---

  test('TC-FILTER-BRAND-BVA-01: марка maxLength 40 — 41-й символ не вводится', async ({ page }) => {
    const mainPage = new MainPage(page);
    const forty = 'A'.repeat(40);
    await mainPage.brandFilter().click();
    await mainPage.brandFilter().pressSequentially(`${forty}Z`);
    await expect(mainPage.brandFilter()).toHaveValue(forty);
  });

  // --- Decision table: комбинации с другими фильтрами ---

  test('TC-FILTER-BRAND-DT-01: марка + статус (KTM + Доступен)', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.brandFilter().fill('KTM');
    await mainPage.filterAvailable().click();
    await expect(mainPage.bikeRow(SEED_VINS.availableKtm)).toBeVisible();
    await expect(mainPage.bikeRow(SEED_VINS.repairHonda)).toHaveCount(0);
    await expect(mainPage.bikeRow(SEED_VINS.soldYamaha)).toHaveCount(0);
  });

  test('TC-FILTER-BRAND-DT-02: марка + год от (Honda + yearFrom 2020) → пусто', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.brandFilter().fill('Honda');
    await mainPage.yearFrom().fill('2020');
    // Якорь Honda 2015 отсекается по году
    await expect(mainPage.bikeRow(SEED_VINS.repairHonda)).toHaveCount(0);
    await expect(mainPage.bikeRow(SEED_VINS.availableKtm)).toHaveCount(0);
  });

  test('TC-FILTER-BRAND-DT-03: марка + год до (Honda + yearTo 2015) → Honda', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.brandFilter().fill('Honda');
    await mainPage.yearTo().fill('2015');
    await expect(mainPage.bikeRow(SEED_VINS.repairHonda)).toBeVisible();
    await expect(mainPage.bikeRow(SEED_VINS.availableKtm)).toHaveCount(0);
  });

  test('TC-FILTER-BRAND-DT-04: модель + статус Продан (YZ250 + sold)', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.modelFilter().fill('YZ250');
    await mainPage.filterSold().click();
    await expect(mainPage.bikeRow(SEED_VINS.soldYamaha)).toBeVisible();
    await expect(mainPage.bikeRow(SEED_VINS.availableKtm)).toHaveCount(0);
  });
});
