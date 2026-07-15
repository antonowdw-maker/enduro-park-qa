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

function setCookiePairs(res: { headersArray: () => { name: string; value: string }[] }): string[] {
  return res
    .headersArray()
    .filter((h) => h.name.toLowerCase() === 'set-cookie')
    .map((h) => h.value.split(';')[0]);
}

function findCookiePair(pairs: string[], name: string): string | undefined {
  const prefix = `${name}=`;
  return pairs.find((p) => p.toLowerCase().startsWith(prefix.toLowerCase()));
}

export type ApiAuthHeaders = {
  Cookie: string;
  'X-CSRF-Token': string;
};

/** GET /api/auth/csrf → cookie + token */
export async function fetchCsrf(
  request: APIRequestContext,
  api: string,
): Promise<{ cookie: string; token: string }> {
  const res = await request.get(`${api}/api/auth/csrf`);
  expect(res.ok(), `csrf → ${res.status()}`).toBeTruthy();
  const body = await res.json();
  expect(typeof body.csrfToken).toBe('string');
  const csrfPair = findCookiePair(setCookiePairs(res), 'csrf');
  expect(csrfPair, 'Set-Cookie csrf').toBeTruthy();
  return { cookie: csrfPair!, token: body.csrfToken as string };
}

/** CSRF-заголовки без сессии (для anon-мутаций после CSRF) */
export function csrfHeaders(csrf: { cookie: string; token: string }): ApiAuthHeaders {
  return {
    Cookie: csrf.cookie,
    'X-CSRF-Token': csrf.token,
  };
}

/**
 * Login + CSRF: Cookie (token + csrf) и X-CSRF-Token для POST/PUT/DELETE.
 */
export async function loginAuth(
  request: APIRequestContext,
  api: string,
  user: { username: string; password: string },
): Promise<ApiAuthHeaders> {
  const csrf = await fetchCsrf(request, api);
  const res = await request.post(`${api}/api/auth/login`, {
    data: { username: user.username, password: user.password },
    headers: { Cookie: csrf.cookie },
  });
  expect(res.ok(), `login ${user.username} → ${res.status()}`).toBeTruthy();
  const tokenPair = findCookiePair(setCookiePairs(res), 'token');
  expect(tokenPair, 'Set-Cookie token').toBeTruthy();
  return {
    Cookie: `${tokenPair}; ${csrf.cookie}`,
    'X-CSRF-Token': csrf.token,
  };
}

/** @deprecated предпочтительно loginAuth — возвращает только Cookie (без CSRF header) */
export async function loginCookie(
  request: APIRequestContext,
  api: string,
  user: { username: string; password: string },
): Promise<string> {
  const auth = await loginAuth(request, api, user);
  return auth.Cookie;
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
