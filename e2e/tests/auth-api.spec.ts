import { test, expect } from '@playwright/test';
import { getSeedCredentials, loadBackendEnv } from '../src/helpers/env';
import { getApiBaseUrl } from '../src/helpers/api';

loadBackendEnv();

const API = getApiBaseUrl();

/**
 * Cookie / offset / session lifecycle (волна 10.6 + A + D).
 */
test.describe('Auth & pagination API', () => {
  const { admin } = getSeedCredentials();

  test('TC-AUTH-01 (API): login → Set-Cookie HttpOnly + SameSite + Max-Age', async ({ request }) => {
    const res = await request.post(`${API}/api/auth/login`, {
      data: { username: admin.username, password: admin.password },
    });
    expect(res.status()).toBe(200);

    const setCookie = res.headersArray().filter((h) => h.name.toLowerCase() === 'set-cookie');
    const tokenHeader = setCookie.find((h) => h.value.toLowerCase().startsWith('token='));
    expect(tokenHeader, 'ожидался Set-Cookie: token=…').toBeTruthy();
    const cookie = tokenHeader!.value.toLowerCase();
    expect(cookie).toContain('httponly');
    expect(cookie).toMatch(/samesite=lax/);
    expect(cookie).toMatch(/max-age=/);
  });

  test('TC-AUTH-API-LOGIN-NEG-01: неверный пароль → 401 { error }', async ({ request }) => {
    const res = await request.post(`${API}/api/auth/login`, {
      data: { username: admin.username, password: 'definitely-wrong-password' },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: 'Неверные учётные данные' });
  });

  test('TC-AUTH-API-LIFECYCLE-01: login → /me → logout → /me', async ({ request }) => {
    const login = await request.post(`${API}/api/auth/login`, {
      data: { username: admin.username, password: admin.password },
    });
    expect(login.status()).toBe(200);
    const user = await login.json();
    const setCookie = login.headersArray().find((h) => h.name.toLowerCase() === 'set-cookie')?.value;
    expect(setCookie).toBeTruthy();
    const cookie = setCookie!.split(';')[0];

    const me = await request.get(`${API}/api/auth/me`, { headers: { Cookie: cookie } });
    expect(me.status()).toBe(200);
    const meBody = await me.json();
    expect(meBody.username).toBe(user.username);
    expect(meBody.role).toBe(user.role);

    const logout = await request.post(`${API}/api/auth/logout`, { headers: { Cookie: cookie } });
    expect(logout.status()).toBe(200);
    expect(await logout.json()).toEqual({ message: 'Logged out' });
    const logoutCookies = logout.headersArray().filter((h) => h.name.toLowerCase() === 'set-cookie');
    const cleared = logoutCookies.some(
      (h) =>
        /token=/i.test(h.value) &&
        (/Max-Age=0/i.test(h.value) || /Expires=/i.test(h.value) || /token=;/i.test(h.value)),
    );
    expect(cleared, 'logout должен слать clear Set-Cookie для token').toBeTruthy();

    // Контракт: после logout клиент не шлёт cookie; /me без cookie → 401
    const meAnon = await request.get(`${API}/api/auth/me`);
    expect(meAnon.status()).toBe(401);
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
