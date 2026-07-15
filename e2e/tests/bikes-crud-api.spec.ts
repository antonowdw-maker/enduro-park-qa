import { test, expect } from '@playwright/test';
import { getSeedCredentials, loadBackendEnv } from '../src/helpers/env';
import { bikePayload, getApiBaseUrl, loginCookie } from '../src/helpers/api';
import { buildUniqueVin } from '../src/helpers/vin';
import { resetDatabaseSeed } from '../src/helpers/seed';

loadBackendEnv();

const API = getApiBaseUrl();
const UNKNOWN_ID = '00000000-0000-4000-8000-000000000099';

/**
 * Волна D — CRUD API (не UI): роли, VIN, невалидное тело, mass-assignment.
 */
test.describe('API bikes CRUD (wave D)', () => {
  const { admin, mechanic } = getSeedCredentials();

  test.beforeAll(() => {
    resetDatabaseSeed();
  });

  test('TC-API-BIKE-POST-ADMIN-01: admin создаёт байк → 201', async ({ request }) => {
    const cookie = await loginCookie(request, API, admin);
    const data = bikePayload({ vin: buildUniqueVin('A') });
    const res = await request.post(`${API}/api/bikes`, {
      headers: { Cookie: cookie },
      data,
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.vin).toBe(String(data.vin).toUpperCase());
    expect(body.brand).toBe('KTM');
    expect(body.id).toBeTruthy();
  });

  test('TC-API-BIKE-POST-MECHANIC-01: mechanic создаёт байк → 201', async ({ request }) => {
    const cookie = await loginCookie(request, API, mechanic);
    const data = bikePayload({ vin: buildUniqueVin('M'), model: 'MechCreate' });
    const res = await request.post(`${API}/api/bikes`, {
      headers: { Cookie: cookie },
      data,
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.model).toBe('MechCreate');
  });

  test('TC-API-BIKE-POST-ANON-01: без cookie → 401 + { error }', async ({ request }) => {
    const res = await request.post(`${API}/api/bikes`, { data: bikePayload() });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: 'Доступ запрещен: авторизуйтесь' });
  });

  test('TC-API-BIKE-PUT-ADMIN-01: admin обновляет notes → 200', async ({ request }) => {
    const cookie = await loginCookie(request, API, admin);
    const create = await request.post(`${API}/api/bikes`, {
      headers: { Cookie: cookie },
      data: bikePayload({ vin: buildUniqueVin('U') }),
    });
    const created = await create.json();
    const payload = bikePayload({
      vin: created.vin,
      notes: 'wave-d-admin-put',
    });
    const res = await request.put(`${API}/api/bikes/${created.id}`, {
      headers: { Cookie: cookie },
      data: payload,
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.notes).toBe('wave-d-admin-put');
  });

  test('TC-API-BIKE-PUT-MECHANIC-01: mechanic обновляет → 200', async ({ request }) => {
    const cookie = await loginCookie(request, API, mechanic);
    const create = await request.post(`${API}/api/bikes`, {
      headers: { Cookie: cookie },
      data: bikePayload({ vin: buildUniqueVin('P') }),
    });
    const created = await create.json();
    const res = await request.put(`${API}/api/bikes/${created.id}`, {
      headers: { Cookie: cookie },
      data: bikePayload({ vin: created.vin, mileage: 999 }),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.mileage).toBe(999);
  });

  test('TC-API-BIKE-PUT-ANON-01: PUT без cookie → 401', async ({ request }) => {
    const res = await request.put(`${API}/api/bikes/${UNKNOWN_ID}`, {
      data: bikePayload(),
    });
    expect(res.status()).toBe(401);
  });

  test('TC-API-BIKE-PUT-UNKNOWN-01: admin PUT неизвестный id → 404', async ({ request }) => {
    const cookie = await loginCookie(request, API, admin);
    const res = await request.put(`${API}/api/bikes/${UNKNOWN_ID}`, {
      headers: { Cookie: cookie },
      data: bikePayload({ vin: buildUniqueVin('X') }),
    });
    expect(res.status()).toBe(404);
    expect(await res.json()).toEqual({ error: 'Bike not found' });
  });

  test('TC-API-BIKE-DELETE-UNKNOWN-01: admin DELETE неизвестный id → 404', async ({ request }) => {
    const cookie = await loginCookie(request, API, admin);
    const res = await request.delete(`${API}/api/bikes/${UNKNOWN_ID}`, {
      headers: { Cookie: cookie },
    });
    expect(res.status()).toBe(404);
    expect(await res.json()).toEqual({ error: 'Bike not found' });
  });

  test('TC-API-BIKE-DUP-VIN-POST-01: повторный POST с тем же VIN → 400', async ({ request }) => {
    const cookie = await loginCookie(request, API, admin);
    const vin = buildUniqueVin('V');
    const first = await request.post(`${API}/api/bikes`, {
      headers: { Cookie: cookie },
      data: bikePayload({ vin }),
    });
    expect(first.status()).toBe(201);

    const second = await request.post(`${API}/api/bikes`, {
      headers: { Cookie: cookie },
      data: bikePayload({ vin, model: 'Dup' }),
    });
    expect(second.status()).toBe(400);
    const body = await second.json();
    expect(String(body.error)).toMatch(/VIN уже существует/i);
  });

  test('TC-API-BIKE-DUP-VIN-PUT-01: PUT с чужим VIN → 400', async ({ request }) => {
    const cookie = await loginCookie(request, API, admin);
    const vinA = buildUniqueVin('1');
    const vinB = buildUniqueVin('2');
    const a = await (
      await request.post(`${API}/api/bikes`, {
        headers: { Cookie: cookie },
        data: bikePayload({ vin: vinA }),
      })
    ).json();
    const b = await (
      await request.post(`${API}/api/bikes`, {
        headers: { Cookie: cookie },
        data: bikePayload({ vin: vinB }),
      })
    ).json();

    const res = await request.put(`${API}/api/bikes/${b.id}`, {
      headers: { Cookie: cookie },
      data: bikePayload({ vin: a.vin }),
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(String(body.error)).toMatch(/VIN уже существует/i);
  });

  test('TC-API-BIKE-INVALID-01: невалидный VIN → 400 { error }', async ({ request }) => {
    const cookie = await loginCookie(request, API, admin);
    const res = await request.post(`${API}/api/bikes`, {
      headers: { Cookie: cookie },
      data: bikePayload({ vin: 'SHORT' }),
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(typeof body.error).toBe('string');
    expect(body.error.length).toBeGreaterThan(0);
  });

  test('TC-API-BIKE-INVALID-02: отрицательный mileage → 400', async ({ request }) => {
    const cookie = await loginCookie(request, API, admin);
    const res = await request.post(`${API}/api/bikes`, {
      headers: { Cookie: cookie },
      data: bikePayload({ vin: buildUniqueVin('N'), mileage: -1 }),
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(String(body.error)).toMatch(/Пробег/i);
  });

  test('TC-API-BIKE-MASS-01: лишние поля в теле игнорируются', async ({ request }) => {
    const cookie = await loginCookie(request, API, admin);
    const forgedId = '11111111-1111-4111-8111-111111111111';
    const res = await request.post(`${API}/api/bikes`, {
      headers: { Cookie: cookie },
      data: {
        ...bikePayload({ vin: buildUniqueVin('Z') }),
        id: forgedId,
        createdAt: '2000-01-01T00:00:00.000Z',
        role: 'admin',
        unexpected: 'drop-me',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.id).not.toBe(forgedId);
    expect(body).not.toHaveProperty('role');
    expect(body).not.toHaveProperty('unexpected');
    expect(String(body.createdAt)).not.toMatch(/^2000-01-01/);
  });
});
