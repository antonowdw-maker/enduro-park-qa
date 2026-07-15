# Системные требования к проекту Enduro Park Manager

**Версия:** 2.7  
**Дата:** 14.07.2026  
**Изменения от v2.6:** seed-каталог modern (Kayo/Regulmoto/Motoland + расширенный CATALOG); версия seed `2026.07.14`.

**История:** v2.7 — каталог seed modern; v2.6 — фильтр марка/модель (F-FILTER-11…15) + ТТД E2E; v2.5 — текст `error-year` (текущий год) + приоритет сообщения VIN про I/O/Q; v2.4 — валидация фильтров; v2.3 — offset, фильтры год/пробег; v2.2 — валидация, BUG-03, дата ТО; v2.1 — публичная главная, без guest, VIN редактируем; v2.0 — исходный PDF.

---

## 2.2 Пользователи системы

| Тип | Описание | Доступ |
|-----|----------|--------|
| **Анонимный посетитель** | Не авторизован | Просмотр таблицы, фильтры, сортировка, пагинация |
| **Механик (mechanic)** | Учётная запись seed | Просмотр + добавление + редактирование (без удаления) |
| **Администратор (admin)** | Учётная запись seed | Полный доступ, включая удаление |

Пароли задаются в `backend/.env` (`SEED_*_PASSWORD`), **не хранятся в репозитории**. См. [`docs/SECURITY.md`](SECURITY.md).

Роль `guest` **удалена**.

---

## 4.1 Аутентификация и авторизация

| ID | Требование | Роли | Проверка |
|----|------------|------|----------|
| F-AUTH-01 | Страница `/login` | public | `input-username`, `input-password` |
| F-AUTH-02 | Успешный вход → cookie, редирект на `/` | mechanic, admin | `user-username`, `user-role` |
| F-AUTH-03 | Неверные данные → 401 | public | `login-error-message` |
| F-AUTH-04 | Роли: mechanic, admin | — | middleware POST/PUT/DELETE |
| F-AUTH-05 | Выход → cookie очищена, остаёмся на `/` | mechanic, admin | `logout-btn` |
| F-AUTH-06 | Главная `/` публична | public | TC-AUTH-07 |
| F-AUTH-07 | Кнопка «Войти» на главной | public | `header-login-btn` |
| F-AUTH-08 | Возврат с login на главную | public | `back-to-home-btn` |

---

## 4.2.5 CRUD мотоциклов

| ID | Требование | Роли | Проверка |
|----|------------|------|----------|
| F-BIKE-CREATE-01 | «Добавить байк» | mechanic, admin | `add-bike-btn` |
| F-BIKE-CREATE-02 | Модалка со всеми полями | mechanic, admin | `input-*`, `select-status` |
| F-BIKE-CREATE-03 | Валидация Zod + сервер | mechanic, admin | `error-{field}` |
| F-BIKE-CREATE-04 | Успех → строка в таблице | mechanic, admin | — |
| F-BIKE-EDIT-01 | Редактирование в строке | mechanic, admin | `edit-bike-{vin}` |
| F-BIKE-EDIT-02 | VIN **редактируем** | mechanic, admin | `input-vin` |
| F-BIKE-EDIT-03 | Дубликат VIN → ошибка API | mechanic, admin | `form-server-error` |
| F-BIKE-DELETE-01 | Удаление | admin | `delete-bike-{vin}` |
| F-BIKE-DELETE-02 | Подтверждение in-app | admin | `delete-confirm-modal` |

**Аноним:** нет CRUD-кнопок; `actions-readonly-placeholder`.

---

## 5.1 Модель Bike — валидация полей

