# История проекта Enduro Park (архив)

Документ для **исторического контекста**. Актуальная витрина — корневой [`README.md`](../README.md).  
Детальные отклонения и статусы TC — [`IMPLEMENTATION-NOTES.md`](IMPLEMENTATION-NOTES.md).  
Живой план — [`QA-STAND-ROADMAP.md`](QA-STAND-ROADMAP.md).

---

## Откуда начинали (v0 / ранняя постановка)

Первоначальная формулировка:

> Технический стенд для обучения автоматизации тестирования.  
> Отработка автотестов через связку: **Recording + LLM + TypeScript + Playwright**.

Ранний product snapshot — [`RELEASE_NOTES.md`](../RELEASE_NOTES.md) (v0.2.0: таблица, фильтры, seed 50, BUG-01 as designed; план JWT/ролей ещё впереди).

Смысл этапа:
1. Поднять простой CRUD-стенд с `data-testid`.
2. Написать первые автотесты «с нуля» (и с помощью LLM).
3. Итерации 1–10 по согласованному с заказчиком плану.

---

## Что стало к волнам A–H (15.07.2026)

Стенд вырос в **портфолио / учебный QA product**:

| Было | Стало |
|------|--------|
| «Научиться писать автотесты» | Зрелый набор UI + API E2E (~180+ `test()`, ~23 спеки), CI gate + nightly |
| Итерации 1–10 product skeleton | Волны **A–H**: контракты API, search, a11y/mobile, security, known-bugs |
| Баги «для поиска» | Каталог [`KNOWN-BUGS.md`](KNOWN-BUGS.md) + teaching/strict |
| Один README = журнал + план + бэклог | Разделение: README (сейчас) / NOTES (трассировка) / ROADMAP (впереди) / HISTORY (это) |

Дальше: **I** (матрица + CI gates), **J** (эпик прокат) — см. roadmap.

---

## Итерации 1–10 (закрыты, в `main`)

| # | Тема | Статус |
|---|------|--------|
| 1 | Auth: роутинг, login, AuthContext, testid | ✅ |
| 2 | Фильтры по статусу + testid | ✅ |
| 3 | Пагинация + testid, layout формы | ✅ |
| 4 | Таблица: все колонки + сортировка | ✅ |
| 5 | CRUD: модалка, delete, API PUT/DELETE | ✅ |
| 6 | Роли в UI (аноним / mechanic / admin) | ✅ |
| 7 | Валидация + `error-*` + BUG-03 | ✅ |
| 8 | API: offset, фильтры год/пробег; публичный GET /bikes | ✅ |
| 9 | Seed: детерминированные данные | ✅ |
| 10 | Playwright + GitHub Actions (10.1–10.6) | ✅ |

### Итерация 10 (детали, закрыта 14.07.2026)

- Каталог `e2e/`, globalSetup, Page Object, auth smoke  
- roles / filters / CRUD / known-bugs UI  
- validation matrix (`noValidate`)  
- sort/pagination + пере-seed  
- CI gate Chromium; nightly 3 браузера  

---

## Бэклог «на подумать» (весь закрыт → `main`)

Исторический чеклист из старого README — **всё отмечено выполненным** (14–15.07.2026):

### UX
- [x] `pagination-limit` у пагинации  
- [x] Мультивыбор статусов  
- [x] lastService: текст + календарь + маска  

### Frontend refactor
- [x] `BikeTable` / `BikeFilters`  
- [x] `loadData` + `useCallback` deps  

### Backend / infra
- [x] Секреты в `.env` + валидация (`SECURITY.md`)  
- [x] `AuthService` слой  
- [x] Корневой случайный `package-lock` убран  

### Docs / TC
- [x] Текст `error-brand` min 2  

### Product / CI сверх итераций
- [x] Фильтр brand/model + ТТД  
- [x] Seed catalog modern (Kayo / Regulmoto / Motoland)  
- [x] Nightly дополняет PR-гейт  

### Мелкие фиксы «для истории»
- [x] Единый `JWT_SECRET`  
- [x] `LOWER()` сортировка в SQLite  
- [x] Сортировка по умолчанию: марка ↑  
- [x] Delete confirm modal  
- [x] Публичная главная + роли UI  

---

## Волны roadmap A–H (после итерации 10)

| Волна | Суть | Статус |
|-------|------|--------|
| A | TC leftovers (SEED-01, httpOnly) | ✅ `main` |
| B | Flake-hunt waits | ✅ `main` |
| C | API query ТТД | ✅ `main` |
| D | CRUD/Auth API глубина | ✅ `main` |
| TL hotfix A–D | parseInt, fingerprint, lifecycle | ✅ `main` |
| E | UI search + list-error | ✅ `main` |
| F | a11y / mobile + compact filter | ✅ `main` |
| G | Security: helmet, CSRF, Zod, XSS | ✅ `main` |
| H | Known-bugs каталог + API matrix | ✅ `main` |

Актуальное продолжение — только в [`QA-STAND-ROADMAP.md`](QA-STAND-ROADMAP.md) и корневом README (секция «Дальше»).

---

## Процесс, который закрепился (не стирать из истории)

- Feature-ветки `feature/qa-wave-*` от `main`  
- Dual TL ревью (fullstack + QA automation) **до** коммита  
- Коммиты **вариант B:** `type(scope):`  
- Коммит / пуш / merge — только по явному апруву  
- Синхрон docs перед merge волны  

Правила: [`.cursor/rules/`](../.cursor/rules/).

---

*Собрано 15.07.2026 при переразметке README: длинные чеклисты вынесены сюда, чтобы витрина не дублировала архив.*
