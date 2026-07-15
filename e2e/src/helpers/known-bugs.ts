import { test } from '@playwright/test';

/**
 * Режим учебных багов (волна H).
 * teaching (default) — дефекты живут; «правильные» тесты с test.fail().
 * strict — без test.fail(); ожидается исправленный продукт (CI красный, пока баг жив).
 */
export type KnownBugsMode = 'teaching' | 'strict';

export function getKnownBugsMode(): KnownBugsMode {
  const raw = process.env.KNOWN_BUGS_MODE?.trim().toLowerCase();
  return raw === 'strict' ? 'strict' : 'teaching';
}

/** В teaching помечает тест как ожидаемо падающий, пока баг в продукте. */
export function markExpectedFailure(reason: string) {
  if (getKnownBugsMode() === 'teaching') {
    test.fail(true, reason);
  }
}