| Поле | Ограничения | Сообщение об ошибке (`error-*`) |
|------|-------------|----------------------------------|
| brand | min 2 символа | «Минимум 2 символа для марки» → `error-brand` |
| model | не пусто | «Модель обязательна» → `error-model` |
| year | см. BUG-03; целевой диапазон 1990…(текущий+1) | `error-year`: «Год выпуска не может быть раньше 1990» / «Год не может быть позже {текущийГод}» |
| vin | 17 символов; A–Z, 0–9; без I/O/Q; буквы **и** цифры; **unique** | `error-vin`: «VIN обязателен» / «нельзя использовать буквы I, O, Q» / «ровно 17 символов» / «только A–Z…» / «и буквы, и цифры» |
| mileage | ≥ 0 | `error-mileage` |
| status | available / repair / sold | `error-status` |
| lastService | Формат `YYYY-MM-DD`; **реальная дата**; **≥ 1990-01-01**; **≤ сегодня** | `error-lastService` |
| notes | ≤ 500 символов | `error-notes` |

### F-BIKE-VALID-01: Дата последнего ТО (`lastService`)

- Поле: `input-lastService` (`type="text"`) + календарь `input-lastService-calendar` (`type="date"`).
- Маска с автопреобразованием: `20100101` / `2010/01/01` → `2010-01-01`.
- Выбор в календаре синхронизирует текстовое поле (`min="1990-01-01"`, `max={сегодня}`).
- Клиент (Zod) и сервер проверяют одинаково.
- Несуществующий день (напр. `2024-02-31`) → «Некорректная дата последнего ТО».
- Дата &lt; 1990-01-01 → «Дата последнего ТО не может быть раньше 1990».
- Дата в будущем → «Дата последнего ТО не может быть в будущем».

### F-BIKE-VALID-02: Ошибки API в модалке

- Любая ошибка сервера при save → `form-server-error` (в т.ч. BUG-02, дубликат VIN).

---

## 5.2 Модель User (seed)

| username | role | Пароль |
|----------|------|--------|
| admin | admin | `SEED_ADMIN_PASSWORD` в `.env` |
| mechanic | mechanic | `SEED_MECHANIC_PASSWORD` в `.env` |

Минимум 12 символов; слабые пароли (`admin123` и т.п.) отклоняются при `npm run seed`.

---

## 5.3 Детерминированный seed (итерация 9)

| Параметр | Значение |
|----------|----------|
| Версия seed | `2026.07.14` |
| Команда | `cd backend && npm run seed` |
| Всего байков | **50** (фиксировано) |
| По статусам | available **19**, repair **16**, sold **15** |
| Случайность | **нет** (`Math.random` не используется) |
| Каталог генерации | 18 пар марка+модель (EU/JP + CN: Kayo, Regulmoto, Motoland, GR, Kews, Fantic, Rieju, Triumph) |

### Якорные байки (для ТК)

| VIN | Марка | Год | Пробег | Статус | Назначение |
|-----|-------|-----|--------|--------|------------|
| `KTM2020QA00000001` | KTM | 2020 | 12000 | available | фильтры год/пробег |
| `HON2015QA00000002` | Honda | 2015 | 45000 | repair | BUG-01, фильтр «Ремонт» |
| `YAM2018QA00000003` | Yamaha | 2018 | 25000 | sold | фильтр «Продан» |
| `BET1990QA00000004` | Beta | 1990 | 0 | available | мин. год и пробег |
| `BMW2026QA00000005` | BMW | 2026 | 99999 | available | макс. пробег |
| `HUS2024QA00000006` | Husqvarna | 2024 | 50000 | available | TC-BIKE-EDIT-VIN |
| `GAS2010QA00000007` | GasGas | 2010 | 10000 | repair | — |
| `SHE2012QA00000008` | Sherco | 2012 | 80000 | available | фильтр пробег от 50000 |
| `KAY2023QA00000009` | Kayo | 2023 | 3500 | available | каталог CN / прокат |
| `REG2022QA00000010` | Regulmoto | 2022 | 8200 | repair | каталог CN |
| `MOT2021QA00000011` | Motoland | 2021 | 15000 | sold | каталог CN |

