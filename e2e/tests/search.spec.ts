import { test, expect } from '@playwright/test';
import { MainPage } from '../src/pages/main.page';
import { SEED_VINS } from '../src/data/seed-vins';
import { resetDatabaseSeed } from '../src/helpers/seed';

/**
 * Волна E — UI search (debounce/clear/empty) + ошибка списка / retry.
 */
test.describe('Search UI + list error (wave E)', () => {
  test.beforeAll(() => {
    resetDatabaseSeed();
  });

  test.beforeEach(async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.open();
    await mainPage.setLimit50();
  });

  test('TC-SEARCH-01: search=KTM — якорь available, не Honda', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.runAndWaitForBikes(
      async () => {
        await mainPage.searchFilter().fill('KTM');
      },
      { search: 'KTM' },
    );
    await expect(mainPage.bikeRow(SEED_VINS.availableKtm)).toBeVisible();
    await expect(mainPage.bikeRow(SEED_VINS.repairHonda)).toHaveCount(0);
  });

  test('TC-SEARCH-02: search по модели EXC (OR brand/model)', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.runAndWaitForBikes(
      async () => {
        await mainPage.searchFilter().fill('EXC');
      },
      { search: 'EXC' },
    );
    await expect(mainPage.bikeRow(SEED_VINS.availableKtm)).toBeVisible();
  });

  test('TC-SEARCH-03: регистр — ktm', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.runAndWaitForBikes(
      async () => {
        await mainPage.searchFilter().fill('ktm');
      },
      { search: 'ktm' },
    );
    await expect(mainPage.bikeRow(SEED_VINS.availableKtm)).toBeVisible();
  });

  test('TC-SEARCH-NEG-01: нет совпадений → list-empty', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.runAndWaitForBikes(
      async () => {
        await mainPage.searchFilter().fill('NoSuchBikeZZZ');
      },
      { search: 'NoSuchBikeZZZ' },
    );
    await expect(mainPage.listEmpty()).toBeVisible();
    await expect(mainPage.totalInDb()).toContainText('0');
  });

  test('TC-SEARCH-04: clear снимает search', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.runAndWaitForBikes(
      async () => {
        await mainPage.searchFilter().fill('Kayo');
      },
      { search: 'Kayo' },
    );
    await expect(mainPage.bikeRow(SEED_VINS.availableKayo)).toBeVisible();

    await mainPage.tap(mainPage.searchFilterClear(), { clear: true });
    await expect(mainPage.searchFilter()).toHaveValue('');
    await expect(mainPage.bikeRow(SEED_VINS.availableKtm)).toBeVisible({ timeout: 15_000 });
  });

  test('TC-SEARCH-05: debounce — GET с search=KTM после паузы', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.runAndWaitForBikes(
      async () => {
        await mainPage.searchFilter().pressSequentially('KTM', { delay: 30 });
      },
      { search: 'KTM' },
    );
    await expect(mainPage.bikeRow(SEED_VINS.availableKtm)).toBeVisible();
  });

  test('TC-LIST-ERROR-01: 500 на список → list-error + retry', async ({ page }) => {
    const mainPage = new MainPage(page);
    let failOnce = true;
    await page.route('**/api/bikes*', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue();
        return;
      }
      if (failOnce) {
        failOnce = false;
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Ошибка при получении списка' }),
        });
        return;
      }
      await route.continue();
    });

    await mainPage.runAndWaitForBikes(
      async () => {
        await mainPage.searchFilter().fill('Honda');
      },
      { search: 'Honda' },
      { requireOk: false },
    );
    await expect(mainPage.listError()).toBeVisible();
    await expect(mainPage.listError()).toContainText(/Ошибка при получении списка|Не удалось загрузить/i);
    await expect(mainPage.listRetry()).toBeVisible();

    await mainPage.runAndWaitForBikes(async () => {
      await mainPage.listRetry().click();
    });
    await expect(mainPage.listError()).toHaveCount(0);
    await expect(mainPage.bikeRow(SEED_VINS.repairHonda)).toBeVisible();
  });
});
