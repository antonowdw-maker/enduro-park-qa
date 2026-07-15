import { test, expect } from '@playwright/test';
import { bikePayload, getApiBaseUrl, loginAuth } from '../src/helpers/api';
import { getSeedCredentials, loadBackendEnv } from '../src/helpers/env';
import { buildUniqueVin } from '../src/helpers/vin';
import { markExpectedFailure } from '../src/helpers/known-bugs';

loadBackendEnv();

const API = getApiBaseUrl();
const currentYear = new Date().getFullYear();

/**
 * Волна H — API-контракт намеренных багов (см. docs/KNOWN-BUGS.md).
 */
test.describe('Known bugs API (wave H)', () => {
  const { admin } = getSeedCredentials();

  test.describe('BUG-03 — фактическое поведение (teaching facts)', () => {
    test('TC-API-BUG-03-FACT-1988: год 1988 → 201 (баг)', async ({ request }) => {
      const auth = await loginAuth(request, API, admin);
      const res = await request.post(`${API}/api/bikes`, {
        headers: auth,
        data: bikePayload({ vin: buildUniqueVin('8'), year: 1988, brand: 'AaaB3' }),
      });
      expect(res.status()).toBe(201);
      const body = await res.json();
      expect(body.year).toBe(1988);
    });

    test('TC-API-BUG-03-FACT-1989: год 1989 → 400', async ({ request }) => {
      const auth = await loginAuth(request, API, admin);
      const res = await request.post(`${API}/api/bikes`, {
        headers: auth,
        data: bikePayload({ vin: buildUniqueVin('9'), year: 1989 }),
      });
      expect(res.status()).toBe(400);
      const body = await res.json();
      expect(String(body.error)).toMatch(/раньше 1990/i);
    });

    test('TC-API-BUG-03-FACT-CUR+1: год current+1 → 400', async ({ request }) => {
      const auth = await loginAuth(request, API, admin);
      const res = await request.post(`${API}/api/bikes`, {
        headers: auth,
        data: bikePayload({ vin: buildUniqueVin('P'), year: currentYear + 1 }),
      });
      expect(res.status()).toBe(400);
      const body = await res.json();
      expect(String(body.error)).toContain(`Год не может быть позже ${currentYear}`);
    });

    test('TC-API-BUG-03-FACT-CUR+2: год current+2 → 201 (баг)', async ({ request }) => {
      const auth = await loginAuth(request, API, admin);
      const res = await request.post(`${API}/api/bikes`, {
        headers: auth,
        data: bikePayload({ vin: buildUniqueVin('Q'), year: currentYear + 2, brand: 'AaaB4' }),
      });
      expect(res.status()).toBe(201);
      const body = await res.json();
      expect(body.year).toBe(currentYear + 2);
    });
  });

  test.describe('BUG-03 — целевые требования (correct + fail in teaching)', () => {
    test('TC-API-BUG-03-TARGET-1988: год 1988 должен быть 400', async ({ request }) => {
      markExpectedFailure('BUG-03: 1988 ошибочно проходит валидацию на API');
      const auth = await loginAuth(request, API, admin);
      const res = await request.post(`${API}/api/bikes`, {
        headers: auth,
        data: bikePayload({ vin: buildUniqueVin('R'), year: 1988 }),
      });
      expect(res.status()).toBe(400);
    });

    test('TC-API-BUG-03-TARGET-CUR+2: год current+2 должен быть 400', async ({ request }) => {
      markExpectedFailure('BUG-03: current+2 ошибочно проходит валидацию на API');
      const auth = await loginAuth(request, API, admin);
      const res = await request.post(`${API}/api/bikes`, {
        headers: auth,
        data: bikePayload({ vin: buildUniqueVin('T'), year: currentYear + 2 }),
      });
      expect(res.status()).toBe(400);
    });
  });

  test.describe('BUG-02 — TEST/123', () => {
    test('TC-API-BUG-02-FACT: TEST/123 → 403 guest trap', async ({ request }) => {
      const auth = await loginAuth(request, API, admin);
      const res = await request.post(`${API}/api/bikes`, {
        headers: auth,
        data: bikePayload({
          vin: buildUniqueVin('G'),
          brand: 'TEST',
          model: '123',
        }),
      });
      expect(res.status()).toBe(403);
      const body = await res.json();
      expect(String(body.error)).toMatch(/guest/i);
    });

    test('TC-API-BUG-02-TARGET: TEST/123 должен быть 201', async ({ request }) => {
      markExpectedFailure('BUG-02: TEST/123 даёт ложную ошибку про guest на API');
      const auth = await loginAuth(request, API, admin);
      const res = await request.post(`${API}/api/bikes`, {
        headers: auth,
        data: bikePayload({
          vin: buildUniqueVin('H'),
          brand: 'TEST',
          model: '123',
        }),
      });
      expect(res.status()).toBe(201);
    });
  });
});