Повторный запуск seed **полностью пересоздаёт** тот же набор (после `deleteMany`).

---

## 4.3 Фильтры списка (итерация 8)

| ID | Требование | Роли | Проверка |
|----|------------|------|----------|
| F-FILTER-01 | Фильтр по статусу (мультивыбор) | public | `filter-all`, `filter-available`, `filter-repair`, `filter-sold` |
| F-FILTER-02 | Несколько статусов одновременно | public | клик вкл/выкл; API `status=available,repair` |
| F-FILTER-03 | Год от / до | public | `filter-year-from`, `filter-year-to` |
| F-FILTER-04 | Пробег от / до | public | `filter-mileage-from`, `filter-mileage-to` |
| F-FILTER-05 | Пустое поле диапазона — фильтр не применяется | public | API без соответствующего query-параметра |
| F-FILTER-06 | Сброс всех фильтров (статус + марка/модель + диапазоны) | public | `filter-clear-all` |
| F-FILTER-07 | Очистка отдельного поля | public | `filter-{field}-clear` |
| F-FILTER-08 | «До» ≥ «от» (год и пробег) | public | `error-filter-year-to`, `error-filter-mileage-to`; запрос не уходит при ошибке |
| F-FILTER-09 | Только неотрицательные значения | public | минус не вводится; `error-filter-*` при отрицательном |
| F-FILTER-10 | Год в фильтре — только цифры, **не более 4** | public | `filter-year-from`, `filter-year-to`; `maxLength=4` |
| F-FILTER-11 | Фильтр по марке (подстрока, регистр не важен) | public | `filter-brand`; API `brand`; LIKE `%value%` |
| F-FILTER-12 | Фильтр по модели (подстрока, регистр не важен) | public | `filter-model`; API `model`; LIKE `%value%` |
| F-FILTER-13 | Марка и модель вместе (AND) | public | оба query-параметра одновременно |
| F-FILTER-14 | Пустое / только пробелы — фильтр не применяется | public | API без `brand`/`model` после trim |
| F-FILTER-15 | Марка/модель в UI — не более 40 символов | public | `filter-brand`, `filter-model`; `maxLength=40` |

---

## 6.1.2 data-testid

| Элемент | data-testid |
|---------|-------------|
| Войти (шапка) | `header-login-btn` |
| На главную (login) | `back-to-home-btn` |
| Пользователь / роль | `user-username`, `user-role` |
| Нет прав на действия | `actions-readonly-placeholder` |
| Фильтры год/пробег | `filter-year-from`, `filter-year-to`, `filter-mileage-from`, `filter-mileage-to` |
| Фильтры марка/модель | `filter-brand`, `filter-model` |
| Очистка фильтров | `filter-clear-all`, `filter-brand-clear`, `filter-model-clear`, `filter-year-from-clear`, `filter-year-to-clear`, `filter-mileage-from-clear`, `filter-mileage-to-clear` |
| Ошибки фильтров | `error-filter-year-from`, `error-filter-year-to`, `error-filter-mileage-from`, `error-filter-mileage-to` |
| Ошибки полей | `error-brand`, `error-model`, `error-year`, `error-vin`, `error-mileage`, `error-status`, `error-lastService`, `error-notes` |
| Дата последнего ТО | `input-lastService` (текст), `input-lastService-calendar` (календарь) |
| Ошибка API в форме | `form-server-error` |

---

## 6.2 API — мотоциклы

### GET /bikes — query-параметры

| Параметр | Описание |
|----------|----------|
| `status` | Один или несколько через запятую: `available`, `repair`, `sold` (пусто — все) |
| `search` | Поиск по марке/модели (общий; UI основной список его не использует) |
| `brand` | Подстрока по марке (`LIKE %value%`) |
| `model` | Подстрока по модели (`LIKE %value%`) |
| `yearFrom`, `yearTo` | Диапазон года выпуска (включительно) |
| `mileageFrom`, `mileageTo` | Диапазон пробега (включительно) |
| `sortBy`, `order` | Сортировка (asc/desc) |
| `limit` | 1…50, по умолчанию 10 |
| `offset` | Смещение (приоритет над `page`) |
| `page` | Номер страницы (если `offset` не передан) |

