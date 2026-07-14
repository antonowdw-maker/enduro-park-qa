import { defineConfig, devices } from '@playwright/test';
import { FRONTEND_DIR, BACKEND_DIR, getBaseUrl, loadBackendEnv } from './src/helpers/env';

// Пароли и PORT подтянем до старта webServer
loadBackendEnv();

/**
 * Конфиг Playwright (итерация 10.1)
 * — UI: Vite :5173 (прокси /api → backend)
 * — перед прогоном: globalSetup (db push + seed)
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  globalSetup: require.resolve('./global-setup.ts'),
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: getBaseUrl(),
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Локаторы по умолчанию устойчивее к анимациям
    actionTimeout: 15_000,
    // Для демо «по шагам»: SLOW_MO=800 npx playwright test --headed
    launchOptions: {
      slowMo: Number(process.env.SLOW_MO || 0) || 0,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Поднимаем API и UI, если ещё не запущены (reuseExistingServer локально)
  webServer: [
    {
      command: 'npm run dev',
      cwd: BACKEND_DIR,
      url: 'http://localhost:5000/api/bikes?limit=1',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'npm run dev',
      cwd: FRONTEND_DIR,
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
