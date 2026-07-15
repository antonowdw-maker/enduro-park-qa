import { test, expect } from '@playwright/test';
import { getSeedCredentials, loadBackendEnv } from '../src/helpers/env';
import { SEED_VINS } from '../src/data/seed-vins';
import { csrfHeaders, fetchCsrf, getApiBaseUrl, loginAuth } from '../src/helpers/api';

loadBackendEnv();

const API = getApiBaseUrl();

/**
 * Роли на API (волна 10.3) — без UI, через request.
 * Волна G: мутации требуют CSRF (loginAuth).
 */
test.describe('Roles API', () => {
  const { admin, mechanic } = getSeedCredentials();

  async function findBikeId(
    request: import('@playwright/test').APIRequestContext,
    vin: string,
    headers?: Record<string, string>,
  ) {
    const res = await request.get(`${API}/api/bikes?limit=50&search=`, {
      headers,
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const bike = body.bikes.find((b: { vin: string }) => b.vin === vin);
    expect(bike).toBeTruthy();
    return bike.id as string;
  }

  test('TC-ROLE-05: POST /bikes без cookie → 401', async ({ request }) => {
    const csrf = await fetchCsrf(request, API);
    const res = await request.post(`${API}/api/bikes`, {
      headers: csrfHeaders(csrf),
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
    const auth = await loginAuth(request, API, mechanic);
    const id = await findBikeId(request, SEED_VINS.availableKtm, auth);
    const res = await request.delete(`${API}/api/bikes/${id}`, {
      headers: auth,
    });
    expect(res.status()).toBe(403);
  });

  test('TC-ROLE-06: admin DELETE → 204', async ({ request }) => {
    const auth = await loginAuth(request, API, admin);

    const vin = `API${Date.now().toString(36).toUpperCase()}XXXXX`.replace(/[IOQ]/g, 'X').slice(0, 17).padEnd(17, '1');
    const create = await request.post(`${API}/api/bikes`, {
      headers: auth,
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
      headers: auth,
    });
    expect(res.status()).toBe(204);
  });
});
