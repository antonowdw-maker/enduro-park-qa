import { test, expect } from '@playwright/test';
import { MainPage } from '../src/pages/main.page';
import { getSeedCredentials } from '../src/helpers/env';
import { loginAs } from '../src/helpers/auth';
import { SEED_VINS } from '../src/data/seed-vins';

/**
 * Роли в UI (волна 10.2)
 * API TC-ROLE-04…06 оставляем на 10.3 / отдельный API-слой.
 */
test.describe('Roles UI', () => {
  const { admin, mechanic } = getSeedCredentials();

  test('TC-ROLE-01 / TC-AUTH-07: аноним не видит CRUD', async ({ page }) => {
    const mainPage = new MainPage(page);

    await mainPage.open();
    await mainPage.expectTableHasRows();
    await mainPage.setLimit50();

    // TC-AUTH-07
    await expect(mainPage.headerLogin()).toBeVisible();
    await expect(mainPage.addBike()).toHaveCount(0);

    // TC-ROLE-01: нет действий, есть readonly-placeholder
    await expect(mainPage.editBike(SEED_VINS.availableKtm)).toHaveCount(0);
    await expect(mainPage.deleteBike(SEED_VINS.availableKtm)).toHaveCount(0);
    await expect(page.getByTestId('actions-readonly-placeholder').first()).toBeVisible();
  });

  test('TC-ROLE-02 / TC-AUTH-02: mechanic — add+edit, без delete', async ({ page }) => {
    const mainPage = new MainPage(page);

    await loginAs(page, mechanic);
    await mainPage.setLimit50();

    await expect(mainPage.addBike()).toBeVisible();
    await expect(mainPage.editBike(SEED_VINS.availableKtm)).toBeVisible();
    await expect(mainPage.deleteBike(SEED_VINS.availableKtm)).toHaveCount(0);
  });

  test('TC-ROLE-03: admin — полный доступ', async ({ page }) => {
    const mainPage = new MainPage(page);

    await loginAs(page, admin);
    await mainPage.setLimit50();

    await expect(mainPage.addBike()).toBeVisible();
    await expect(mainPage.editBike(SEED_VINS.availableKtm)).toBeVisible();
    await expect(mainPage.deleteBike(SEED_VINS.availableKtm)).toBeVisible();
  });
});
