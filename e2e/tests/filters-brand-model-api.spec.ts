import { test, expect } from '@playwright/test';
import { loadBackendEnv } from '../src/helpers/env';
import { SEED_BIKE_COUNT, SEED_VINS } from '../src/data/seed-vins';
import { resetDatabaseSeed } from '../src/helpers/seed';

loadBackendEnv();

const API =
  process.env.API_URL?.trim() ||
  (process.env.CI ? 'http://127.0.0.1:5000' : 'http://localhost:5000');

type BikeListBody = {
  total: number;
  bikes: Array<{ vin: string; brand: string; model: string }>;
};

/**
 * API GET /bikes?brand=&model= — ТТД на уровне контракта
 * (эквивалентные классы, AND-комбинации, пустые/пробелы).
 */
test.describe('API filters brand/model (TTD)', () => {
  test.beforeAll(() => {
    resetDatabaseSeed();
  });

  test('TC-API-BRAND-01: brand=KTM — только KTM, якорь на месте', async ({ request }) => {
    const res = await request.get(`${API}/api/bikes?limit=50&brand=KTM`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as BikeListBody;
    expect(body.total).toBeGreaterThan(0);
    expect(body.bikes.every((b) => /ktm/i.test(b.brand))).toBeTruthy();
    expect(body.bikes.some((b) => b.vin === SEED_VINS.availableKtm)).toBeTruthy();
    expect(body.bikes.some((b) => b.vin === SEED_VINS.repairHonda)).toBeFalsy();
  });

  test('TC-API-MODEL-01: model=EXC — подстрока модели', async ({ request }) => {
    const res = await request.get(`${API}/api/bikes?limit=50&model=EXC`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as BikeListBody;
    expect(body.total).toBeGreaterThan(0);
    expect(body.bikes.every((b) => /exc/i.test(b.model))).toBeTruthy();
    expect(body.bikes.some((b) => b.vin === SEED_VINS.availableKtm)).toBeTruthy();
  });

  test('TC-API-BRAND-MODEL-01: brand+model AND (Honda + CRF)', async ({ request }) => {
    const res = await request.get(`${API}/api/bikes?limit=50&brand=Honda&model=CRF`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as BikeListBody;
    expect(body.total).toBeGreaterThan(0);
    expect(body.bikes.every((b) => /honda/i.test(b.brand) && /crf/i.test(b.model))).toBeTruthy();
    expect(body.bikes.some((b) => b.vin === SEED_VINS.repairHonda)).toBeTruthy();
  });

  test('TC-API-BRAND-MODEL-NEG-01: конфликт brand+model → total 0', async ({ request }) => {
    const res = await request.get(`${API}/api/bikes?limit=50&brand=KTM&model=CRF`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as BikeListBody;
    expect(body.total).toBe(0);
    expect(body.bikes).toHaveLength(0);
  });

  test('TC-API-BRAND-NEG-01: несуществующая марка → total 0', async ({ request }) => {
    const res = await request.get(`${API}/api/bikes?limit=50&brand=NoSuchBrandXYZ`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as BikeListBody;
    expect(body.total).toBe(0);
  });

  test('TC-API-BRAND-NEG-02: brand только пробелы — фильтр не применяется', async ({ request }) => {
    const res = await request.get(`${API}/api/bikes?limit=50&brand=${encodeURIComponent('   ')}`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as BikeListBody;
    expect(body.total).toBe(SEED_BIKE_COUNT);
  });

  test('TC-API-BRAND-DT-01: brand + status=available', async ({ request }) => {
    const res = await request.get(`${API}/api/bikes?limit=50&brand=KTM&status=available`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as BikeListBody;
    expect(body.total).toBeGreaterThan(0);
    expect(body.bikes.every((b) => /ktm/i.test(b.brand))).toBeTruthy();
    expect(body.bikes.some((b) => b.vin === SEED_VINS.availableKtm)).toBeTruthy();
  });

  test('TC-API-BRAND-04: регистр brand (EP) — ktm', async ({ request }) => {
    const res = await request.get(`${API}/api/bikes?limit=50&brand=ktm`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as BikeListBody;
    expect(body.bikes.some((b) => b.vin === SEED_VINS.availableKtm)).toBeTruthy();
  });
});
