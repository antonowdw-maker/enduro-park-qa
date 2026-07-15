import type { Page, Response } from '@playwright/test';

export type WaitForBikesOptions = {
  /** false — ждать и ошибочные ответы (для UI list-error / wave E). По умолчанию только ok. */
  requireOk?: boolean;
};

function isBikesListGet(response: Response, requireOk: boolean): boolean {
  if (response.request().method() !== 'GET') return false;
  if (requireOk && !response.ok()) return false;
  try {
    const url = new URL(response.url());
    // Точный путь списка (не /api/bikes/:id)
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

/**
 * Дождаться GET /api/bikes после UI-действия (фильтр / сорт / пагинация).
 * Опционально — проверить query-параметры ответа (волна B / flake-hunt).
 */
export async function waitForBikesApi(
  page: Page,
  action: () => Promise<unknown>,
  expectedQuery?: Record<string, string | RegExp>,
  options?: WaitForBikesOptions,
): Promise<Response> {
  const requireOk = options?.requireOk !== false;
  const responsePromise = page.waitForResponse(
    (response) =>
      isBikesListGet(response, requireOk) && matchesQuery(response, expectedQuery),
  );
  await action();
  return responsePromise;
}
