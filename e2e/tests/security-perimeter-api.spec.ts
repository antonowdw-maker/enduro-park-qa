import { test, expect } from '@playwright/test';
import { getApiBaseUrl, loginAuth, bikePayload } from '../src/helpers/api';
import { getSeedCredentials, loadBackendEnv } from '../src/helpers/env';

loadBackendEnv();

const API = getApiBaseUrl();

/**
 * Волна G (slice 1) — периметр HTTP: health/ready, headers, body limit.
 */
test.describe('Security perimeter API (wave G)', () => {
  const { admin } = getSeedCredentials();

  test('TC-SEC-HEALTH-01: GET /health → 200 { status: ok }', async ({ request }) => {
    const res = await request.get(`${API}/health`);
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  test('TC-SEC-READY-01: GET /ready → 200 { status: ready }', async ({ request }) => {
    const res = await request.get(`${API}/ready`);
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ status: 'ready' });
  });

  test('TC-SEC-HEADERS-01: helmet задаёт X-Content-Type-Options', async ({ request }) => {
    const res = await request.get(`${API}/health`);
    expect(res.headers()['x-content-type-options']?.toLowerCase()).toBe('nosniff');
  });

  test('TC-SEC-BODY-01: JSON больше 100kb → 413', async ({ request }) => {
    const auth = await loginAuth(request, API, admin);
    const hugeNotes = 'x'.repeat(120 * 1024);
    const res = await request.post(`${API}/api/bikes`, {
      headers: auth,
      data: bikePayload({ notes: hugeNotes, brand: 'AaaHuge' }),
    });
    expect(res.status()).toBe(413);
    const body = await res.json();
    expect(body.error).toMatch(/слишком большое/i);
  });
});
