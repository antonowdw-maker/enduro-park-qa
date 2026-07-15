import { test, expect } from '@playwright/test';
import { MainPage } from '../src/pages/main.page';
import { BikeFormPage } from '../src/pages/bike-form.page';
import { DeleteConfirmPage } from '../src/pages/delete-confirm.page';
import { SEED_VINS } from '../src/data/seed-vins';
import { getSeedCredentials } from '../src/helpers/env';
import { loginAs } from '../src/helpers/auth';
import { buildUniqueVin } from '../src/helpers/vin';
import { resetDatabaseSeed } from '../src/helpers/seed';

/**
 * Волна F — a11y (focus trap, Escape/Enter, aria-sort, accessible names)
 * + mobile viewport (карточки вместо горизонтального scroll).
 */
test.describe('A11y + mobile (wave F)', () => {
  const { admin } = getSeedCredentials();

  test.beforeAll(() => {
    resetDatabaseSeed();
  });

  test('TC-A11Y-01: Escape закрывает форму байка', async ({ page }) => {
    const mainPage = new MainPage(page);
    const form = new BikeFormPage(page);

    await loginAs(page, admin);
    await mainPage.addBike().click();
    await form.expectOpen();
    await expect(form.modal()).toBeVisible();
    await expect(form.brand()).toBeFocused();

    await page.keyboard.press('Escape');
    await form.expectClosed();
  });

  test('TC-A11Y-02: Tab не уходит за пределы модалки формы', async ({ page }) => {
    const mainPage = new MainPage(page);
    const form = new BikeFormPage(page);

    await loginAs(page, admin);
    await mainPage.addBike().click();
    await form.expectOpen();
    await expect(form.brand()).toBeFocused();

    for (let i = 0; i < 24; i += 1) {
      await page.keyboard.press('Tab');
      const inside = await page.evaluate(
        () => !!document.activeElement?.closest('[data-testid="bike-form-modal"]'),
      );
      expect(inside, `focus left modal after Tab #${i + 1}`).toBe(true);
    }
  });

  test('TC-A11Y-03: Escape / Enter на confirm delete', async ({ page }) => {
    const mainPage = new MainPage(page);
    const form = new BikeFormPage(page);
    const del = new DeleteConfirmPage(page);
    const vin = buildUniqueVin('F');

    await loginAs(page, admin);
    await mainPage.addBike().click();
    await form.fill({
      brand: 'AaaA11y',
      model: 'Delete Keys',
      year: 2020,
      mileage: 100,
      vin,
      lastService: '2024-01-01',
    });
    await form.submit();
    await form.expectClosed();
    await mainPage.ensureBikeVisible(vin);

    await mainPage.deleteBike(vin).click();
    await del.expectOpen();
    await expect(del.confirm()).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(del.modal()).toHaveCount(0);
    await expect(mainPage.bikeRow(vin)).toBeVisible();

    await mainPage.deleteBike(vin).click();
    await del.expectOpen();
    await page.keyboard.press('Enter');
    await expect(del.modal()).toHaveCount(0);
    await expect(mainPage.bikeRow(vin)).toHaveCount(0);
  });

  test('TC-A11Y-04: aria-sort на заголовке + keyboard Toggle', async ({ page }) => {
    const mainPage = new MainPage(page);
    await mainPage.open();
    await mainPage.expectTableHasRows();

    const brandTh = page.locator('th', { has: mainPage.sortHeader('brand') });
    await expect(brandTh).toHaveAttribute('aria-sort', 'ascending');

    await mainPage.runAndWaitForBikes(async () => {
      await mainPage.sortHeader('brand').press('Enter');
    });
    await expect(brandTh).toHaveAttribute('aria-sort', 'descending');

    await mainPage.runAndWaitForBikes(async () => {
      await mainPage.sortHeader('year').press('Enter');
    });
    const yearTh = page.locator('th', { has: mainPage.sortHeader('year') });
    await expect(yearTh).toHaveAttribute('aria-sort', 'ascending');
    await expect(brandTh).toHaveAttribute('aria-sort', 'none');
  });

  test('TC-A11Y-05: accessible name у edit/delete', async ({ page }) => {
    const mainPage = new MainPage(page);
    await loginAs(page, admin);
    await mainPage.setLimit50();

    const edit = page.getByRole('button', {
      name: new RegExp(`Редактировать байк.*${SEED_VINS.availableKtm}`),
    });
    const remove = page.getByRole('button', {
      name: new RegExp(`Удалить байк.*${SEED_VINS.availableKtm}`),
    });
    await expect(edit).toBeVisible();
    await expect(remove).toBeVisible();
  });

  test('TC-MOBILE-01: узкий viewport — карточки без table-scroll', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const mainPage = new MainPage(page);
    await mainPage.open();
    await mainPage.setLimit50();

    await expect(page.getByTestId('bike-cards')).toBeVisible();
    await expect(mainPage.bikeCard(SEED_VINS.availableKtm)).toBeVisible();
    await expect(mainPage.bikeRow(SEED_VINS.availableKtm)).toBeHidden();

    // Только контейнер карточек (не родители: там может лежать скрытая wide-таблица)
    const hasHScroll = await page.getByTestId('bike-cards').evaluate(
      (el) => el.scrollWidth > el.clientWidth + 2,
    );
    expect(hasHScroll).toBe(false);
  });

  test('TC-MOBILE-02: все статусы фильтра видны (wrap)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const mainPage = new MainPage(page);
    await mainPage.open();

    await expect(page.getByTestId('filter-all')).toBeVisible();
    await expect(page.getByTestId('filter-available')).toBeVisible();
    await expect(page.getByTestId('filter-repair')).toBeVisible();
    await expect(page.getByTestId('filter-sold')).toBeVisible();

    // Кнопка целиком в layout (не обрезана overflow родителя)
    const soldBox = await page.getByTestId('filter-sold').boundingBox();
    const rowBox = await page.getByTestId('filter-status-row').boundingBox();
    expect(soldBox).toBeTruthy();
    expect(rowBox).toBeTruthy();
    expect(soldBox!.x + soldBox!.width).toBeLessThanOrEqual(rowBox!.x + rowBox!.width + 1);
    expect(soldBox!.y + soldBox!.height).toBeLessThanOrEqual(rowBox!.y + rowBox!.height + 1);
  });

  test('TC-MOBILE-03: mobile-sort меняет order', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const mainPage = new MainPage(page);
    await mainPage.open();

    await expect(page.getByTestId('mobile-sort')).toBeVisible();
    await mainPage.runAndWaitForBikes(
      async () => {
        await page.getByTestId('mobile-sort-field').selectOption('year');
      },
      { sortBy: 'year', order: 'asc' },
    );
    await mainPage.runAndWaitForBikes(
      async () => {
        await page.getByTestId('mobile-sort-order').click();
      },
      { sortBy: 'year', order: 'desc' },
    );
  });

  test('TC-MOBILE-04: модалка create вписывается в viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 700 });
    const mainPage = new MainPage(page);
    const form = new BikeFormPage(page);

    await loginAs(page, admin);
    await mainPage.addBike().click();
    await form.expectOpen();

    const fits = await form.modal().evaluate((el) => {
      const panel = el.firstElementChild as HTMLElement | null;
      if (!panel) return false;
      const rect = panel.getBoundingClientRect();
      return rect.top >= -1 && rect.bottom <= window.innerHeight + 1 && rect.width <= window.innerWidth + 1;
    });
    expect(fits).toBe(true);
    await expect(form.brand()).toBeVisible();
    await expect(form.save()).toBeVisible();
  });
});
