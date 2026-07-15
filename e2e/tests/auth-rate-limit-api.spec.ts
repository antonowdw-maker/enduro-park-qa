import { test, expect } from '@playwright/test';
import { getSeedCredentials, loadBackendEnv } from '../src/helpers/env';
import { getApiBaseUrl } from '../src/helpers/api';

loadBackendEnv();

const API = getApiBaseUrl();
const RUN = process.env.RUN_RATE_LIMIT_E2E === '1' || process.env.RUN_RATE_LIMIT_E2E === 'true';

/**
 * Opt-in + изолированный прогон (иначе IP-бакет 15 мин пересекается с другими login-тестами).
 *
 *   # только этот файл, backend с ENABLE_LOGIN_RATE_LIMIT=true
 *   $env:ENABLE_LOGIN_RATE_LIMIT='true'; npm run dev   # backend
 *   $env:RUN_RATE_LIMIT_E2E='1'; npx playwright test tests/auth-rate-limit-api.spec.ts
 */
test.describe('Auth login rate-limit (opt-in wave D)', () => {
  test.skip(!RUN, 'нужны RUN_RATE_LIMIT_E2E=1 и backend с ENABLE_LOGIN_RATE_LIMIT=true (изолированный прогон)');

  const { admin } = getSeedCredentials();

  test('TC-AUTH-RATE-LIMIT-01: 1…10 → 401, 11-я → 429', async ({ request }) => {
    for (let i = 1; i <= 10; i += 1) {
      const res = await request.post(`${API}/api/auth/login`, {
        data: { username: admin.username, password: 'wrong-password-for-rate-limit' },
      });
      expect(res.status(), `попытка ${i}`).toBe(401);
    }

    const limited = await request.post(`${API}/api/auth/login`, {
      data: { username: admin.username, password: 'wrong-password-for-rate-limit' },
    });
    expect(limited.status()).toBe(429);
    const body = await limited.json();
    expect(body.error).toMatch(/Слишком много попыток/i);
  });
});
