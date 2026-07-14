# Журнал реализации vs требования

Документ для **трассировки**: что сделано не как в PDF/DOCX, что добавлено сверху, что отложено.
Источник истины по **поведению** — код + **v2.1 / v1.2** в `docs/`.

## Как пользоваться (процесс)

| Когда | Что делаем |
|-------|------------|
| **Во время итерации** | Записываем отклонение/решение сразу в таблицы ниже (1–2 строки). |
| **README бэклог** | Идеи «сделать позже», не описанные в требованиях. |
| **Перед merge в `main`** | Просмотр таблиц: что перенести в требования v2.1. |
| **После волны Playwright** | В `MANUAL-TEST-CASES` пометить ТК: `🤖 Автотест:` файл + ID; обновить таблицу TC-* ниже. |

---

## Изменения v2.1 (13.07.2026) — согласовано с заказчиком

| Тема | Было (v2.0) | Стало (v2.1) | Статус |
|------|-------------|--------------|--------|
| Роль guest | Учётная запись guest (удалена) | **Удалена** | ✅ |
| Секреты в git | Пароли в доках/seed | Только `.env.example`, валидация | ✅ Бэклог security | `docs/SECURITY.md` |
| Первый экран | Редирект на /login | **/** — таблица без входа | ✅ |
| Вход | Обязателен для просмотра | Только для CRUD (`header-login-btn`) | ✅ |
| VIN при edit | readOnly в UI | **Редактируем**; unique на create + update | ✅ |
| GET /bikes | Планировался auth (ит. 8) | **Публичный** уже в v2.1 | ✅ |

---

## Отклонения от системных требований (F-*)

| ID | В требованиях | Как сделано в коде | Статус | Действие с документом |
|----|---------------|-------------------|--------|------------------------|
| F-SORT (default) | Явный default не задан | По умолчанию сортировка: **марка ↑** | ✅ Принято | В v2.1 |
| F-BIKE-CREATE | Модалка, testid | `add-bike-btn`, `form-save-btn` | ✅ Принято | В v2.1 |
| F-BIKE-DELETE | Подтверждение | `delete-confirm-modal` | ✅ Принято | В v2.1 |
| VIN | 17 символов | + без I/O/Q + буквы и цифры; **редактируем при update** | ✅ Принято | В v2.1 |
| Дубликат VIN | — | Сообщение при create **и** update | ✅ Добавлено | TC-BIKE-EDIT-VIN-02 |
| Пагинация API | `offset` | `offset` + `page` (обратная совместимость) | ✅ Итерация 8 | В v2.3 |
| Фильтры год/пробег | yearFrom…mileageTo | API + UI testid | ✅ Итерация 8 | В v2.3 |
| Фильтр статусов | Один статус | **Мультивыбор**; API `status=a,b`; toggle по клику | ✅ Бэклог п.2 | F-FILTER-02, TC-FILTER-MULTI-* |
| Фильтр марка/модель | Только общий `search` | Явные UI + API `brand`/`model` (подстрока LIKE) | ✅ Бэклог product | F-FILTER-11…15 |
| ТТД brand/model | Smoke только | EP / BVA / decision table + API-контракт | ✅ | `filters-brand-model*.spec.ts` |
| GET /bikes auth | PDF: обязательный | Опциональный: без cookie OK; невалидный → 200 + clear cookie | ✅ Итерация 8 / fix | В v2.5 |
| Seed | Случайные 50 байков | **Детерминированные** 50 + 8 якорных VIN | ✅ Итерация 9 | В v2.5 |
| Seed каталог | 10 брендов в генерации | 18 пар CATALOG + 3 CN-якоря; статусы 19/16/15 сохранены | ✅ Бэклог product | seed `2026.07.14` / v2.7 |
| BUG-03 | Год 1988/2028 проходят | Ошибка только на 1989 и current+1 | ✅ Намеренный баг | TC-BIKE-NEG-07/09 |
| lastService | Не описано в v2.0 | ≥ 1990-01-01, ≤ сегодня; **текст + календарь**; маска `20100101`→`2010-01-01` | ✅ v2.2 + бэклог п.3 | TC-BIKE-NEG-11…14, TC-BIKE-LAST-* |
| MainPage | Монолит | `BikeFilters` + `BikeTable` + типы в `types/bike.ts` | ✅ Бэклог п.4 | Поведение без изменений |
| loadData / useEffect | Неполный deps | `useCallback` + deps `[loadData, hasFilterErrors]` | ✅ Бэклог п.5 | — |
| authService | Только JWT | `AuthService.login` + `UserRepository`; контроллер — HTTP/cookie | ✅ Бэклог п.6 | Слои как у bikes |
| Корневой package-lock | Случайный пустой lock | Удалён локально; в `.gitignore` `/package-lock.json` | ✅ Бэклог п.7 | Playwright — в корне позже при ит. 10 |
| BUG-02 | Нестандартная ошибка TEST/123 | Текст про guest в form-server-error | ✅ Намеренный баг | TC-BIKE-NEG-10 |

---

## Статус ручных тест-кейсов (TC-*)

| TC | Кратко | Статус | Комментарий |
|----|--------|--------|-------------|
| TC-AUTH-01 | Вход admin | 🤖 Авто | `e2e/tests/auth.spec.ts` (10.1) |
| TC-AUTH-02 | Вход mechanic | 🤖 Авто | `e2e/tests/roles.spec.ts` (10.2) |
| TC-AUTH-03 | Вход guest | ⏭ Удалён | Роль guest снята |
| TC-AUTH-04 | Неверный пароль | 🤖 Авто | `e2e/tests/auth.spec.ts` (10.1) |
| TC-AUTH-05 | Несуществующий user | ✅ Ручной | |
| TC-AUTH-06 | Logout | ✅ Ручной | |
| TC-AUTH-07 | Главная без auth | 🤖 Авто | `e2e/tests/roles.spec.ts` (10.2) |
| TC-AUTH-08 | GET /bikes без cookie | ✅ Обновлён | 200, публичный список |
| TC-ROLE-01…03 | Роли UI | 🤖 Авто | `e2e/tests/roles.spec.ts` (10.2) |
| TC-FILTER-MULTI-* / YEAR-01 | Фильтры | 🤖 Авто | `e2e/tests/filters.spec.ts` (10.2) |
| TC-ROLE-01 | Аноним без CRUD | ✅ Работает | Был guest |
| TC-ROLE-02…03 | mechanic / admin | ✅ Работает | |
| TC-ROLE-05 (старый) | guest POST | ⏭ Удалён | Заменён: POST без cookie → 401 |
| TC-BIKE-EDIT-VIN-* | VIN при edit | ✅ Новые в v1.2 | |
| TC-BIKE-NEG-* | Негативная валидация | ✅ Работает | `error-*`, BUG-03, дата ТО |
| TC-FILTER-YEAR-* / MILEAGE-* | — | ✅ Новые в v1.4 | Итерация 8 |
| TC-API-OFFSET-01 | — | ✅ Новый в v1.4 | offset в ответе API |
| TC-AUTH-10 | — | ✅ Обновлён | Невалидный cookie на /bikes → 200, clear |
| TC-AUTH-11 | — | ✅ Новый | Невалидный cookie на /me → 401 |
| TC-FILTER-VALID-* / CLEAR-* | — | ✅ Новые в v1.5 | Валидация и очистка фильтров |
| TC-FILTER-BRAND-* / MODEL-* | Марка/модель smoke | 🤖 Авто | `e2e/tests/filters.spec.ts` (v1.7) |
| TC-FILTER-BRAND-NEG/DT/BVA + API | ТТД марка/модель | 🤖 Авто | `filters-brand-model*.spec.ts` |
| TC-FILTER-MULTI-* | — | ✅ Новые в v1.2 | Мультивыбор статусов (бэклог п.2) |
| TC-BIKE-LAST-* | — | ✅ Обновлены | Текст + календарь + маска (бэклог п.3) |
| TC-SEED-* | — | ✅ / 🤖 | Детерминированный seed; SEED-05…07 — каталог modern |

---

## testid (v2.1)

- `header-login-btn` — войти с главной
- `back-to-home-btn` — на главную с `/login`
- `user-username`, `user-role` — шапка после входа
- `actions-readonly-placeholder` — нет прав на действия
- `filter-year-from`, `filter-year-to`, `filter-mileage-from`, `filter-mileage-to` — диапазоны (ит. 8)
- `filter-clear-all`, `filter-*-clear` — сброс фильтров (v2.4)
- `error-filter-*` — ошибки валидации диапазонов (v2.4)
- `input-lastService` — текстовый ввод даты ТО; `input-lastService-calendar` — календарь (бэклог п.3)

Удалено: `guest-readonly-banner`

---

## Процесс (договорённости)

| Правило | Как делаем |
|---------|------------|
| Коммит | Только после подтверждения QA («ок, коммить») |
| Ревью | После каждого пункта — блок **«Ревью тимлида»** (✅ / ⚠️ / 🔴) до передачи на QA |
| Smoke | `tsc` + ключевой сценарий / API; оба сервера при отдаче на UI-тест |
| `main` | Не трогаем до конца эпика бэклога; работа в `feature/backlog-improvements` |
| Не коммитить | `dev.db`, корневой `package-lock.json`, `backend/node_modules/*` |

---

## Статус сессии 14.07.2026 — в работе

**Ветка:** `feature/backlog-improvements`

### Сделано 13.07

| # | Задача | Статус |
|---|--------|--------|
| 1 | `pagination-limit` под таблицей | ✅ |
| 2 | Мультивыбор статусов | ✅ |
| 3 | Дата ТО: текст + календарь + маска | ✅ |

### Сегодня / дальше

| # | Задача | Статус |
|---|--------|--------|
| 4 | Вынести `BikeTable` / `BikeFilters` | ✅ |
| 5 | `useCallback` для `loadData` | ✅ |
| 6 | `authService.ts` | ✅ |
| 7 | Корневой `package-lock.json` | ✅ |

**Эпик бэклога закрыт и влит в `main`** (14.07.2026).

### Итерация 10 — Playwright (**влита в `main`**, 14.07.2026)

Бывшая ветка `feature/playwright-e2e` (fast-forward до `7c09ec0`). Локальную feature-ветку можно удалить.

| Волна | Содержание | Статус |
|-------|------------|--------|
| 10.1 | `e2e/` + config + globalSetup + auth smoke | ✅ |
| 10.2 | POM + roles/filters | ✅ |
| 10.3 | CRUD + known-bugs (`test.fail`) + roles API | ✅ |
| 10.4 | GitHub Actions CI (гейт на PR) | ✅ |
| 10.5 | Матрица валидации / тест-дизайн (NEG/границы/маски/VIN edit) | ✅ |
| 10.6 | **Аудит покрытия:** бэклог + ручные ТК + код → gaps → добить E2E | ✅ |

**Автоматизировано (10.3):** TC-BIKE-CREATE/EDIT/DELETE; CREATE-VIN-01; NEG-01; LAST-01; ROLE-04…06; BUG-01…03 (`test.fail`); NEG-06 зелёный.

**Автоматизировано (10.5):** `validation.spec.ts` — NEG-02…05, NEG-08, NEG-11…14, LAST-02/03, EDIT-VIN-01/02.  
Фикс UI: `BikeFormModal` — `noValidate` (иначе native `min`/`max` календаря глушил Zod `error-lastService`).  
**14.07.2026:** текст `error-year` при current+1 → «Год не может быть позже {currentYear}» (front+back); BUG-03-граница без изменений.  
VIN: I/O/Q не вырезаются до валидации → сообщение «нельзя использовать буквы I, O, Q» (NEG-04b).

**Автоматизировано (10.6):** `auth-extra` (05/06/09), `auth-api` (08/10/11 + OFFSET), `filters` (YEAR-02…VALID-04), `seed` (02/03/04).

**CI (10.4):** `.github/workflows/e2e.yml` — эфемерный `backend/.env`, Chromium, artifact при failure; ready-check на `/` + `127.0.0.1`.

**Заметка QA:** seed VIN вида `…QA…` содержат букву **Q** — фронтовый Zod режет до API; дубликат VIN в UI проверяем своим VIN (create×2).

### Матрица покрытия ТК (итог 10.6)

| Область | 🤖 | Вне E2E / skip |
|---------|----|----------------|
| AUTH-01…11 | ✅ все кроме см. рядом | AUTH cookie httpOnly UI не ассертится |
| ROLE-01…06 | ✅ | — |
| BIKE CRUD / VIN / NEG / LAST | ✅ | — |
| FILTER-* / OFFSET | ✅ | — |
| SEED-02…04 | ✅ | SEED-01 — лог `npm run seed` / CI |
| SORT / PAGINATION UI | 🔄 `sort-pagination.spec.ts` | добавлено после замечания QA |
| BUG-01…03 | `test.fail` / зелёные границы | намеренные баги стенда |
| §8 «сортировка UI» (v1.1 без отдельных TC-*) | ✅ TC-SORT/PAGINATION-* | — |

### Бэклог «на подумать» (не блокер ит. 10)
- ~~Фильтр по марке / модели (UI + API + ТК + E2E).~~ → влита в `main` (F-FILTER-11…15 + ТТД).
- ~~Seed: современные китайские эндуро (Kayo, Regulmoto, Motoland, GR, Kews…) и актуальные европейские/прочие внедорожные.~~ → `feature/seed-catalog-modern`.
- Nightly cron CI (доп. к гейту 10.4).

### После всех волн 10.* — аудит максимального покрытия
1. Пройти идеи из бэклога README (product/CI/валидация).
2. Матрица: каждый TC-* → 🤖 / частично / нет автотеста.
3. Обход кода: auth, roles UI+API, filters, sort, pagination, CRUD, валидации, cookie edge (AUTH-08…11), logout.
4. Список gaps с приоритетом (P0 блокер регрессии → P2 nice).
5. Закрыть gaps спеками / пометить skip только с причиной.

### Не чинить намеренно

BUG-01, BUG-02, BUG-03 — см. требования §7 / ручные ТК. В автотестах — правильные ожидания + `test.fail()`.

---

*Последнее обновление: 14.07.2026 — эпик 10 в `main`; локальная `feature/playwright-e2e` снята.*
