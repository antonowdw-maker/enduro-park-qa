import { test, expect } from '@playwright/test';
import { MainPage } from '../src/pages/main.page';
import { BikeFormPage } from '../src/pages/bike-form.page';
import { getSeedCredentials } from '../src/helpers/env';
import { loginAs } from '../src/helpers/auth';
import { buildUniqueVin } from '../src/helpers/vin';
import { SEED_VINS } from '../src/data/seed-vins';
import { markExpectedFailure } from '../src/helpers/known-bugs';

/**
 * Намеренные баги (волна H — учебный контракт).
 * Правильные ожидания + markExpectedFailure() в режиме teaching (KNOWN_BUGS.md).
 */
test.describe('Known bugs (правильные ожидания)', () => {
  const { admin } = getSeedCredentials();

  test('BUG-01 / метки: фильтр repair совпадает с текстом статуса в таблице', async ({ page }) => {
    markExpectedFailure('BUG-01: в фильтре «Ремонт», в таблице «В ремонте»');

    const mainPage = new MainPage(page);
    await mainPage.open();
    await mainPage.setLimit50();

    const filterText = (await mainPage.filterRepair().innerText()).trim();
    const statusText = (await mainPage.statusCell(SEED_VINS.repairHonda).innerText()).trim();
    expect(filterText).toBe(statusText);
  });

  test('BUG-02 / TC-BIKE-NEG-10: валидная форма TEST/123 успешно сохраняется', async ({ page }) => {
    markExpectedFailure('BUG-02: TEST/123 даёт ложную ошибку про роль guest');

    const mainPage = new MainPage(page);
    const form = new BikeFormPage(page);
    const vin = buildUniqueVin('B');

    await loginAs(page, admin);
    await mainPage.addBike().click();
    await form.fill({
      brand: 'TEST',
      model: '123',
      year: 2020,
      mileage: 0,
      vin,
      lastService: '2020-06-01',
      notes: 'should-save',
    });
    await form.submit();
    await form.expectClosed();
    await mainPage.setLimit50();
    await expect(mainPage.bikeRow(vin)).toBeVisible();
  });

  test('BUG-03 / TC-BIKE-NEG-07: год 1988 должен быть ошибкой', async ({ page }) => {
    markExpectedFailure('BUG-03: год 1988 ошибочно проходит валидацию');

    const mainPage = new MainPage(page);
    const form = new BikeFormPage(page);

    await loginAs(page, admin);
    await mainPage.addBike().click();
    await form.fill({
      brand: 'KTM',
      model: 'YearBug',
      year: 1988,
      mileage: 0,
      vin: buildUniqueVin('Y'),
      lastService: '2020-01-01',
    });
    await form.submit();
    await expect(form.error('year')).toBeVisible();
  });

  test('BUG-03 / TC-BIKE-NEG-09: год current+2 должен быть ошибкой', async ({ page }) => {
    const currentYear = new Date().getFullYear();
    markExpectedFailure('BUG-03: год current+2 ошибочно проходит валидацию');

    const mainPage = new MainPage(page);
    const form = new BikeFormPage(page);

    await loginAs(page, admin);
    await mainPage.addBike().click();
    await form.fill({
      brand: 'KTM',
      model: 'YearBug2',
      year: currentYear + 2,
      mileage: 0,
      vin: buildUniqueVin('Z'),
      lastService: '2020-01-01',
    });
    await form.submit();
    await expect(form.error('year')).toBeVisible();
  });

  test('TC-BIKE-NEG-06: год 1989 → error-year (корректная граница)', async ({ page }) => {
    const mainPage = new MainPage(page);
    const form = new BikeFormPage(page);

    await loginAs(page, admin);
    await mainPage.addBike().click();
    await form.fill({
      brand: 'KTM',
      model: 'YearOk',
      year: 1989,
      mileage: 0,
      vin: buildUniqueVin('X'),
      lastService: '2020-01-01',
    });
    await form.submit();
    await expect(form.error('year')).toBeVisible();
  });
});
