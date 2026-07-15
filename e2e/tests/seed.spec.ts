import { test, expect } from '@playwright/test';
import { MainPage } from '../src/pages/main.page';
import { SEED_BIKE_COUNT, SEED_VINS } from '../src/data/seed-vins';
import {
  resetDatabaseSeed,
  seedAndCaptureFingerprint,
} from '../src/helpers/seed';

/**
 * Seed / счётчики (волна 10.6 + A: TC-SEED-01).
 * beforeAll: пере-seed — иначе CRUD/validation из более ранних файлов портят 19/50.
 */
test.describe('Seed determinism', () => {
  test('TC-SEED-01: повторный seed даёт тот же набор', () => {
    const first = seedAndCaptureFingerprint();
    const second = seedAndCaptureFingerprint();

    expect(second).toEqual(first);
    expect(first.total).toBe(SEED_BIKE_COUNT);
    expect(first.firstVin).toBe(SEED_VINS.availableKtm);
    expect(first.byStatus).toEqual({ available: 19, repair: 16, sold: 15 });
    expect(first.version).toBe('2026.07.14');
    expect(first.rows).toHaveLength(SEED_BIKE_COUNT);
  });
});

test.describe('Seed anchors', () => {
  test.beforeAll(() => {
    resetDatabaseSeed();
  });

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
    await mainPage.runAndWaitForBikes(() => mainPage.filterAvailable().click(), {
      status: 'available',
    });
    await expect(mainPage.totalInDb()).toContainText('19');
    await expect(mainPage.bikeRow(SEED_VINS.availableKtm)).toBeVisible();
    await expect(mainPage.bikeRow(SEED_VINS.repairHonda)).toHaveCount(0);
  });

  test('TC-SEED-04: filter-repair → якорный Honda', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.runAndWaitForBikes(() => mainPage.filterRepair().click(), {
      status: 'repair',
    });
    await expect(mainPage.bikeRow(SEED_VINS.repairHonda)).toBeVisible();
    // BUG-01: в таблице «В ремонте», не «Ремонт»
    await expect(mainPage.statusCell(SEED_VINS.repairHonda)).toContainText('В ремонте');
  });

  test('TC-SEED-05: якорный Kayo (каталог modern)', async ({ page }) => {
    const mainPage = new MainPage(page);
    const row = mainPage.bikeRow(SEED_VINS.availableKayo);
    await expect(row).toBeVisible();
    await expect(row).toContainText('Kayo');
    await expect(row).toContainText('T2 300');
    await expect(row).toContainText('2023');
    await expect(row).toContainText('Доступен');

    // После влития фильтра: марка отсекает чужие якоря
    await mainPage.runAndWaitForBikes(() => mainPage.brandFilter().fill('Kayo'), {
      brand: 'Kayo',
    });
    await expect(row).toBeVisible();
    await expect(mainPage.bikeRow(SEED_VINS.availableKtm)).toHaveCount(0);
  });

  test('TC-SEED-06: якорный Regulmoto в ремонте', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.runAndWaitForBikes(() => mainPage.filterRepair().click(), {
      status: 'repair',
    });
    const row = mainPage.bikeRow(SEED_VINS.repairRegulmoto);
    await expect(row).toBeVisible();
    await expect(row).toContainText('Regulmoto');
    await expect(row).toContainText('Athlete 300');
  });

  test('TC-SEED-07: якорный Motoland продан', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.runAndWaitForBikes(() => mainPage.filterSold().click(), {
      status: 'sold',
    });
    const row = mainPage.bikeRow(SEED_VINS.soldMotoland);
    await expect(row).toBeVisible();
    await expect(row).toContainText('Motoland');
    await expect(row).toContainText('XT 250');
  });

  test('smoke: после seed в базе SEED_BIKE_COUNT байков', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.runAndWaitForBikes(() => mainPage.filterAll().click());
    await expect(mainPage.totalInDb()).toContainText(String(SEED_BIKE_COUNT));
  });
});
