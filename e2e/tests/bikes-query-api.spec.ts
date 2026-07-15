import { test, expect } from '@playwright/test';
import { loadBackendEnv } from '../src/helpers/env';
import { SEED_BIKE_COUNT, SEED_STATUS_COUNTS } from '../src/data/seed-vins';
import { resetDatabaseSeed } from '../src/helpers/seed';

loadBackendEnv();

const API =
  process.env.API_URL?.trim() ||
  (process.env.CI ? 'http://127.0.0.1:5000' : 'http://localhost:5000');

type BikeListBody = {
  total: number;
  limit: number;
  offset: number;
  page: number;
  sortBy: string;
  order: string;
  bikes: Array<{
    id: string;
    brand: string;
    model: string;
    status: string;
    year: number;
    vin: string;
  }>;
};

/**
 * Волна C — API-контракт GET /api/bikes: пагинация / sort / status / длина / LIKE.
 * Невалидные query **не** дают 4xx — coerce / drop / truncate → 200.
 */
test.describe('API GET /bikes query contract (TTD)', () => {
  test.beforeAll(() => {
    resetDatabaseSeed();
  });

  // --- limit / offset / page ---

  test('TC-API-LIMIT-01: limit=abc → default 10', async ({ request }) => {
    const res = await request.get(`${API}/api/bikes?limit=abc`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as BikeListBody;
    expect(body.limit).toBe(10);
    expect(body.bikes).toHaveLength(10);
  });

  test('TC-API-LIMIT-02: limit=0 → default 10', async ({ request }) => {
    const res = await request.get(`${API}/api/bikes?limit=0`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as BikeListBody;
    expect(body.limit).toBe(10);
  });

  test('TC-API-LIMIT-03: limit=-5 → clamp к 1', async ({ request }) => {
    const res = await request.get(`${API}/api/bikes?limit=-5`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as BikeListBody;
    expect(body.limit).toBe(1);
    expect(body.bikes).toHaveLength(1);
  });

  test('TC-API-LIMIT-04: limit=100 → clamp к 50', async ({ request }) => {
    const res = await request.get(`${API}/api/bikes?limit=100`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as BikeListBody;
    expect(body.limit).toBe(50);
    expect(body.bikes).toHaveLength(50);
  });

  test('TC-API-LIMIT-05: limit=1.5 (дробное) → default 10', async ({ request }) => {
    const res = await request.get(`${API}/api/bikes?limit=1.5`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as BikeListBody;
    expect(body.limit).toBe(10);
  });

  test('TC-API-OFFSET-05: offset=1.5 → 0 (не 500)', async ({ request }) => {
    const res = await request.get(`${API}/api/bikes?limit=10&offset=1.5`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as BikeListBody;
    expect(body.offset).toBe(0);
  });

  test('TC-API-OFFSET-02: offset=-10 → 0', async ({ request }) => {
    const res = await request.get(`${API}/api/bikes?limit=10&offset=-10`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as BikeListBody;
    expect(body.offset).toBe(0);
    expect(body.page).toBe(1);
  });

  test('TC-API-OFFSET-03: offset=xyz → 0', async ({ request }) => {
    const res = await request.get(`${API}/api/bikes?limit=10&offset=xyz`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as BikeListBody;
    expect(body.offset).toBe(0);
  });

  test('TC-API-PAGE-01: page=0 → page 1 (offset 0)', async ({ request }) => {
    const res = await request.get(`${API}/api/bikes?limit=10&page=0`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as BikeListBody;
    expect(body.page).toBe(1);
    expect(body.offset).toBe(0);
  });

  test('TC-API-PAGE-02: page=abc → page 1', async ({ request }) => {
    const res = await request.get(`${API}/api/bikes?limit=10&page=abc`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as BikeListBody;
    expect(body.page).toBe(1);
    expect(body.offset).toBe(0);
  });

  test('TC-API-PAGE-03: page=2&limit=10 → offset 10', async ({ request }) => {
    const res = await request.get(`${API}/api/bikes?limit=10&page=2`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as BikeListBody;
    expect(body.page).toBe(2);
    expect(body.offset).toBe(10);
    expect(body.bikes).toHaveLength(10);
  });

  test('TC-API-OFFSET-04: offset имеет приоритет над page', async ({ request }) => {
    const res = await request.get(`${API}/api/bikes?limit=10&offset=10&page=1`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as BikeListBody;
    expect(body.offset).toBe(10);
    expect(body.page).toBe(2);
  });

  // --- sortBy / order ---

  test('TC-API-SORT-NEG-01: sortBy=hack → fallback brand', async ({ request }) => {
    const res = await request.get(`${API}/api/bikes?limit=5&sortBy=hack`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as BikeListBody;
    expect(body.sortBy).toBe('brand');
    expect(body.order).toBe('asc');
  });

  test('TC-API-SORT-NEG-02: order=up → fallback asc', async ({ request }) => {
    const res = await request.get(`${API}/api/bikes?limit=5&sortBy=year&order=up`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as BikeListBody;
    expect(body.sortBy).toBe('year');
    expect(body.order).toBe('asc');
  });

  test('TC-API-SORT-01: order=desc применяется к данным year', async ({ request }) => {
    const res = await request.get(`${API}/api/bikes?limit=5&sortBy=year&order=desc`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as BikeListBody;
    expect(body.sortBy).toBe('year');
    expect(body.order).toBe('desc');
    const years = body.bikes.map((b) => b.year);
    const sorted = [...years].sort((a, b) => b - a);
    expect(years).toEqual(sorted);
  });

  // --- status ---

  test('TC-API-STATUS-NEG-01: status=bogus — фильтр не применяется', async ({ request }) => {
    const res = await request.get(`${API}/api/bikes?limit=50&status=bogus`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as BikeListBody;
    expect(body.total).toBe(SEED_BIKE_COUNT);
  });

  test('TC-API-STATUS-NEG-02: status=AVAILABLE (регистр) — отбрасывается', async ({ request }) => {
    const res = await request.get(`${API}/api/bikes?limit=50&status=AVAILABLE`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as BikeListBody;
    expect(body.total).toBe(SEED_BIKE_COUNT);
  });

  test('TC-API-STATUS-01: status=available,bogus — только available (19)', async ({ request }) => {
    const res = await request.get(`${API}/api/bikes?limit=50&status=available,bogus`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as BikeListBody;
    expect(body.total).toBe(SEED_STATUS_COUNTS.available);
    expect(body.bikes.every((b) => b.status === 'available')).toBeTruthy();
  });

  // --- brand/model длина (API 64) и пробелы ---

  test('TC-API-BRAND-LEN-01: 64 и 65 символов — одинаковый truncate (total 0)', async ({
    request,
  }) => {
    const sixtyFour = 'K'.repeat(64);
    const sixtyFive = 'K'.repeat(65);
    const r64 = await request.get(`${API}/api/bikes?limit=50&brand=${sixtyFour}`);
    const r65 = await request.get(`${API}/api/bikes?limit=50&brand=${sixtyFive}`);
    expect(r64.status()).toBe(200);
    expect(r65.status()).toBe(200);
    const b64 = (await r64.json()) as BikeListBody;
    const b65 = (await r65.json()) as BikeListBody;
    expect(b64.total).toBe(0);
    expect(b65.total).toBe(b64.total);
  });

  test('TC-API-BRAND-LEN-02: API принимает brand длиной 40 (UI max), фильтр работает', async ({
    request,
  }) => {
    // 40 символов «KTM…» не совпадёт с seed-маркой — total 0; важно: 200, не 400
    const forty = `KTM${'x'.repeat(37)}`;
    expect(forty).toHaveLength(40);
    const res = await request.get(`${API}/api/bikes?limit=50&brand=${forty}`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as BikeListBody;
    expect(body.total).toBe(0);
  });

  test('TC-API-MODEL-WS-01: model только пробелы — фильтр не применяется', async ({ request }) => {
    const res = await request.get(`${API}/api/bikes?limit=50&model=${encodeURIComponent('   ')}`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as BikeListBody;
    expect(body.total).toBe(SEED_BIKE_COUNT);
  });

  // --- LIKE метасимволы (факт стенда, без ESCAPE) ---

  test('TC-API-LIKE-01: brand=% — wildcard, совпадает со всеми', async ({ request }) => {
    const res = await request.get(`${API}/api/bikes?limit=50&brand=${encodeURIComponent('%')}`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as BikeListBody;
    expect(body.total).toBe(SEED_BIKE_COUNT);
  });

  test('TC-API-LIKE-02: brand=_ — wildcard одного символа, все марки ≥1 символ', async ({
    request,
  }) => {
    const res = await request.get(`${API}/api/bikes?limit=50&brand=${encodeURIComponent('_')}`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as BikeListBody;
    expect(body.total).toBe(SEED_BIKE_COUNT);
  });

  test('TC-API-LIKE-03: brand=%% — тоже полный список (метасимволы)', async ({ request }) => {
    const res = await request.get(`${API}/api/bikes?limit=50&brand=${encodeURIComponent('%%')}`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as BikeListBody;
    expect(body.total).toBe(SEED_BIKE_COUNT);
  });

  // --- search (волна E, API уже был) ---

  test('TC-API-SEARCH-01: search=KTM — brand OR model', async ({ request }) => {
    const res = await request.get(`${API}/api/bikes?limit=50&search=KTM`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as BikeListBody;
    expect(body.total).toBeGreaterThan(0);
    expect(
      body.bikes.every((b) => /ktm/i.test(b.brand) || /ktm/i.test(b.model)),
    ).toBeTruthy();
  });

  test('TC-API-SEARCH-02: search=EXC — по модели', async ({ request }) => {
    const res = await request.get(`${API}/api/bikes?limit=50&search=EXC`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as BikeListBody;
    expect(body.bikes.some((b) => b.vin === 'KTM2020QA00000001' || /exc/i.test(b.model))).toBeTruthy();
  });

  test('TC-API-SEARCH-NEG-01: нет совпадений → total 0', async ({ request }) => {
    const res = await request.get(`${API}/api/bikes?limit=50&search=NoSuchBikeZZZ`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as BikeListBody;
    expect(body.total).toBe(0);
  });

  test('TC-API-SEARCH-WS-01: search пробелы — без фильтра', async ({ request }) => {
    const res = await request.get(`${API}/api/bikes?limit=50&search=${encodeURIComponent('   ')}`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as BikeListBody;
    expect(body.total).toBe(SEED_BIKE_COUNT);
  });
});
