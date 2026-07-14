import { test, expect, type Page } from '@playwright/test';
import { MainPage } from '../src/pages/main.page';
import { SEED_BIKE_COUNT, SEED_VINS } from '../src/data/seed-vins';
import { resetDatabaseSeed } from '../src/helpers/seed';

/**
 * UI-сортировка и пагинация (докрытие после 10.6).
 * Default продукта: марка ↑ (F-SORT).
 * beforeAll: чистый seed — иначе limit 50 ≠ 50 после CRUD.
 */

async function cellTexts(page: Page, columnIndex: number): Promise<string[]> {
  const mainPage = new MainPage(page);
  const rows = mainPage.bikeRows();
  const count = await rows.count();
  const values: string[] = [];
  for (let i = 0; i < count; i += 1) {
    values.push((await rows.nth(i).locator('td').nth(columnIndex).innerText()).trim());
  }
  return values;
}

function parseMileageKm(text: string): number {
  const digits = text.replace(/[^\d]/g, '');
  return Number(digits);
}

function isSortedAscStrings(values: string[]): boolean {
  const normalized = values.map((v) => v.toLocaleLowerCase('ru'));
  for (let i = 1; i < normalized.length; i += 1) {
    if (normalized[i] < normalized[i - 1]) return false;
  }
  return true;
}

function isSortedAscNumbers(values: number[]): boolean {
  for (let i = 1; i < values.length; i += 1) {
    if (values[i] < values[i - 1]) return false;
  }
  return true;
}

function isSortedDescNumbers(values: number[]): boolean {
  for (let i = 1; i < values.length; i += 1) {
    if (values[i] > values[i - 1]) return false;
  }
  return true;
}

test.describe('Sort & pagination UI', () => {
  test.beforeAll(() => {
    resetDatabaseSeed();
  });

  test.beforeEach(async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.open();
    await mainPage.expectTableHasRows();
  });

  test('TC-SORT-01: по умолчанию — марка ↑', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.setLimit50();

    const brands = await cellTexts(page, 0);
    expect(brands).toHaveLength(SEED_BIKE_COUNT);
    expect(isSortedAscStrings(brands)).toBeTruthy();
    await expect(mainPage.bikeRow(SEED_VINS.minYearBeta)).toBeVisible();
  });

  test('TC-SORT-02: клик Год — asc, повторный — desc', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.setLimit50();

    await mainPage.sortHeader('year').click();
    const yearsAsc = (await cellTexts(page, 2)).map(Number);
    expect(isSortedAscNumbers(yearsAsc)).toBeTruthy();
    expect(yearsAsc[0]).toBe(1990);
    await expect(mainPage.bikeRow(SEED_VINS.minYearBeta)).toBeVisible();

    await mainPage.sortHeader('year').click();
    const yearsDesc = (await cellTexts(page, 2)).map(Number);
    expect(isSortedDescNumbers(yearsDesc)).toBeTruthy();
    expect(yearsDesc[0]).toBeGreaterThanOrEqual(2026);
  });

  test('TC-SORT-03: пробег asc → desc', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.setLimit50();

    await mainPage.sortHeader('mileage').click();
    const milesAsc = (await cellTexts(page, 4)).map(parseMileageKm);
    expect(isSortedAscNumbers(milesAsc)).toBeTruthy();
    expect(milesAsc[0]).toBe(0);

    await mainPage.sortHeader('mileage').click();
    const milesDesc = (await cellTexts(page, 4)).map(parseMileageKm);
    expect(isSortedDescNumbers(milesDesc)).toBeTruthy();
    expect(milesDesc[0]).toBeGreaterThanOrEqual(99999);
  });

  test('TC-PAGINATION-01: limit 10 → 10 строк, next меняет страницу', async ({ page }) => {
    const mainPage = new MainPage(page);

    await mainPage.paginationLimit().selectOption('10');
    await expect(mainPage.bikeRows()).toHaveCount(10);
    await expect(mainPage.pageIndicator()).toContainText(/СТРАНИЦА\s+1\s+ИЗ\s+5/i);
    await expect(mainPage.paginationPrev()).toBeDisabled();

    const firstPageVin = await mainPage.bikeRows().first().getAttribute('data-testid');

    await mainPage.paginationNext().click();
    await expect(mainPage.pageIndicator()).toContainText(/СТРАНИЦА\s+2\s+ИЗ\s+5/i);
    await expect(mainPage.paginationPrev()).toBeEnabled();
    await expect(mainPage.bikeRows()).toHaveCount(10);

    const secondPageVin = await mainPage.bikeRows().first().getAttribute('data-testid');
    expect(secondPageVin).not.toBe(firstPageVin);
  });

  test('TC-PAGINATION-02: prev возвращает на страницу 1', async ({ page }) => {
    const mainPage = new MainPage(page);

    await mainPage.paginationLimit().selectOption('10');
    await mainPage.paginationNext().click();
    await expect(mainPage.pageIndicator()).toContainText(/СТРАНИЦА\s+2/i);

    await mainPage.paginationPrev().click();
    await expect(mainPage.pageIndicator()).toContainText(/СТРАНИЦА\s+1\s+ИЗ\s+5/i);
    await expect(mainPage.paginationPrev()).toBeDisabled();
  });

  test('TC-PAGINATION-03: limit 50 → одна страница при 50 байках', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.setLimit50();

    await expect(mainPage.bikeRows()).toHaveCount(SEED_BIKE_COUNT);
    await expect(mainPage.pageIndicator()).toContainText(/СТРАНИЦА\s+1\s+ИЗ\s+1/i);
    await expect(mainPage.paginationNext()).toBeDisabled();
  });
});
