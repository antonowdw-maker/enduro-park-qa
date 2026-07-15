# Проект: Enduro Park Manager (QA-Stand)

Технический стенд для обучения автоматизации тестирования. Используется для отработки написания автотестов через связку: Recording + LLM + TypeScript + Playwright.

## 🛠 Технологический стек
- **Frontend:** React 18, Tailwind CSS v4.0, Zod (валидация), Lucide Icons.
- **Backend:** Node.js, Express, Prisma ORM.
- **База данных:** SQLite (файл `backend/prisma/dev.db`).

## 🚀 Запуск проекта
1. **Секреты (обязательно):**
   - Скопируйте `backend/.env.example` → `backend/.env`
   - Заполните `JWT_SECRET`, `SEED_ADMIN_PASSWORD`, `SEED_MECHANIC_PASSWORD` (см. [`docs/SECURITY.md`](docs/SECURITY.md))
   - Логины: `admin` / `mechanic` — пароли **только в `.env`**, не в git
2. **Подготовка базы:**
   - В папке `backend`: `npx prisma db push`
   - Наполнение данными (50 байков, детерминированно): `npm run seed`
3. **Запуск (в двух терминалах):**
   - Бэкенд: `cd backend && npm run dev` (доступен на http://localhost:5000)
   - Фронтенд: `cd frontend && npm run dev` (доступен на http://localhost:5173)

## 🔍 Особенности для тестирования
- **Локаторы:** Для всех ключевых элементов проставлен атрибут `data-testid`.
- **Валидация данных:** 
  - VIN: строго 17 символов.
  - Год: не ранее 1990.
- **Намеренные несоответствия (для тестов):** Текст в фильтре "Ремонт" не совпадает дословно со статусом в таблице "В ремонте".

## 📋 План итераций (согласован с заказчиком)

| # | Тема | Статус |
|---|------|--------|
| 1 | Auth: роутинг, login, AuthContext, testid | ✅ |
| 2 | Фильтры по статусу + testid | ✅ |
| 3 | Пагинация + testid, layout формы | ✅ |
| 4 | Таблица: все колонки + сортировка | ✅ |
| 5 | CRUD: модалка добавления/редактирования, delete, API PUT/DELETE | ✅ |
| 6 | Роли в UI (аноним / mechanic / admin) | ✅ |
| 7 | Валидация + `error-*` testid + BUG-03 | ✅ |
| 8 | API: auth на GET /bikes, offset, фильтры год/пробег | ✅ |
| 9 | Seed: детерминированные данные для тестов | ✅ |
| 10 | Playwright + GitHub Actions CI | ✅ **в `main`** (волны 10.1–10.6) |


## 📝 Бэклог улучшений (вне плана итераций)

Сюда попадают идеи из ревью кода и обсуждений — то, что **не входит** в таблицу итераций выше, но стоит не забыть. При новых предложениях «сделать позже» — дополняем этот список.

**Отклонения от PDF-требований и статус ручных ТК** — в [`docs/IMPLEMENTATION-NOTES.md`](docs/IMPLEMENTATION-NOTES.md).  
**Roadmap следующих волн (A…J)** — [`docs/QA-STAND-ROADMAP.md`](docs/QA-STAND-ROADMAP.md).  
**Безопасность и деплой** — [`docs/SECURITY.md`](docs/SECURITY.md).  
**Актуальные требования и ТК** — [`docs/SYSTEM-REQUIREMENTS-v2.1.md`](docs/SYSTEM-REQUIREMENTS-v2.1.md), [`docs/MANUAL-TEST-CASES-v1.2.md`](docs/MANUAL-TEST-CASES-v1.2.md).

### UX / интерфейс
- [x] Перенести `pagination-limit` из блока фильтров к пагинации под таблицей.
- [x] **Мультивыбор статусов в фильтрах** — выбирать несколько статусов одновременно (напр. «Доступен» + «В ремонте»).
- [x] Поле «Последнее ТО»: текст + календарь + маска (`20100101` → `2010-01-01`).

### Рефакторинг фронтенда
- [x] Доработать `MainPage.tsx`: вынести `BikeTable` и `BikeFilters` в отдельные компоненты (частично сделано: `BikeFormModal`).
- [x] Исправить `useEffect` в `MainPage`: вынести `loadData` в `useCallback` и корректно указать зависимости (сейчас работает, но формально неполный deps-массив).

### Бэкенд / инфраструктура
- [x] Секреты в `.env`, не в git; валидация паролей seed и JWT (см. `docs/SECURITY.md`).
- [x] Убрать или задействовать `authService.ts` — сейчас логин идёт через `authController`, сервис может дублировать логику.
- [x] Удалить случайный `package-lock.json` в корне репозитория (если не нужен для Playwright в корне).

### Документация / тест-кейсы
- [x] Обновить ручные ТК: ошибка поля «Марка» — «Минимум 2 символа для марки» (`error-brand`); правило min 2 символа оставить для автотестов. *(включено в v1.2)*

### Автотесты (практики, итерация 10 — **закрыта и влита в `main`**, 14.07.2026)
- [x] Каталог `e2e/` (Playwright + TS), globalSetup (`db push` + seed), Page Object login/main, auth smoke.
- [x] Page Object: `bike-form.page.ts`; спеки `roles.spec.ts` / `filters.spec.ts` (итерация 10.2).
- [x] CRUD + `known-bugs.spec.ts` (правильные ожидания + `test.fail` для BUG-01…03) + roles API (итерация 10.3).
- [x] **10.5 Матрица валидации:** `validation.spec.ts` (+ `noValidate` на форме).
- [x] GitHub Actions: E2E-гейт на PR/`push` (итерация 10.4).
- [x] **10.6 Аудит покрытия** + sort/pagination + пере-seed перед счётчиками.  
  Дальше не волны 10.x. Product/CI бэклог «на подумать» закрыт (фильтр, seed, nightly) — в `main`.

Подробнее: [`e2e/README.md`](e2e/README.md), workflows [`.github/workflows/e2e.yml`](.github/workflows/e2e.yml) (гейт) и [`.github/workflows/e2e-nightly.yml`](.github/workflows/e2e-nightly.yml) (cron).

### CI / когда гонять автотесты
- [x] **Гейт:** pipeline на PR/`push` в `main` и `feature/*` — Chromium. *(итерация 10.4)*
- [x] **Nightly:** schedule cron `0 3 * * *` UTC + `workflow_dispatch` — chromium/firefox/webkit. *(влито в `main`)*
- [x] Nightly **дополняет** гейт, не заменяет его.

### Product / данные
- [x] **Фильтр по марке и модели** — UI + API (`brand`/`model`), testid, ТК, smoke + ТТД. *(влито в `main`)*
- [x] **Каталог/seed modern** — CN/EU эндуро, якоря SEED-05…07, счётчики 19/16/15. *(влито в `main`)*

**Итог:** открытых пунктов в бэклоге «на подумать» нет (14.07.2026). Волны **A–D** + TL-hotfix в `main`; **E** — на `feature/qa-wave-e-search-ui` (до merge).

### Следующий план (волны A…J)
Подробно: [`docs/QA-STAND-ROADMAP.md`](docs/QA-STAND-ROADMAP.md).  
Автотесты: [`e2e/README.md`](e2e/README.md). Ревью / коммиты: [`.cursor/rules/`](.cursor/rules/).

- [x] **A** — остатки TC→авто (SEED-01, httpOnly) — `feature/qa-wave-a-tc-leftovers` → `main`
- [x] **B** — flake-hunt E2E (`runAndWaitForBikes`, setLimit50) — `feature/qa-wave-b-flake-hunt` + `fix/setLimit50-noop-wait`
- [x] **C** — API query ТТД / контракт — `feature/qa-wave-c-api-query` (`bikes-query-api.spec.ts`)
- [x] **D** — CRUD/Auth API глубина — `feature/qa-wave-d-crud-auth-api` (`bikes-crud-api`, lifecycle, rate-limit opt-in)
- [x] **TL-ревью A–D** — целая пагинация, fingerprint, waits — `fix/tl-review-waves-a-d` (`7c7478c`)
- [x] **E** — UI search + ошибка списка (+ retry) — `feature/qa-wave-e-search-ui`
- [ ] **F** — a11y / mobile
- [ ] **G** — security hardening
- [ ] **H** — known-bugs учебный контракт
- [ ] **I** — матрица покрытия + CI gates
- [ ] **J** — эпик прокат/аренда

**Перед каждой волной / merge:** синхрон `README` ↔ roadmap ↔ SYSTEM-REQUIREMENTS ↔ MANUAL ↔ IMPLEMENTATION-NOTES.  
**Коммит / пуш / merge** — только по явному апруву.  
**Формат коммитов (договорились — вариант B):** `feat(frontend): …`, `fix(backend): …`, `test(e2e): …`, `docs: …`, `ci(e2e): …` — см. [`.cursor/rules/git-branch-commit.mdc`](.cursor/rules/git-branch-commit.mdc). Без голого `feat:`/`fix:` без scope.

### Уже сделано (для истории)
- [x] Единый `JWT_SECRET` в `config.ts` (было два разных секрета).
- [x] Сортировка строк без учёта регистра в SQLite (`LOWER()` для brand/model/vin/status).
- [x] Сортировка по умолчанию: марка по возрастанию (TC-SORT-01).
- [x] Модалка CRUD: `add-bike-btn`, `edit-bike-{vin}`, `delete-bike-{vin}`, PUT/DELETE API.
- [x] Подтверждение удаления в приложении: `delete-confirm-modal`, `delete-confirm-btn`, `delete-cancel-btn`.
- [x] Роли в UI: анонимный просмотр без входа; mechanic без delete; admin — полный доступ; `header-login-btn`.
- [x] Валидация формы: `error-*` testid, BUG-03 (год 1988/2028 проходят).