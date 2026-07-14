import { test, expect, type Page } from '@playwright/test';
import { MainPage } from '../src/pages/main.page';
import { BikeFormPage } from '../src/pages/bike-form.page';
import { getSeedCredentials } from '../src/helpers/env';
import { loginAs } from '../src/helpers/auth';
import { buildUniqueVin } from '../src/helpers/vin';

/**
 * Матрица валидации формы (волна 10.5).
 * NEG-01 / LAST-01 / CREATE-VIN / BUG-03 (NEG-06/07/09/10) — уже в crud / known-bugs.
 */

async function openCreateAsAdmin(page: Page) {
  const { admin } = getSeedCredentials();
  const mainPage = new MainPage(page);
  const form = new BikeFormPage(page);
  await loginAs(page, admin);
  await mainPage.addBike().click();
  await form.expectOpen();
  return { mainPage, form, admin };
}

/** Базовые валидные поля (можно переопределить / очистить) */
async function fillValidBase(
  form: BikeFormPage,
  overrides: Partial<{
    brand: string;
    model: string;
    year: string;
    mileage: string;
    vin: string;
    lastService: string;
  }> = {},
) {
  const vin = overrides.vin ?? buildUniqueVin('V');
  await form.brand().fill(overrides.brand ?? 'Ktm');
  await form.model().fill(overrides.model ?? 'Valid');
  await form.year().fill(overrides.year ?? '2020');
  await form.mileage().fill(overrides.mileage ?? '0');
  await form.vin().fill(vin);
  await form.lastService().fill(overrides.lastService ?? '2020-01-01');
  return vin;
}

