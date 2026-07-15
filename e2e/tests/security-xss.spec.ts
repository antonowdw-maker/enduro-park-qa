import { test, expect } from '@playwright/test';
import { MainPage } from '../src/pages/main.page';
import { BikeFormPage } from '../src/pages/bike-form.page';
import { getSeedCredentials } from '../src/helpers/env';
import { loginAs } from '../src/helpers/auth';
import { buildUniqueVin } from '../src/helpers/vin';

/**
 * Волна G — XSS regression: notes как текст после create → reload (React escape).
 */
test.describe('XSS notes regression (wave G)', () => {
  const { admin } = getSeedCredentials();

  test('TC-SEC-XSS-01: notes с тегом не исполняются после reload', async ({ page }) => {
    const mainPage = new MainPage(page);
    const form = new BikeFormPage(page);
    const vin = buildUniqueVin('X');
    const payload = '<img src=x onerror=alert(1)><script>alert(2)</script>';

    await loginAs(page, admin);
    await mainPage.addBike().click();
    await form.fill({
      brand: 'AaaXss',
      model: 'Notes Escape',
      year: 2021,
      mileage: 10,
      vin,
      lastService: '2024-01-01',
      notes: payload,
    });
    await form.submit();
    await form.expectClosed();
    await mainPage.ensureBikeVisible(vin);

    await page.reload();
    await mainPage.expectTableHasRows();
    await mainPage.ensureBikeVisible(vin);

    const row = mainPage.bikeRow(vin).filter({ visible: true });
    await expect(row).toContainText('<script>');
    const notesCell = row.locator('td').nth(7);
    const notesHtml = await notesCell.innerHTML();
    // React экранирует: в HTML есть &lt;…&gt;, нет живых тегов
    expect(notesHtml).toMatch(/&lt;script&gt;/i);
    expect(notesHtml.toLowerCase()).not.toMatch(/<script[\s>]/);
    expect(notesHtml.toLowerCase()).not.toMatch(/<img[\s>]/);
  });
});
