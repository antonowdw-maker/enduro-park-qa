import { test, expect } from '@playwright/test';
import { MainPage } from '../src/pages/main.page';
import { SEED_BIKE_COUNT, SEED_VINS } from '../src/data/seed-vins';

/**
 * Seed / счётчики (волна 10.6).
 * TC-SEED-01 (повторный seed) — вне Playwright: смотрим лог `npm run seed` / CI globalSetup.
 */
test.describe('Seed anchors', () => {
  test.beforeEach(async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.open();
    await mainPage.expectTableHasRows();
    await mainPage.setLimit50();
  });

  test('TC-SEED-02: якорный KTM в таблице', async ({ page }) => {
    const mainPage = new MainPage(page);
    const row = mainPage.bikeRow(SEED_VINS.availableKtm);
    await expect(row).toBeVisible();
    await expect(row).toContainText('KTM');
    await expect(row).toContainText('2020');
    // UI: локальный формат пробега «12 000» / «12\u00a0000»
    await expect(row).toContainText(/12[\s\u00a0]000/);
    await expect(row).toContainText('Доступен');
  });

  test('TC-SEED-03: filter-available → total 19', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.filterAvailable().click();
    await expect(mainPage.totalInDb()).toContainText('19');
    await expect(mainPage.bikeRow(SEED_VINS.availableKtm)).toBeVisible();
    await expect(mainPage.bikeRow(SEED_VINS.repairHonda)).toHaveCount(0);
  });

  test('TC-SEED-04: filter-repair → якорный Honda', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.filterRepair().click();
    await expect(mainPage.bikeRow(SEED_VINS.repairHonda)).toBeVisible();
    // BUG-01: в таблице «В ремонте», не «Ремонт»
    await expect(mainPage.statusCell(SEED_VINS.repairHonda)).toContainText('В ремонте');
  });

  test('smoke: после seed в базе SEED_BIKE_COUNT байков', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.filterAll().click();
    await expect(mainPage.totalInDb()).toContainText(String(SEED_BIKE_COUNT));
  });
});
