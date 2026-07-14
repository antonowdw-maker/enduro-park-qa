import { test, expect } from '@playwright/test';
import { getSeedCredentials, loadBackendEnv } from '../src/helpers/env';
import { SEED_VINS } from '../src/data/seed-vins';

loadBackendEnv();

const API = process.env.API_URL?.trim() || 'http://localhost:5000';

/**
 * Роли на API (волна 10.3) — без UI, через request.
 */
test.describe('Roles API', () => {
  const { admin, mechanic } = getSeedCredentials();

  async function loginCookie(request: import('@playwright/test').APIRequestContext, user: { username: string; password: string }) {
    const res = await request.post(`${API}/api/auth/login`, {
      data: { username: user.username, password: user.password },
    });
    expect(res.ok()).toBeTruthy();
    const headers = res.headersArray();
    const setCookie = headers.find((h) => h.name.toLowerCase() === 'set-cookie')?.value;
    expect(setCookie).toBeTruthy();
    return setCookie!.split(';')[0];
  }

  async function findBikeId(request: import('@playwright/test').APIRequestContext, vin: string, cookie?: string) {
    const res = await request.get(`${API}/api/bikes?limit=50&search=`, {
      headers: cookie ? { Cookie: cookie } : undefined,
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const bike = body.bikes.find((b: { vin: string }) => b.vin === vin);
    expect(bike).toBeTruthy();
    return bike.id as string;
  }

  test('TC-ROLE-05: POST /bikes без cookie → 401', async ({ request }) => {
    const res = await request.post(`${API}/api/bikes`, {
      data: {
        brand: 'KTM',
        model: 'NoAuth',
        year: 2020,
        vin: 'NOAUTHVIN00000001',
        mileage: 0,
        status: 'available',
        lastService: '2020-01-01',
      },
    });
    expect(res.status()).toBe(401);
  });

  test('TC-ROLE-04: mechanic DELETE → 403', async ({ request }) => {
    const cookie = await loginCookie(request, mechanic);
    const id = await findBikeId(request, SEED_VINS.availableKtm, cookie);
    const res = await request.delete(`${API}/api/bikes/${id}`, {
      headers: { Cookie: cookie },
    });
    expect(res.status()).toBe(403);
  });

  test('TC-ROLE-06: admin DELETE → 204', async ({ request }) => {
    const cookie = await loginCookie(request, admin);

    // Создаём одноразовый байк через API, чтобы не трогать seed-якоря
    const vin = `API${Date.now().toString(36).toUpperCase()}XXXXX`.replace(/[IOQ]/g, 'X').slice(0, 17).padEnd(17, '1');
    const create = await request.post(`${API}/api/bikes`, {
      headers: { Cookie: cookie },
      data: {
        brand: 'KTM',
        model: 'ApiDel',
        year: 2020,
        vin,
        mileage: 0,
        status: 'available',
        lastService: '2020-01-01',
      },
    });
    expect(create.ok()).toBeTruthy();
    const created = await create.json();

    const res = await request.delete(`${API}/api/bikes/${created.id}`, {
      headers: { Cookie: cookie },
    });
    expect(res.status()).toBe(204);
  });
});
