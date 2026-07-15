import { test, expect } from '@playwright/test';
import { getSeedCredentials, loadBackendEnv } from '../src/helpers/env';
import { getApiBaseUrl } from '../src/helpers/api';

loadBackendEnv();

const API = getApiBaseUrl();
const RUN = process.env.RUN_RATE_LIMIT_E2E === '1' || process.env.RUN_RATE_LIMIT_E2E === 'true';

/**
 * Opt-in: backend должен быть запущен с ENABLE_LOGIN_RATE_LIMIT=true.
 * Обычный CI/webServer флаг не включает — иначе засорит лимит для остальных login-тестов.
 *
 * Локально:
 *   $env:ENABLE_LOGIN_RATE_LIMIT='true'; npm run dev   # в backend
 *   $env:RUN_RATE_LIMIT_E2E='1'; npx playwright test tests/auth-rate-limit-api.spec.ts
 */
test.describe('Auth login rate-limit (opt-in wave D)', () => {
  test.skip(!RUN, 'нужны RUN_RATE_LIMIT_E2E=1 и backend с ENABLE_LOGIN_RATE_LIMIT=true');

  const { admin } = getSeedCredentials();

  test('TC-AUTH-RATE-LIMIT-01: 11-я попытка login → 429', async ({ request }) => {
    let lastStatus = 0;
    let lastBody: { error?: string } = {};
    for (let i = 0; i < 11; i += 1) {
      const res = await request.post(`${API}/api/auth/login`, {
        data: { username: admin.username, password: 'wrong-password-for-rate-limit' },
      });
      lastStatus = res.status();
      lastBody = await res.json();
    }
    expect(lastStatus).toBe(429);
    expect(lastBody.error).toMatch(/Слишком много попыток/i);
  });
});
