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
```

Перед прогоном `globalSetup` делает `prisma db push` + `npm run seed` в `backend/`.
`webServer` поднимает backend (:5000) и frontend (:5173), если они ещё не запущены.

## CI (GitHub Actions) — итерация 10.4 + nightly

Воркфлоу: `.github/workflows/e2e.yml` (гейт), `.github/workflows/e2e-nightly.yml` (cron)

| Когда | Что |
|-------|-----|
| `push` в `main` / `feature/**` | Прогон E2E Chromium (если менялись backend/frontend/e2e/workflow) |
| `pull_request` → `main` | То же — **гейт перед merge** |
| `schedule` daily 03:00 UTC | Nightly: chromium + firefox + webkit (матрица) |
| `workflow_dispatch` | Ручной запуск nightly |

Локально по умолчанию только Chromium. Другой браузер:  
`$env:PLAYWRIGHT_BROWSER='firefox'; npx playwright test` (нужен `npx playwright install firefox`).

CI сам пишет эфемерный `backend/.env` (случайные JWT/пароли), поднимает API+UI через `webServer`, `globalSetup` делает seed.

**Заметка:** GitHub cron выполняется на **default branch** (`main`). После влития `e2e-nightly.yml` nightly активен; можно также запустить вручную (`Actions` → e2e-nightly → Run workflow).

## Изоляция данных и flake-hunt (волна B)

- `workers: 1`, `fullyParallel: false` — общая SQLite; **не** параллелить тесты на одной БД.
- Suites со счётчиками / якорями (`filters`, `seed`, `sort-pagination`, brand/model…) делают `resetDatabaseSeed()` в `beforeAll` (после CRUD «грязи»).
- CRUD/validation **могут** менять БД; если гоняете выборочно — сначала seed или полный `npm test` (есть `globalSetup`).
- После фильтра / сортировки / пагинации ждём `GET /api/bikes` через `MainPage.runAndWaitForBikes` / `helpers/bikes-api.ts` — не ассертим DOM по старому ответу.
- Не вешать `waitForResponse` на `selectOption`, если значение **уже** выбрано (`limit` 10/50 и т.п.) — запроса не будет, ловите timeout. `setLimit50()` это учитывает.
- `waitForBikesApi`: точный pathname `/api/bikes`; для UI-ошибки списка передайте `{ requireOk: false }`.
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
- Security perimeter (волна G slice1): `security-perimeter-api.spec.ts` (health/ready/headers/413); `security-xss.spec.ts`; rate-limit: по умолчанию вкл., CI — `DISABLE_LOGIN_RATE_LIMIT=true`; isolated `auth-rate-limit-api.spec.ts` + `RUN_RATE_LIMIT_E2E=1`
- Seed-якоря modern: `SEED_VINS.availableKayo` / `repairRegulmoto` / `soldMotoland` (`seed.spec.ts` TC-SEED-05…07)
- Демо с замедлением: `$env:SLOW_MO='900'; npx playwright test --headed`

