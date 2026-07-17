import type { Page, Response } from '@playwright/test';

export type WaitForBikesOptions = {
  /** false — ждать и ошибочные ответы (для UI list-error / wave E). По умолчанию только ok. */
  requireOk?: boolean;
  /** Переопределить таймаут ожидания GET /api/bikes (мс). */
  timeout?: number;
  /** Пауза после action (debounce search 300ms и т.п.). */
  postActionDelayMs?: number;
};

function isBikesListGet(response: Response, requireOk: boolean): boolean {
  if (response.request().method() !== 'GET') return false;
  if (requireOk && !response.ok()) return false;
  try {
    const url = new URL(response.url());
    return url.pathname === '/api/bikes' || url.pathname === '/bikes';
  } catch {
    return false;
  }
}

function matchesQuery(
  response: Response,
  expected?: Record<string, string | RegExp>,
): boolean {
  if (!expected) return true;
  const url = new URL(response.url());
  return Object.entries(expected).every(([key, want]) => {
    const actual = url.searchParams.get(key) ?? '';
    if (want instanceof RegExp) return want.test(actual);
    return actual === want;
  });
}

/** Firefox/WebKit в CI медленнее; nightly matrix задаёт PLAYWRIGHT_BROWSER. */
export function bikesApiWaitTimeout(): number {
  const browser = process.env.PLAYWRIGHT_BROWSER?.trim() || 'chromium';
  return browser === 'chromium' ? 15_000 : 25_000;
}

/**
 * Дождаться GET /api/bikes после UI-действия (фильтр / сорт / пагинация).
 * Promise.all — рекомендуемый паттерн Playwright (меньше гонок в firefox/webkit).
 */
export async function waitForBikesApi(
  page: Page,
  action: () => Promise<unknown>,
  expectedQuery?: Record<string, string | RegExp>,
  options?: WaitForBikesOptions,
): Promise<Response> {
  const requireOk = options?.requireOk !== false;
  const timeout = options?.timeout ?? bikesApiWaitTimeout();
  const postDelay = options?.postActionDelayMs ?? 0;

  const predicate = (response: Response) =>
    isBikesListGet(response, requireOk) && matchesQuery(response, expectedQuery);

  const runAction = async () => {
    await action();
    if (postDelay > 0) {
      await page.waitForTimeout(postDelay);
    }
  };

  const [response] = await Promise.all([
    page.waitForResponse(predicate, { timeout }),
    runAction(),
  ]);
  return response;
}
