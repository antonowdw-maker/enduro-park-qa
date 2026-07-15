# Enduro Park Manager

Учебно-демонстрационный **QA product-стенд**: приложение учёта эндуро-байков + зрелый набор автотестов, контрактов API и процессов ревью.

> **Как начинали:** отработка автотестов (Recording + LLM + Playwright) на простом CRUD.  
> **Где сейчас:** ~180+ Playwright-тестов, CI gate + nightly, волны A–H (API TTD, a11y, security, known-bugs).  
> Подробная летопись: [`docs/PROJECT-HISTORY.md`](docs/PROJECT-HISTORY.md). Ранний snapshot: [`RELEASE_NOTES.md`](RELEASE_NOTES.md).

Это **не** production-система проката. Намеренные дефекты (BUG-01…03) — учебный контракт, см. [`docs/KNOWN-BUGS.md`](docs/KNOWN-BUGS.md).

---

## Стек

| Слой | Технологии |
|------|------------|
| Frontend | React 18, Tailwind CSS v4, Zod, Lucide |
| Backend | Node.js, Express, Prisma, Helmet, CSRF, Zod DTO |
| DB | SQLite (`backend/prisma/dev.db`) |
| E2E | Playwright + TypeScript (`e2e/`), Page Objects |
| CI | GitHub Actions: PR-гейт (Chromium) + nightly (3 браузера) |

---

## Быстрый старт

1. `cp backend/.env.example backend/.env`  
   Заполните `JWT_SECRET`, `SEED_ADMIN_PASSWORD`, `SEED_MECHANIC_PASSWORD` (≥12 символов).  
   Для локальных E2E: `DISABLE_LOGIN_RATE_LIMIT=true`.  
   Подробности: [`docs/SECURITY.md`](docs/SECURITY.md).
2. `cd backend && npx prisma db push && npm run seed`
3. Два терминала:
   - `cd backend && npm run dev` → http://localhost:5000  
   - `cd frontend && npm run dev` → http://localhost:5173  
4. Логины seed: `admin` / `mechanic` (пароли **только** из `.env`).
5. Автотесты: `cd e2e && npm install && npm run install:browsers && npm test`  
   → [`e2e/README.md`](e2e/README.md)

---

## Что умеет стенд (кратко)

- Публичный каталог байков: фильтры (статусы, search OR, brand/model AND, год/пробег), сортировка, пагинация  
- Роли: anon (чтение) / mechanic (CRUD без delete) / admin (полный доступ)  
- Cookie-сессия (HttpOnly JWT) + CSRF на мутациях + Zod на границе API  
- Детерминированный seed (50 байков, якорные VIN)  
- Намеренные баги для обучения assert/fail-стратегий  

---

## Документация (карта)

| Документ | Зачем открывать |
|----------|-----------------|
| [`docs/QA-STAND-ROADMAP.md`](docs/QA-STAND-ROADMAP.md) | Что дальше (I, J…) и статус волн |
| [`docs/SYSTEM-REQUIREMENTS-v2.1.md`](docs/SYSTEM-REQUIREMENTS-v2.1.md) | Поведение продукта (F-*, API) |
| [`docs/MANUAL-TEST-CASES-v1.2.md`](docs/MANUAL-TEST-CASES-v1.2.md) | Ручные ТК + трассировка 🤖 автотестов |
| [`docs/KNOWN-BUGS.md`](docs/KNOWN-BUGS.md) | BUG-01…03: факт vs цель, teaching/strict |
| [`docs/SECURITY.md`](docs/SECURITY.md) | Секреты, деплой, CSRF/rate-limit |
| [`docs/IMPLEMENTATION-NOTES.md`](docs/IMPLEMENTATION-NOTES.md) | Отклонения от PDF, TL-ревью, аудит |
| [`docs/PROJECT-HISTORY.md`](docs/PROJECT-HISTORY.md) | Итерации 1–10, закрытый бэклог, эволюция стенда |
| [`e2e/README.md`](e2e/README.md) | Как гонять Playwright и CI-флаги |
| [`.cursor/rules/`](.cursor/rules/) | Dual TL, коммиты вариант B, ветки |

---

## Статус и план

**Закрыто в `main`:** итерации 1–10, бэклог «на подумать», волны **A–H**.

**Дальше** (детали в roadmap):

| Волна | Фокус | Статус |
|-------|--------|--------|
| **I** | Матрица покрытия F-\*/TC-\*/spec + CI quality gates | ⏳ |
| **J** | Эпик «прокат / аренда» | ⏳ |

Ветки после мержа обычно удаляем; для ориентира сейчас: `main` + последние feature волн (F/G/H).

---

## Процесс работы (коротко)

1. Ветка от актуального `main`  
2. Реализация → **двойное ревью** в чате (fullstack TL + QA automation TL)  
3. Синхрон docs по чеклисту волны  
4. Коммит / пуш / merge — **только** по явной команде  
5. Коммиты: `feat(frontend):`, `test(e2e):`, `docs:`, … — см. `.cursor/rules/git-branch-commit.mdc`

---

## Особенности для QA

- Ключевые локаторы: `data-testid`  
- Учебные баги **не чинить** «заодно» с фичами — см. KNOWN-BUGS  
- Rate-limit login по умолчанию **вкл.**; в CI/локальном Playwright — `DISABLE_LOGIN_RATE_LIMIT=true`  
- Strict known-bugs (без `test.fail`): `KNOWN_BUGS_MODE=strict` (suite будет красным, пока баги живы)
