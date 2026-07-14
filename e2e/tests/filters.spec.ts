import { test, expect } from '@playwright/test';
import { MainPage } from '../src/pages/main.page';
import { SEED_VINS } from '../src/data/seed-vins';

/**
 * Фильтры по статусу (волна 10.2)
 * Используем якорные VIN из seed — не завязаны на UUID.
 */
test.describe('Filters', () => {
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
});
