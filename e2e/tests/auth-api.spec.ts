import { test, expect } from '@playwright/test';
import { getSeedCredentials, loadBackendEnv } from '../src/helpers/env';

loadBackendEnv();

const API =
  process.env.API_URL?.trim() ||
  (process.env.CI ? 'http://127.0.0.1:5000' : 'http://localhost:5000');

/**
 * Cookie / offset gaps (волна 10.6 + A: httpOnly на login).
 */
test.describe('Auth & pagination API', () => {
  const { admin } = getSeedCredentials();

  test('TC-AUTH-01 (API): login → Set-Cookie HttpOnly', async ({ request }) => {
    const res = await request.post(`${API}/api/auth/login`, {
      data: { username: admin.username, password: admin.password },
    });
    expect(res.status()).toBe(200);

    const setCookie = res.headersArray().filter((h) => h.name.toLowerCase() === 'set-cookie');
    const tokenHeader = setCookie.find((h) => /^token=/i.test(h.value));
    expect(tokenHeader, 'ожидался Set-Cookie: token=…').toBeTruthy();
    expect(tokenHeader!.value.toLowerCase()).toContain('httponly');
    expect(tokenHeader!.value.toLowerCase()).toMatch(/samesite=lax/);
  });

  test('TC-AUTH-08: GET /bikes без cookie → 200', async ({ request }) => {
    const res = await request.get(`${API}/api/bikes?limit=1`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.bikes)).toBeTruthy();
    expect(typeof body.total).toBe('number');
  });

  test('TC-AUTH-10: невалидный cookie на GET /bikes → 200 + Set-Cookie clear', async ({ request }) => {
    const res = await request.get(`${API}/api/bikes?limit=1`, {
      headers: { Cookie: 'token=invalid' },
    });
    expect(res.status()).toBe(200);
    const setCookie = res.headersArray().filter((h) => h.name.toLowerCase() === 'set-cookie');
    const cleared = setCookie.some(
      (h) =>
        /token=/i.test(h.value) &&
        (/Max-Age=0/i.test(h.value) || /Expires=/i.test(h.value) || /token=;/i.test(h.value)),
    );
    expect(cleared).toBeTruthy();
  });

  test('TC-AUTH-11: невалидный cookie на GET /auth/me → 401', async ({ request }) => {
    const res = await request.get(`${API}/api/auth/me`, {
      headers: { Cookie: 'token=invalid' },
    });
    expect(res.status()).toBe(401);
  });

  test('TC-API-OFFSET-01: limit+offset → вторая страница', async ({ request }) => {
    const page1 = await request.get(`${API}/api/bikes?limit=10&offset=0`);
    const page2 = await request.get(`${API}/api/bikes?limit=10&offset=10`);
    expect(page1.status()).toBe(200);
    expect(page2.status()).toBe(200);

    const b1 = await page1.json();
    const b2 = await page2.json();
    expect(b1.total).toBe(b2.total);
    expect(b1.bikes).toHaveLength(10);
    expect(b2.bikes).toHaveLength(10);

    const ids1 = new Set(b1.bikes.map((b: { id: string }) => b.id));
    for (const bike of b2.bikes) {
      expect(ids1.has(bike.id)).toBeFalsy();
    }
  });
});
