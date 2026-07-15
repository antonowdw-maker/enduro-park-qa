import type { Page, Response } from '@playwright/test';

function isBikesListGet(response: Response): boolean {
  if (response.request().method() !== 'GET') return false;
  if (!response.ok()) return false;
  try {
    const url = new URL(response.url());
    return url.pathname.includes('/api/bikes');
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
): Promise<Response> {
  const responsePromise = page.waitForResponse(
    (response) => isBikesListGet(response) && matchesQuery(response, expectedQuery),
  );
  await action();
  return responsePromise;
}
