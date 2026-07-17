# E2E — Enduro Park Manager (Playwright + TypeScript)

Автотесты в отдельном пакете `e2e/` (итерация 10).

## Требования

1. Заполнен `backend/.env` (пароли seed) — см. корневой README / `docs/SECURITY.md`
2. Установлены зависимости backend и frontend
3. В этой папке: `npm install` и `npm run install:browsers`

## Команды

```bash
cd e2e
npm install
npm run install:browsers
npm test              # весь набор
npm run test:smoke    # только auth.spec
npm run test:headed   # с окном браузера
npm run test:ui       # Playwright UI mode

# Опционально (волна H): строгий режим known-bugs — без test.fail, suite красный пока баги живут
# $env:KNOWN_BUGS_MODE='strict'; npx playwright test tests/known-bugs.spec.ts tests/known-bugs-api.spec.ts
```

Перед прогоном `globalSetup` делает `prisma db push` + `npm run seed` в `backend/`.
`webServer` поднимает backend (:5000) и frontend (:5173), если они ещё не запущены.

## CI (GitHub Actions) — гейт + nightly (волна I)

Воркфлоу: `.github/workflows/e2e.yml` (гейт), `.github/workflows/e2e-nightly.yml` (cron)

| Когда | Что |
|-------|-----|
| `push` / `PR` → `main` или `feature/**` | **1)** job `quality`: typecheck backend/frontend/e2e + frontend lint → **2)** Playwright Chromium |
| Paths | `backend/**`, `frontend/**`, `e2e/**`, `docs/**`, workflows |
| `schedule` daily 03:00 UTC | Nightly: chromium + firefox + webkit (без дубля quality) |
| `workflow_dispatch` | Ручной nightly |

Локально:

```bash
cd backend && npx prisma generate && npm run typecheck
cd frontend && npm run typecheck && npm run lint
cd e2e && npm run typecheck
```

Локально по умолчанию только Chromium. Другой браузер:  
`$env:PLAYWRIGHT_BROWSER='firefox'; npx playwright test` (нужен `npx playwright install firefox`).

CI сам пишет эфемерный `backend/.env` (случайные JWT/пароли), поднимает API+UI через `webServer`, `globalSetup` делает seed.

**Заметка:** GitHub cron — на **default branch** (`main`).

## Артефакты Playwright (единообразие)

| Что | Локально / CI |
|-----|----------------|
| HTML report | `e2e/playwright-report/` (`npm run report`) |
| Trace | `trace: on-first-retry` (CI retries=1) |
| Screenshot / video | только при failure |
| CI upload | **только при failure**: `playwright-report-chromium` (гейт) / `playwright-report-nightly-{browser}` (nightly); retention 7 дней; пути `playwright-report/` + `test-results/` |

Матрица F↔TC↔spec: [`docs/COVERAGE-MATRIX.md`](../docs/COVERAGE-MATRIX.md).

## Изоляция данных и flake-hunt (волна B)

- `workers: 1`, `fullyParallel: false` — общая SQLite; **не** параллелить тесты на одной БД.
- Suites со счётчиками / якорями (`filters`, `seed`, `sort-pagination`, brand/model…) делают `resetDatabaseSeed()` в `beforeAll` (после CRUD «грязи»).
- CRUD/validation **могут** менять БД; если гоняете выборочно — сначала seed или полный `npm test` (есть `globalSetup`).
- После фильтра / сортировки / пагинации ждём `GET /api/bikes` через `MainPage.runAndWaitForBikes` / `helpers/bikes-api.ts` — не ассертим DOM по старому ответу.
- `waitForBikesApi`: **Promise.all** (response + action); таймаут 15s chromium / 25s firefox|webkit (`PLAYWRIGHT_BROWSER`).
- **Clear / toggle-off / prev / search-clear:** надёжнее `MainPage.tap()` + UI-assert (`expect row`, `pageIndicator`) — в firefox/webkit ответ иногда не ловится `waitForResponse`.
- `MainPage.tap()`: `scrollIntoView` + `force` на firefox/webkit и для кнопок «×» (`clear: true`).
- `setLimit50()`: на firefox/webkit — `selectOption` + poll строк; на chromium — `runAndWaitForBikes` с `limit=50`.
- Опционально: `expect.soft` для нескольких независимых проверок в одном тесте.
- **Ревью:** после кода волны — блоки тимлида fullstack + QA automation (см. `.cursor/rules/roles-and-reviews.mdc`).

## Практики

- Локаторы: `data-testid` через Page Object (`src/pages/`)
- Пароли: только из `backend/.env`, не в git
- Якорные VIN: `src/data/seed-vins.ts`
- Имена тестов = ID ручных ТК (`TC-AUTH-01`); после волны — пометка в `docs/MANUAL-TEST-CASES-v1.2.md`
- Фильтр марка/модель: smoke в `filters.spec.ts`; ТТД UI/API — `filters-brand-model.spec.ts`, `filters-brand-model-api.spec.ts`
- API query-контракт (волна C): `bikes-query-api.spec.ts` — limit/offset/page/sort/status/LEN/LIKE (нормализация, не 4xx)
- CRUD/Auth API (волна D): `bikes-crud-api.spec.ts`, lifecycle в `auth-api.spec.ts`; rate-limit opt-in: `RUN_RATE_LIMIT_E2E=1` + backend `ENABLE_LOGIN_RATE_LIMIT=true` → `auth-rate-limit-api.spec.ts`
- Search UI (волна E): `search.spec.ts` — debounce/clear/empty/`list-error`+retry; API `TC-API-SEARCH-*` в `bikes-query-api.spec.ts`
- A11y / mobile (волна F): `a11y-mobile.spec.ts` — Escape/Tab/Enter, `aria-sort`, cards, mobile-sort, modal `100dvh`, шапка, «Ещё» (`filter-advanced-toggle`); filters PO: `expandAdvancedFilters()` перед brand/year
- Security (волна G): perimeter `security-perimeter-api.spec.ts` + XSS `security-xss.spec.ts`; CSRF/Zod API `security-csrf-zod-api.spec.ts`; UI CSRF `security-csrf-ui.spec.ts` (logout/create + header); rate-limit default on, CI `DISABLE_LOGIN_RATE_LIMIT=true`; isolated `RUN_RATE_LIMIT_E2E=1`
- Known bugs (волна H): каталог `docs/KNOWN-BUGS.md`; UI `known-bugs.spec.ts` + `markExpectedFailure`; API `known-bugs-api.spec.ts` (BUG-03 матрица + BUG-02). Режим: `KNOWN_BUGS_MODE=teaching` (default) | `strict`
- Coverage + quality (волна I): `docs/COVERAGE-MATRIX.md`; CI job `quality` (typecheck ×3 + frontend lint) перед Playwright
- Seed-якоря modern: `SEED_VINS.availableKayo` / `repairRegulmoto` / `soldMotoland` (`seed.spec.ts` TC-SEED-05…07)
- Демо с замедлением: `$env:SLOW_MO='900'; npx playwright test --headed`

