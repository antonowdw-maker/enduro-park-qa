import { test, expect } from '@playwright/test';
import {
  bikePayload,
  csrfHeaders,
  fetchCsrf,
  getApiBaseUrl,
  loginAuth,
} from '../src/helpers/api';
import { getSeedCredentials, loadBackendEnv } from '../src/helpers/env';
import { buildUniqueVin } from '../src/helpers/vin';

loadBackendEnv();

const API = getApiBaseUrl();

/**
 * Волна G slice2 — CSRF double-submit + Zod на границе API.
 */
test.describe('Security CSRF + Zod API (wave G slice2)', () => {
  const { admin } = getSeedCredentials();

  test('TC-SEC-CSRF-01: GET /api/auth/csrf → cookie + csrfToken', async ({ request }) => {
    const res = await request.get(`${API}/api/auth/csrf`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof body.csrfToken).toBe('string');
    expect(body.csrfToken.length).toBeGreaterThan(16);
    const setCookie = res.headersArray().filter((h) => h.name.toLowerCase() === 'set-cookie');
    const csrf = setCookie.find((h) => h.value.toLowerCase().startsWith('csrf='));
    expect(csrf).toBeTruthy();
    expect(csrf!.value.toLowerCase()).not.toContain('httponly');
  });

  test('TC-SEC-CSRF-02: POST /bikes без CSRF → 403', async ({ request }) => {
    const auth = await loginAuth(request, API, admin);
    const res = await request.post(`${API}/api/bikes`, {
      headers: { Cookie: auth.Cookie },
      data: bikePayload({ vin: buildUniqueVin('C') }),
    });
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(String(body.error)).toMatch(/CSRF/i);
  });

  test('TC-SEC-CSRF-03: POST /bikes с неверным CSRF → 403', async ({ request }) => {
    const auth = await loginAuth(request, API, admin);
    const res = await request.post(`${API}/api/bikes`, {
      headers: {
        Cookie: auth.Cookie,
        'X-CSRF-Token': 'deadbeef'.repeat(8),
      },
      data: bikePayload({ vin: buildUniqueVin('W') }),
    });
    expect(res.status()).toBe(403);
  });

  test('TC-SEC-CSRF-04: logout без CSRF → 403', async ({ request }) => {
    const auth = await loginAuth(request, API, admin);
    const res = await request.post(`${API}/api/auth/logout`, {
      headers: { Cookie: auth.Cookie },
    });
    expect(res.status()).toBe(403);
  });

  test('TC-SEC-ZOD-01: POST login пустое тело → 400', async ({ request }) => {
    const res = await request.post(`${API}/api/auth/login`, { data: {} });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(typeof body.error).toBe('string');
  });

  test('TC-SEC-ZOD-02: POST /bikes notes > 500 → 400', async ({ request }) => {
    const auth = await loginAuth(request, API, admin);
    const res = await request.post(`${API}/api/bikes`, {
      headers: auth,
      data: bikePayload({
        vin: buildUniqueVin('L'),
        notes: 'n'.repeat(501),
      }),
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(String(body.error)).toMatch(/500|Заметки/i);
  });

  test('TC-SEC-ZOD-03: anon с CSRF, без token → 401 (не 403)', async ({ request }) => {
    const csrf = await fetchCsrf(request, API);
    const res = await request.post(`${API}/api/bikes`, {
      headers: csrfHeaders(csrf),
      data: bikePayload(),
    });
    expect(res.status()).toBe(401);
  });
});