Ответ: `{ bikes, total, limit, offset, page, totalPages, sortBy, order }`.

### Нормализация query (не 4xx)

Невалидные / лишние значения **не** отклоняются кодом 400. Поведение GET `/bikes`:

| Параметр | При невалидном / граничном |
|----------|----------------------------|
| `limit` | `Number` → иначе **10**; затем clamp **1…50** (`0`/текст/`1.5` → 10; отрицательное → 1; `>50` → 50). Только **целые**; дробные → default |
| `offset` | если передан непустой — целое `max(0, …)`; дробные/мусор → **0**; иначе из `page` |
| `page` | только без `offset`: целое `max(1, …)`; дробные/мусор → **1**; `offset` имеет **приоритет** |
| `sortBy` | вне whitelist → **`brand`** |
| `order` | только `asc`/`desc`; иначе → **`asc`** |
| `status` | CSV / повторы; только `available`/`repair`/`sold` (строгий регистр); пустой набор → **без** фильтра |
| `brand` / `model` / `search` | trim; truncate **64**; только пробелы → фильтр **не** применяется |
| UI vs API длина | UI фильтры `maxLength=40`; API до **64** |

### LIKE / метасимволы

`brand`, `model`, `search` → SQL `LIKE %value%` **без** `ESCAPE`. Символы `%` и `_` в query — **wildcard** SQLite (например `brand=%` совпадает со всеми марками). Это учебный факт стенда, не injection через parameterization.

### Формы ошибок API (общие)

| Ситуация | HTTP | Тело |
|----------|------|------|
| Успех списка / нормализация query | **200** | `{ bikes, total, … }` |
| Сбой получения списка (исключение) | **500** | `{ "error": "Ошибка при получении списка" }` |
| Нет / битый cookie на CRUD | **401** | `{ "error": "…" }` |
| Роль не подходит | **403** | `{ "error": "…" }` |
| Валидация тела create/update | **400** | `{ "error": "<message>" }` |
| Байк не найден (PUT/DELETE) | **404** | `{ "error": "Bike not found" }` |

Ошибки — объект с полем **`error`** (строка), без массива field-errors.

### Авторизация

| Метод | Auth | Роли | Примечание |
|-------|------|------|------------|
| GET /bikes | Опционально | public | Без cookie — 200; невалидный cookie — **200**, cookie сброшена |
| GET /auth/me | Да | — | Невалидный cookie — **401** |
| POST /bikes | Да | mechanic, admin | |
| PUT /bikes/:id | Да | mechanic, admin | |
| DELETE /bikes/:id | Да | admin | |

---

## 7. Намеренные баги (QA-стенд)

| ID | Описание | Фактическое поведение | Тест |
|----|----------|----------------------|------|
| BUG-01 | Фильтр «Ремонт» ≠ «В ремонте» в таблице | Расхождение текста | TC-FILTER-* |
| BUG-02 | Марка `TEST` + модель `123` | `form-server-error`: «Ошибка безопасности: Ваша роль [guest] не позволяет создавать тестовые записи» | TC-BIKE-NEG-10 |
| BUG-03 | Границы **года выпуска** | Ошибка на **1989** и **(текущий+1)**; **1988** и **(текущий+2)** проходят. Текст верхней ошибки: «Год не может быть позже **{текущий год}**» (не `{текущий+1}`) | TC-BIKE-NEG-06…09 |

**Целевой диапазон года (в требованиях):** 1990 … (текущий год + 1). BUG-03 — намеренное отклонение на ±1 от границы (когда срабатывает ошибка). Текст сообщения при верхней ошибке всегда называет **текущий календарный год**.
