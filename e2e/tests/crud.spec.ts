import { test, expect } from '@playwright/test';
import { MainPage } from '../src/pages/main.page';
import { BikeFormPage } from '../src/pages/bike-form.page';
import { DeleteConfirmPage } from '../src/pages/delete-confirm.page';
import { getSeedCredentials } from '../src/helpers/env';
import { loginAs } from '../src/helpers/auth';
import { buildUniqueVin } from '../src/helpers/vin';

/**
 * CRUD UI (волна 10.3)
 * Каждый тест создаёт свой VIN — не завязан на порядок прогона.
 * Марка «Aaa…» — чтобы запись попадала в начало сортировки brand ↑.
 */
test.describe('CRUD bikes', () => {
  const { admin } = getSeedCredentials();

  test('TC-BIKE-CREATE: успешное добавление байка', async ({ page }) => {
    const mainPage = new MainPage(page);
    const form = new BikeFormPage(page);
    const vin = buildUniqueVin('C');

    await loginAs(page, admin);
    await mainPage.addBike().click();
    await form.expectOpen();
    await form.fill({
      brand: 'AaaCreate',
      model: 'E2E Create',
      year: 2022,
      mileage: 1000,
      vin,
      status: 'available',
      lastService: '2024-06-15',
      notes: 'e2e create',
    });
    await form.submit();
    await form.expectClosed();

    await mainPage.ensureBikeVisible(vin);
  });

  test('TC-BIKE-EDIT: изменение заметок', async ({ page }) => {
    const mainPage = new MainPage(page);
    const form = new BikeFormPage(page);
    const vin = buildUniqueVin('E');

    await loginAs(page, admin);
    await mainPage.addBike().click();
    await form.fill({
      brand: 'AaaEdit',
      model: 'E2E Edit',
      year: 2021,
      mileage: 500,
      vin,
      lastService: '2023-01-01',
      notes: 'before',
    });
    await form.submit();
    await form.expectClosed();

    await mainPage.ensureBikeVisible(vin);
    await mainPage.editBike(vin).click();
    await form.expectOpen();
    await form.notes().fill('after-edit');
    await form.submit();
    await form.expectClosed();

    await mainPage.ensureBikeVisible(vin);
    await expect(mainPage.bikeRow(vin)).toContainText('after-edit');
  });

  test('TC-BIKE-DELETE: удаление с подтверждением', async ({ page }) => {
    const mainPage = new MainPage(page);
    const form = new BikeFormPage(page);
    const del = new DeleteConfirmPage(page);
    const vin = buildUniqueVin('D');

    await loginAs(page, admin);
    await mainPage.addBike().click();
    await form.fill({
      brand: 'AaaDelete',
      model: 'E2E Delete',
      year: 2019,
      mileage: 200,
      vin,
      lastService: '2022-05-05',
    });
    await form.submit();
    await form.expectClosed();

    await mainPage.ensureBikeVisible(vin);
    await mainPage.deleteBike(vin).click();
    await del.expectOpen();
    await del.confirmDelete();

    await expect(mainPage.bikeRow(vin)).toHaveCount(0);
  });

  test('TC-BIKE-NEG-01: пустая марка → error-brand', async ({ page }) => {
    const mainPage = new MainPage(page);
    const form = new BikeFormPage(page);

    await loginAs(page, admin);
    await mainPage.addBike().click();
    await form.expectOpen();
    await form.brand().fill('A');
    await form.model().fill('X');
    await form.year().fill('2020');
    await form.mileage().fill('0');
    await form.vin().fill(buildUniqueVin('N'));
    await form.lastService().fill('2020-01-01');
    await form.submit();

    await expect(form.error('brand')).toBeVisible();
    await expect(form.error('brand')).toContainText('Минимум 2 символа для марки');
  });

  test('TC-BIKE-LAST-01: маска даты 20100101 → 2010-01-01', async ({ page }) => {
    const mainPage = new MainPage(page);
    const form = new BikeFormPage(page);

    await loginAs(page, admin);
    await mainPage.addBike().click();
    await form.expectOpen();
    await form.lastService().fill('20100101');
    await expect(form.lastService()).toHaveValue('2010-01-01');
  });

  test('TC-BIKE-CREATE-VIN-01: дубликат VIN при create', async ({ page }) => {
    const mainPage = new MainPage(page);
    const form = new BikeFormPage(page);
    // Seed VIN содержит «Q» (префикс QA) — Zod на фронте режет до API.
    // Дубликат проверяем так: создали свой VIN → повторный create с тем же VIN.
    const vin = buildUniqueVin('U');

    await loginAs(page, admin);

    await mainPage.addBike().click();
    await form.fill({
      brand: 'AaaDup1',
      model: 'First',
      year: 2015,
      mileage: 1,
      vin,
      lastService: '2020-01-01',
    });
    await form.submit();
    await form.expectClosed();
    await mainPage.ensureBikeVisible(vin);

    await mainPage.addBike().click();
    await form.expectOpen();
    await form.fill({
      brand: 'AaaDup2',
      model: 'Second',
      year: 2016,
      mileage: 2,
      vin,
      lastService: '2021-01-01',
    });
    await expect(form.vin()).toHaveValue(vin);

    const createResponse = page.waitForResponse(
      (res) => res.url().includes('/api/bikes') && res.request().method() === 'POST',
    );
    await form.submit();
    const response = await createResponse;
    expect(response.status()).toBe(400);
    await expect(form.serverError()).toBeVisible();
    await expect(form.serverError()).toContainText(/VIN уже существует|уже существует/i);
  });
});
