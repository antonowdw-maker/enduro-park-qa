import type { APIRequestContext } from '@playwright/test';
import { expect } from '@playwright/test';
import { buildUniqueVin } from './vin';

/** Base URL backend для request-тестов */
export function getApiBaseUrl(): string {
  return (
    process.env.API_URL?.trim() ||
    (process.env.CI ? 'http://127.0.0.1:5000' : 'http://localhost:5000')
  );
}

/** Cookie `token=…` после успешного login */
export async function loginCookie(
  request: APIRequestContext,
  api: string,
  user: { username: string; password: string },
): Promise<string> {
  const res = await request.post(`${api}/api/auth/login`, {
    data: { username: user.username, password: user.password },
  });
  expect(res.ok(), `login ${user.username} → ${res.status()}`).toBeTruthy();
  const setCookie = res.headersArray().find((h) => h.name.toLowerCase() === 'set-cookie')?.value;
  expect(setCookie, 'Set-Cookie token').toBeTruthy();
  return setCookie!.split(';')[0];
}

/** Минимально валидное тело create/update (уникальный VIN по умолчанию) */
export function bikePayload(overrides: Record<string, unknown> = {}) {
  return {
    brand: 'KTM',
    model: 'ApiWaveD',
    year: 2020,
    vin: buildUniqueVin('D'),
    mileage: 100,
    status: 'available',
    lastService: '2020-01-01',
    notes: null,
    ...overrides,
  };
}