test.describe('Validation matrix (NEG / LAST / VIN edit)', () => {
  test('TC-BIKE-NEG-02: пустая модель → error-model', async ({ page }) => {
    const { form } = await openCreateAsAdmin(page);
    await fillValidBase(form, { model: '' });
    await form.submit();
    await expect(form.error('model')).toBeVisible();
    await expect(form.error('model')).toContainText('Модель обязательна');
  });

  test('TC-BIKE-NEG-03: VIN короче 17 → error-vin', async ({ page }) => {
    const { form } = await openCreateAsAdmin(page);
    await fillValidBase(form, { vin: 'ABC123' });
    await form.submit();
    await expect(form.error('vin')).toBeVisible();
    await expect(form.error('vin')).toContainText('VIN должен содержать ровно 17 символов');
  });

  test('TC-BIKE-NEG-04: VIN только цифры → error-vin', async ({ page }) => {
    const { form } = await openCreateAsAdmin(page);
    await fillValidBase(form, { vin: '12345678901234567' });
    await form.submit();
    await expect(form.error('vin')).toBeVisible();
    await expect(form.error('vin')).toContainText('VIN должен содержать и буквы, и цифры');
  });

  test('TC-BIKE-NEG-04b: VIN с буквой Q → error-vin про I/O/Q', async ({ page }) => {
    const { form } = await openCreateAsAdmin(page);
    // 17 символов, есть Q — раньше нормализация вырезала Q и показывала «ровно 17»
    await fillValidBase(form, { vin: 'KTM2020QA0000001A' });
    await form.submit();
    await expect(form.error('vin')).toBeVisible();
    await expect(form.error('vin')).toContainText('I, O, Q');
  });

  test('TC-BIKE-NEG-05: отрицательный пробег → error-mileage', async ({ page }) => {
    const { form } = await openCreateAsAdmin(page);
    await fillValidBase(form, { mileage: '-1' });
    await form.submit();
    await expect(form.error('mileage')).toBeVisible();
    await expect(form.error('mileage')).toContainText('Пробег не может быть отрицательным числом');
  });

  test('TC-BIKE-NEG-08: год текущий+1 → error-year (корректная граница)', async ({ page }) => {
    const currentYear = new Date().getFullYear();
    const year = currentYear + 1;
    const { form } = await openCreateAsAdmin(page);
    await fillValidBase(form, { year: String(year) });
    await form.submit();
    await expect(form.error('year')).toBeVisible();
    // Текст ссылается на текущий год, не на введённый current+1
    await expect(form.error('year')).toContainText(`Год не может быть позже ${currentYear}`);
  });

  test('TC-BIKE-NEG-11: дата ТО раньше 1990 → error-lastService', async ({ page }) => {
    const { form } = await openCreateAsAdmin(page);
    await fillValidBase(form, { lastService: '1989-12-31' });
    await form.submit();
    await expect(form.error('lastService')).toBeVisible();
    await expect(form.error('lastService')).toContainText('Дата последнего ТО не может быть раньше 1990');
  });

  test('TC-BIKE-NEG-12: дата ТО в будущем → error-lastService', async ({ page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const iso = tomorrow.toISOString().slice(0, 10);

    const { form } = await openCreateAsAdmin(page);
    await fillValidBase(form, { lastService: iso });
    await form.submit();
    await expect(form.error('lastService')).toBeVisible();
    await expect(form.error('lastService')).toContainText('Дата последнего ТО не может быть в будущем');
  });

  test('TC-BIKE-NEG-13: несуществующая дата ТО → error-lastService', async ({ page }) => {
    const { form } = await openCreateAsAdmin(page);
    await fillValidBase(form, { lastService: '20240231' });
    await expect(form.lastService()).toHaveValue('2024-02-31');
    await form.submit();
    await expect(form.error('lastService')).toBeVisible();
    await expect(form.error('lastService')).toContainText('Некорректная дата последнего ТО');
  });

  test('TC-BIKE-LAST-02: календарь пишет YYYY-MM-DD в текстовое поле', async ({ page }) => {
    const { form, mainPage } = await openCreateAsAdmin(page);
    const vin = buildUniqueVin('L');

    await form.brand().fill('AaaCal');
    await form.model().fill('Calendar');
    await form.year().fill('2018');
    await form.mileage().fill('10');
    await form.vin().fill(vin);
    await form.lastServiceCalendar().fill('2015-06-15');
    await expect(form.lastService()).toHaveValue('2015-06-15');
    await form.submit();
    await form.expectClosed();
    await mainPage.ensureBikeVisible(vin);
  });

  test('TC-BIKE-LAST-03: маска 15052020 → некорректная дата', async ({ page }) => {
    const { form } = await openCreateAsAdmin(page);
    await fillValidBase(form, { lastService: '15052020' });
    await expect(form.lastService()).toHaveValue('1505-20-20');
    await form.submit();
    await expect(form.error('lastService')).toBeVisible();
    await expect(form.error('lastService')).toContainText('Некорректная дата последнего ТО');
  });

  test('TC-BIKE-NEG-14: граничная дата ТО 1990-01-01 сохраняется', async ({ page }) => {
    const { form, mainPage } = await openCreateAsAdmin(page);
    const vin = await fillValidBase(form, {
      brand: 'AaaBound',
      model: 'MinDate',
      lastService: '1990-01-01',
    });
    await form.submit();
    await form.expectClosed();
    await mainPage.ensureBikeVisible(vin);
  });

  test('TC-BIKE-EDIT-VIN-01: успешная смена VIN', async ({ page }) => {
    const { form, mainPage } = await openCreateAsAdmin(page);
    const vin1 = buildUniqueVin('1');
    const vin2 = buildUniqueVin('2');

    await form.fill({
      brand: 'AaaVin1',
      model: 'ChangeVin',
      year: 2020,
      mileage: 0,
      vin: vin1,
      lastService: '2020-01-01',
    });
    await form.submit();
    await form.expectClosed();
    await mainPage.ensureBikeVisible(vin1);

    await mainPage.editBike(vin1).click();
    await form.expectOpen();
    await form.vin().fill(vin2);
    await form.submit();
    await form.expectClosed();

    await mainPage.ensureBikeVisible(vin2);
    await expect(mainPage.editBike(vin2)).toBeVisible();
    await expect(mainPage.bikeRow(vin1)).toHaveCount(0);
  });

  test('TC-BIKE-EDIT-VIN-02: дубликат VIN при edit', async ({ page }) => {
    const { form, mainPage } = await openCreateAsAdmin(page);
    const vinA = buildUniqueVin('A');
    const vinB = buildUniqueVin('B');

    await form.fill({
      brand: 'AaaVinA',
      model: 'First',
      year: 2019,
      mileage: 1,
      vin: vinA,
      lastService: '2020-01-01',
    });
    await form.submit();
    await form.expectClosed();
    await mainPage.ensureBikeVisible(vinA);

    await mainPage.addBike().click();
    await form.expectOpen();
    await form.fill({
      brand: 'AaaVinB',
      model: 'Second',
      year: 2018,
      mileage: 2,
      vin: vinB,
      lastService: '2021-01-01',
    });
    await form.submit();
    await form.expectClosed();
    await mainPage.ensureBikeVisible(vinB);

    await mainPage.editBike(vinB).click();
    await form.expectOpen();
    await form.vin().fill(vinA);

    const updateResponse = page.waitForResponse(
      (res) =>
        res.url().includes('/api/bikes/') &&
        res.request().method() === 'PUT',
    );
    await form.submit();
    const response = await updateResponse;
    expect(response.status()).toBe(400);
    await expect(form.serverError()).toBeVisible();
    await expect(form.serverError()).toContainText(/VIN уже существует|уже существует/i);
  });
});
