# Ручные тест-кейсы Enduro Park Manager (QA-Stand)

**Версия:** 1.9  
**Дата:** 15.07.2026  
**Изменения от v1.8:** волны C–D — API query ТТД, CRUD/Auth API, lifecycle; TL-hotfix (целая пагинация, fingerprint).  
**Изменения от v1.7:** seed-каталог modern — TC-SEED-05…07 (Kayo, Regulmoto, Motoland).  
**Изменения от v1.6:** фильтр марка/модель — TC-FILTER-BRAND-*, TC-FILTER-MODEL-*, TC-FILTER-BRAND-MODEL-01.  
**14.07.2026 (+волна A):** TC-SEED-01 и TC-AUTH-01 httpOnly закрыты автотестами.  
**14.07.2026:** текст NEG-08 / `error-year` — «позже {текущий год}»; VIN I/O/Q → отдельное сообщение (не «17 символов»); TC-SORT/PAGINATION; пере-seed в E2E.

**История:** v1.9 — API волны C–D; v1.8 — каталог seed modern; v1.7 — фильтр марка/модель (+ТТД UI/API); v1.5 — валидация фильтров; v1.4 — offset, фильтры год/пробег; v1.3 — негативная валидация, BUG-03, дата ТО; v1.2 — публичная главная, без guest, VIN edit; v1.1 — исходный PDF.

**Трассировка автотестов:** после каждой волны Playwright помечаем ТК ниже строкой `🤖 Автотест:` (файл + итерация). Ручной прогон таких ТК — по желанию / регрессия UI.

---

## 1. Аутентификация

### TC-AUTH-01: Вход под admin
**Предусловия:** seed; в `.env` задан `SEED_ADMIN_PASSWORD`.  
**Шаги:** `/login` → `admin` + пароль из `.env` → «Войти».  
**Ожидание:** `/`; `user-username`=admin; `user-role`=admin; `logout-btn`; httpOnly cookie.  
🤖 **Автотест:** `e2e/tests/auth.spec.ts` (UI + cookie.httpOnly) и `e2e/tests/auth-api.spec.ts` (Set-Cookie HttpOnly) — волна A.

### TC-AUTH-02: Вход под mechanic
**Данные:** `mechanic` + `SEED_MECHANIC_PASSWORD` из `.env`.  
**Ожидание:** как TC-AUTH-01, role=mechanic.  
🤖 **Автотест:** `e2e/tests/roles.spec.ts` → «TC-ROLE-02 / TC-AUTH-02» (итерация 10.2).

### ~~TC-AUTH-03~~ — **УДАЛЁН** (роль guest снята)

### TC-AUTH-04: Неверный пароль
**Данные:** admin / wrongpassword.  
**Ожидание:** `/login`; `login-error-message`; нет cookie.  
🤖 **Автотест:** `e2e/tests/auth.spec.ts` → «TC-AUTH-04» (итерация 10.1).

### TC-AUTH-05: Несуществующий пользователь
**Данные:** unknown / anypassword.  
**Ожидание:** как TC-AUTH-04.  
🤖 **Автотест:** `e2e/tests/auth-extra.spec.ts` (итерация 10.6).

### TC-AUTH-06: Выход
**Предусловия:** залогинен.  
**Шаги:** `logout-btn`.  
**Ожидание:** cookie очищена; `/`; `header-login-btn`.  
🤖 **Автотест:** `e2e/tests/auth-extra.spec.ts` (UI, 10.6); API lifecycle — `auth-api.spec.ts` → TC-AUTH-API-LIFECYCLE-01 (волна D).

### TC-AUTH-API-LIFECYCLE-01: login → /me → logout → /me
**Шаги:** POST login → GET `/auth/me` → POST logout → GET `/auth/me` без cookie.  
**Ожидание:** 200 → 200 → 200 + clear Set-Cookie → 401; replay старого JWT на `/me` → **200** (не ревок).  
🤖 **Автотест:** `e2e/tests/auth-api.spec.ts` (волна D).

### TC-AUTH-07: Главная без авторизации
**Предусловия:** cookies очищены.  
**Шаги:** `http://localhost:5173/`.  
**Ожидание:** нет редиректа на login; таблица; `header-login-btn`; нет `add-bike-btn`.  
🤖 **Автотест:** `e2e/tests/roles.spec.ts` → «TC-ROLE-01 / TC-AUTH-07» (итерация 10.2).

### TC-AUTH-08: GET /bikes без cookie
**Шаги:** GET `/api/bikes` без cookie.  
**Ожидание:** 200, список байков.  
🤖 **Автотест:** `e2e/tests/auth-api.spec.ts` (итерация 10.6).

### TC-AUTH-10: Невалидный cookie на GET /bikes
**Шаги:** в браузере cookie `token=invalid` → GET `/api/bikes`.  
**Ожидание:** **200**, список байков; cookie `token` **удалена** (публичная главная не блокируется).  
🤖 **Автотест:** `e2e/tests/auth-api.spec.ts` (итерация 10.6).

### TC-AUTH-11: Невалидный cookie на GET /auth/me
**Шаги:** cookie `token=invalid` → GET `/api/auth/me`.  
**Ожидание:** **401** Unauthorized.  
🤖 **Автотест:** `e2e/tests/auth-api.spec.ts` (итерация 10.6).

### TC-AUTH-09: Возврат с login на главную
**Шаги:** `/login` → `back-to-home-btn`.  
**Ожидание:** `/`, таблица без входа.  
🤖 **Автотест:** `e2e/tests/auth-extra.spec.ts` (итерация 10.6).

---

## 2. Роли и доступ

### TC-ROLE-01: Аноним не видит CRUD
**Шаги:** `/` без входа.  
**Ожидание:** нет add/edit/delete; `actions-readonly-placeholder`.  
🤖 **Автотест:** `e2e/tests/roles.spec.ts` (итерация 10.2).

### TC-ROLE-02: Mechanic — add + edit, без delete
**Ожидание:** `add-bike-btn`, `edit-bike-*`; нет `delete-bike-*`.  
🤖 **Автотест:** `e2e/tests/roles.spec.ts` (итерация 10.2).

### TC-ROLE-03: Admin — полный доступ
**Ожидание:** add, edit, delete.  
🤖 **Автотест:** `e2e/tests/roles.spec.ts` (итерация 10.2).

### TC-ROLE-04: Mechanic DELETE API → 403
**Ожидание:** 403; байк в базе.  
🤖 **Автотест:** `e2e/tests/roles-api.spec.ts` (итерация 10.3).

### TC-ROLE-05: POST без cookie → 401
**Ожидание:** 401; байк не создан.  
🤖 **Автотест:** `e2e/tests/roles-api.spec.ts` (итерация 10.3).

### TC-ROLE-06: Admin DELETE API → 204
**Ожидание:** 204; байк удалён.  
🤖 **Автотест:** `e2e/tests/roles-api.spec.ts` (итерация 10.3).

---

## 3. VIN при редактировании

### TC-BIKE-EDIT-VIN-01: Успешная смена VIN
**Ожидание:** новый VIN в таблице; `edit-bike-{новый_vin}`.  
🤖 **Автотест:** `e2e/tests/validation.spec.ts` (итерация 10.5).

### TC-BIKE-EDIT-VIN-02: Дубликат VIN при edit
**Ожидание:** `form-server-error` про дубликат VIN.  
🤖 **Автотест:** `e2e/tests/validation.spec.ts` (итерация 10.5).

### TC-BIKE-CREATE-VIN-01: Дубликат VIN при create
**Ожидание:** то же сообщение.  
🤖 **Автотест:** `e2e/tests/crud.spec.ts` (итерация 10.3; повторный create своего VIN — seed VIN содержит `Q`, фронт режет до API).

---

## 3.1 CRUD smoke (добавлено с автотестами 10.3)

### TC-BIKE-CREATE: Успешное добавление байка
**Ожидание:** модалка → валидные поля → строка `bike-row-{vin}` в таблице.  
🤖 **Автотест:** `e2e/tests/crud.spec.ts` (итерация 10.3).

### TC-BIKE-EDIT: Редактирование заметок
**Ожидание:** edit → смена notes → текст в строке.  
🤖 **Автотест:** `e2e/tests/crud.spec.ts` (итерация 10.3).

### TC-BIKE-DELETE: Удаление с подтверждением
**Ожидание:** delete → `delete-confirm-modal` → строка исчезла.  
🤖 **Автотест:** `e2e/tests/crud.spec.ts` (итерация 10.3).

---

## 4. Негативная валидация формы (итерация 7)

### TC-BIKE-NEG-01: Пустая марка
**Ожидание:** `error-brand`: «Минимум 2 символа для марки».  
🤖 **Автотест:** `e2e/tests/crud.spec.ts` (итерация 10.3; 1 символ).

### TC-BIKE-NEG-02: Пустая модель
**Ожидание:** `error-model`: «Модель обязательна».  
🤖 **Автотест:** `e2e/tests/validation.spec.ts` (итерация 10.5).

### TC-BIKE-NEG-03: VIN короче 17
**Данные:** VIN = `ABC123`.  
**Ожидание:** `error-vin`: «VIN должен содержать ровно 17 символов».  
🤖 **Автотест:** `e2e/tests/validation.spec.ts` (итерация 10.5).

### TC-BIKE-NEG-04: VIN только цифры
**Ожидание:** `error-vin`: «VIN должен содержать и буквы, и цифры».  
🤖 **Автотест:** `e2e/tests/validation.spec.ts` (итерация 10.5).

### TC-BIKE-NEG-04b: VIN с запрещённой буквой (I/O/Q)
**Данные:** 17 символов с **Q** (или I/O), напр. `KTM2020QA0000001A`.  
**Ожидание:** `error-vin`: «VIN: нельзя использовать буквы I, O, Q» (не путать с «ровно 17 символов»).  
🤖 **Автотест:** `e2e/tests/validation.spec.ts` (14.07.2026).

### TC-BIKE-NEG-05: Отрицательный пробег
**Данные:** пробег = -1.  
**Ожидание:** `error-mileage`: «Пробег не может быть отрицательным числом».  
🤖 **Автотест:** `e2e/tests/validation.spec.ts` (итерация 10.5).

### TC-BIKE-NEG-06: BUG-03 — год 1989 (ошибка)
**Ожидание:** `error-year`: «Год выпуска не может быть раньше 1990».  
🤖 **Автотест:** `e2e/tests/known-bugs.spec.ts` (итерация 10.3; корректная граница — зелёный).

### TC-BIKE-NEG-07: BUG-03 — год 1988 (баг, проходит)
**Ожидание (факт):** ошибки нет, сохранение возможно.  
🤖 **Автотест (правильные ожидания):** `e2e/tests/known-bugs.spec.ts` — expect error + `test.fail()` (итерация 10.3).

### TC-BIKE-NEG-08: BUG-03 — год текущий+1 (ошибка)
**Предусловия:** текущий год 2026; год = 2027.  
**Ожидание:** `error-year`: «Год не может быть позже **2026**» (в тексте — *текущий* год, не введённый current+1).  
🤖 **Автотест:** `e2e/tests/validation.spec.ts` (итерация 10.5; текст поправлен 14.07.2026).

### TC-BIKE-NEG-09: BUG-03 — год текущий+2 (баг, проходит)
**Предусловия:** текущий год 2026; год = 2028.  
**Ожидание (факт):** ошибки нет, сохранение возможно.  
🤖 **Автотест (правильные ожидания):** `e2e/tests/known-bugs.spec.ts` + `test.fail()` (итерация 10.3).

### TC-BIKE-NEG-10: BUG-02 — TEST / 123
**Данные:** марка = `TEST`, модель = `123`, остальное валидно.  
**Ожидание:** `form-server-error`: «Ошибка безопасности: Ваша роль [guest] не позволяет создавать тестовые записи»; байк не создан.  
🤖 **Автотест (правильные ожидания):** create должен пройти + `test.fail()` (итерация 10.3).

### TC-BIKE-NEG-11: Дата ТО раньше 1990
**Данные:** `input-lastService` = `1989-12-31`.  
**Ожидание:** `error-lastService`: «Дата последнего ТО не может быть раньше 1990».  
🤖 **Автотест:** `e2e/tests/validation.spec.ts` (итерация 10.5).

### TC-BIKE-NEG-12: Дата ТО в будущем
**Данные:** завтрашняя дата.  
**Ожидание:** `error-lastService`: «Дата последнего ТО не может быть в будущем».  
🤖 **Автотест:** `e2e/tests/validation.spec.ts` (итерация 10.5).

### TC-BIKE-NEG-13: Несуществующая дата ТО
**Данные:** `2024-02-31`.  
**Ожидание:** `error-lastService`: «Некорректная дата последнего ТО».  
🤖 **Автотест:** `e2e/tests/validation.spec.ts` (итерация 10.5).

### TC-BIKE-LAST-01: Ручной ввод даты ТО с маской
**Шаги:** открыть модалку; в `input-lastService` набрать `20100101`.  
**Ожидание:** значение становится `2010-01-01`; сохранение успешно.  
🤖 **Автотест:** `e2e/tests/crud.spec.ts` (итерация 10.3).

### TC-BIKE-LAST-02: Выбор даты в календаре
**Шаги:** открыть модалку; выбрать дату через `input-lastService-calendar`.  
**Ожидание:** текстовое поле получает ту же `YYYY-MM-DD`; сохранение успешно.  
🤖 **Автотест:** `e2e/tests/validation.spec.ts` (итерация 10.5).

### TC-BIKE-LAST-03: Некорректная дата после маски
**Данные:** в `input-lastService` ввести `15052020` (станет `1505-20-20`).  
**Ожидание:** `error-lastService`: «Некорректная дата последнего ТО».  
🤖 **Автотест:** `e2e/tests/validation.spec.ts` (итерация 10.5).

### TC-BIKE-NEG-14: Граничная валидная дата ТО
**Данные:** `1990-01-01`.  
**Ожидание:** ошибки нет; сохранение успешно.  
🤖 **Автотест:** `e2e/tests/validation.spec.ts` (итерация 10.5).

---

## 6. Фильтры год и пробег (итерация 8)

### TC-FILTER-MULTI-01: Два статуса одновременно
**Шаги:** нажать `filter-available`, затем `filter-repair` (оба подсвечены).  
**Ожидание:** в таблице только байки со статусом «Доступен» и «В ремонте»; «Продан» не показывается.  
🤖 **Автотест:** `e2e/tests/filters.spec.ts` (итерация 10.2).

### TC-FILTER-MULTI-02: Снятие одного статуса
**Предусловия:** активны «Доступен» + «Ремонт».  
**Шаги:** повторный клик `filter-repair`.  
**Ожидание:** остаются только «Доступен».  
🤖 **Автотест:** `e2e/tests/filters.spec.ts` (итерация 10.2).

### TC-FILTER-MULTI-03: «Все» сбрасывает статусы
**Предусловия:** выбран хотя бы один статус.  
**Шаги:** `filter-all`.  
**Ожидание:** полный список (50 байков после seed).  
🤖 **Автотест:** `e2e/tests/filters.spec.ts` (итерация 10.2; проверка по якорным VIN).

### TC-FILTER-YEAR-01: Год от
**Шаги:** `filter-year-from` = 2020.  
**Ожидание:** в таблице только байки с годом ≥ 2020.  
🤖 **Автотест:** `e2e/tests/filters.spec.ts` (итерация 10.2).

### TC-FILTER-YEAR-02: Год до
**Шаги:** `filter-year-to` = 2015.  
**Ожидание:** только байки с годом ≤ 2015.  
🤖 **Автотест:** `e2e/tests/filters.spec.ts` (итерация 10.6).

### TC-FILTER-MILEAGE-01: Пробег от
**Шаги:** `filter-mileage-from` = 50000.  
**Ожидание:** только байки с пробегом ≥ 50000.  
🤖 **Автотест:** `e2e/tests/filters.spec.ts` (итерация 10.6).

### TC-FILTER-MILEAGE-02: Пробег до
**Шаги:** `filter-mileage-to` = 20000.  
**Ожидание:** только байки с пробегом ≤ 20000.  
🤖 **Автотест:** `e2e/tests/filters.spec.ts` (итерация 10.6).

### TC-FILTER-RANGE-01: Пустые диапазоны
**Шаги:** очистить все поля год/пробег.  
**Ожидание:** полный список (как «Все» по статусу).  
🤖 **Автотест:** `e2e/tests/filters.spec.ts` (итерация 10.6).

### TC-API-OFFSET-01: Пагинация через offset
**Шаги:** GET `/api/bikes?limit=10&offset=10`.  
**Ожидание:** 200; `offset`=10; вторая «страница» данных; `total` без изменений.  
🤖 **Автотест:** `e2e/tests/auth-api.spec.ts` (итерация 10.6).

### API query-контракт (волна C) — нормализация, не 4xx

Невалидный query на GET `/api/bikes` → **200** + coerce/drop/truncate (см. SYSTEM-REQUIREMENTS §6.2).

| TC | Суть | Ожидание | Автотест |
|----|------|----------|----------|
| TC-API-LIMIT-01…04 | `limit` abc / 0 / −5 / 100 | 10 / 10 / 1 / 50 | `bikes-query-api.spec.ts` |
| TC-API-OFFSET-02…04 | offset −10 / xyz; приоритет над page | 0; offset=10 при page=1 | то же |
| TC-API-PAGE-01…03 | page 0 / abc / 2 | page 1; offset 10 | то же |
| TC-API-SORT-NEG-01…02 / SORT-01 | sortBy hack; order up / desc | brand+asc; year+asc; year+desc | то же |
| TC-API-STATUS-NEG-* / STATUS-01 | bogus; AVAILABLE; available,bogus | без фильтра; только available | то же |
| TC-API-BRAND-LEN-01…02 | truncate 64 vs 65; длина 40 | одинаковый total; 200 | то же |
| TC-API-MODEL-WS-01 | model пробелы | без фильтра | то же |
| TC-API-LIKE-01…03 | `%` / `_` / `%%` в brand | wildcard → полный seed | то же |

### TC-FILTER-CLEAR-01: Сброс всех фильтров
**Предусловия:** выбран статус «Доступен», заполнены марка и поля год/пробег.  
**Шаги:** `filter-clear-all`.  
**Ожидание:** статус «Все»; марка/модель и диапазоны пусты; полный список.  
🤖 **Автотест:** `e2e/tests/filters.spec.ts` (итерация 10.6 + brand).

### TC-FILTER-CLEAR-02: Очистка одного поля
**Предусловия:** `filter-year-from` = 2020.  
**Шаги:** `filter-year-from-clear`.  
**Ожидание:** поле пустое; фильтр по году «от» не применяется.  
🤖 **Автотест:** `e2e/tests/filters.spec.ts` (итерация 10.6).

### TC-FILTER-VALID-01: Год «до» меньше «от»
**Данные:** год от = 2020, год до = 2015.  
**Ожидание:** `error-filter-year-to`: «Год «до» должен быть не меньше «от»»; запрос не уходит.  
🤖 **Автотест:** `e2e/tests/filters.spec.ts` (итерация 10.6).

### TC-FILTER-VALID-02: Пробег «до» меньше «от»
**Данные:** пробег от = 50000, пробег до = 10000.  
**Ожидание:** `error-filter-mileage-to`; запрос не уходит.  
🤖 **Автотест:** `e2e/tests/filters.spec.ts` (итерация 10.6).

### TC-FILTER-VALID-03: Отрицательное значение
**Шаги:** попытка ввести `-5` в `filter-mileage-from`.  
**Ожидание:** минус не принимается; значение не меняется.  
🤖 **Автотест:** `e2e/tests/filters.spec.ts` (итерация 10.6).

### TC-FILTER-VALID-04: Год — не более 4 цифр
**Шаги:** попытка ввести `12345` в `filter-year-from`.  
**Ожидание:** пятая цифра не принимается; в поле остаётся `1234`.  
🤖 **Автотест:** `e2e/tests/filters.spec.ts` (итерация 10.6).

### TC-FILTER-BRAND-01: Фильтр по марке KTM
**Предусловия:** свежий seed, лимит 50.  
**Шаги:** ввести `KTM` в `filter-brand`.  
**Ожидание:** есть `bike-row-KTM2020QA00000001`; нет Honda/Yamaha якорей.  
🤖 **Автотест:** `e2e/tests/filters.spec.ts`.

### TC-FILTER-MODEL-01: Фильтр по модели EXC
**Шаги:** ввести `EXC` в `filter-model`.  
**Ожидание:** есть якорь KTM 300 EXC; Honda CRF не видна.  
🤖 **Автотест:** `e2e/tests/filters.spec.ts`.

### TC-FILTER-BRAND-MODEL-01: Марка + модель вместе
**Шаги:** `filter-brand` = `Honda`, `filter-model` = `CRF`.  
**Ожидание:** есть `bike-row-HON2015QA00000002`; KTM якорь скрыт.  
🤖 **Автотест:** `e2e/tests/filters.spec.ts`.

### TC-FILTER-BRAND-02: Очистка filter-brand-clear
**Шаги:** ввести `Yamaha` в `filter-brand` → клик `filter-brand-clear`.  
**Ожидание:** поле пустое; якорь KTM снова виден.  
🤖 **Автотест:** `e2e/tests/filters.spec.ts`.

### Матрица ТТД: марка / модель (позитив / негатив / границы / комбинации)

| TC | Техника | Суть | Автотест |
|----|---------|------|----------|
| TC-FILTER-BRAND-03 | EP подстрока | `ond` → Honda | `filters-brand-model.spec.ts` |
| TC-FILTER-BRAND-04 | EP регистр | `ktm` → якорь KTM | UI + API |
| TC-FILTER-MODEL-02 | EP подстрока | `YZ250` → Yamaha | UI |
| TC-FILTER-MODEL-03 | очистка | `filter-model-clear` | UI |
| TC-FILTER-BRAND-NEG-01 | EP негатив | нет марки → total 0 | UI + API |
| TC-FILTER-MODEL-NEG-01 | EP негатив | нет модели → total 0 | UI |
| TC-FILTER-BRAND-MODEL-NEG-01 | decision / AND | KTM+CRF → 0 | UI + API |
| TC-FILTER-BRAND-NEG-02 | EP пусто | пробелы → без фильтра | UI + API |
| TC-FILTER-MODEL-NEG-02 | decision | Honda+EXC → 0 | UI |
| TC-FILTER-BRAND-BVA-00 | BVA | 39 символов вводятся | UI |
| TC-FILTER-BRAND-BVA-01 | BVA | maxLength 40 / 41-й отрезан | UI |
| TC-FILTER-BRAND-DT-01…04 | decision table | марка×статус/год, модель×sold | UI |
| TC-FILTER-BRAND-05 / MODEL-04 | EP каталог modern | Kayo / Athlete | UI |
| TC-API-BRAND-* / MODEL-* | API-контракт | query `brand`/`model` (+ Kayo/Athlete) | `filters-brand-model-api.spec.ts` |
| TC-API-LIMIT-* / OFFSET-* / PAGE-* / SORT-* / STATUS-* / LEN-* / LIKE-* | API query ТТД | нормализация + LIKE | `bikes-query-api.spec.ts` |

### API CRUD / Auth глубина (волна D)

| TC | Суть | Ожидание | Автотест |
|----|------|----------|----------|
| TC-API-BIKE-POST-ADMIN/MECHANIC/ANON | create по ролям | 201 / 201 / 401 | `bikes-crud-api.spec.ts` |
| TC-API-BIKE-PUT-* | update + anon + unknown | 200 / 401 / 404 | то же |
| TC-API-BIKE-DELETE-UNKNOWN-01 | DELETE unknown | 404 | то же |
| TC-API-BIKE-DUP-VIN-POST/PUT | duplicate VIN | 400 | то же |
| TC-API-BIKE-INVALID-* | VIN / mileage | 400 `{ error }` | то же |
| TC-API-BIKE-MASS-01 | лишние поля тела | игнор, свой id | то же |
| TC-AUTH-API-LIFECYCLE-01 | login→me→logout→me | 200→200→200→401 | `auth-api.spec.ts` |
| TC-AUTH-API-LOGIN-NEG-01 | неверный пароль | 401 | то же |
| TC-AUTH-RATE-LIMIT-01 | 11-я попытка (opt-in) | 429 | `auth-rate-limit-api.spec.ts` |

---

## 7. Детерминированный seed (итерация 9)

### TC-SEED-01: Повторный seed даёт тот же набор
**Шаги:** `npm run seed` дважды подряд в `backend`.  
**Ожидание:** в логе `версия: 2026.07.14`; `первый VIN: KTM2020QA00000001`; `байки: 50 (available=19, repair=16, sold=15)`.  
🤖 **Автотест:** `e2e/tests/seed.spec.ts` → «TC-SEED-01» (два seed + fingerprint rows; волна A).

### TC-SEED-02: Якорный байк в таблице
**Шаги:** после seed открыть `/`, найти строку `bike-row-KTM2020QA00000001`.  
**Ожидание:** KTM 300 EXC, 2020, 12000 км, статус «Доступен».  
🤖 **Автотест:** `e2e/tests/seed.spec.ts` (итерация 10.6).

### TC-SEED-03: Фильтр по статусу с фиксированным счётчиком
**Предусловия:** свежий seed.  
**Шаги:** `filter-available` → посмотреть «Всего в базе».  
**Ожидание:** **19** записей (при лимите 50 на странице — 19 в таблице).  
🤖 **Автотест:** `e2e/tests/seed.spec.ts` (итерация 10.6).

### TC-SEED-04: Фильтр «Ремонт» находит якорный Honda
**Шаги:** `filter-repair`.  
**Ожидание:** есть `bike-row-HON2015QA00000002`; в таблице статус «В ремонте» (BUG-01).  
🤖 **Автотест:** `e2e/tests/seed.spec.ts` (итерация 10.6).

### TC-SEED-05: Якорный Kayo в каталоге
**Шаги:** после seed, лимит 50 → найти `bike-row-KAY2023QA00000009`; затем `filter-brand` = `Kayo`.  
**Ожидание:** Kayo T2 300, 2023, статус «Доступен»; якорь KTM скрыт после фильтра марки.  
🤖 **Автотест:** `e2e/tests/seed.spec.ts`.

### TC-SEED-06: Якорный Regulmoto в ремонте
**Шаги:** `filter-repair` → `bike-row-REG2022QA00000010`.  
**Ожидание:** Regulmoto Athlete 300.  
🤖 **Автотест:** `e2e/tests/seed.spec.ts`.

### TC-SEED-07: Якорный Motoland продан
**Шаги:** `filter-sold` → `bike-row-MOT2021QA00000011`.  
**Ожидание:** Motoland XT 250 Enduro.  
🤖 **Автотест:** `e2e/tests/seed.spec.ts`.

---

## 8. Сортировка и пагинация UI

### TC-SORT-01: Сортировка по умолчанию — марка ↑
**Ожидание:** первая строка по алфавиту марки (Beta раньше KTM); заголовок `sort-brand` активен.  
🤖 **Автотест:** `e2e/tests/sort-pagination.spec.ts` (после 10.6).

### TC-SORT-02: Сортировка по году asc → desc
**Шаги:** клик `sort-year`, повторный клик `sort-year`.  
**Ожидание:** годы по возрастанию (мин. 1990); после второго клика — по убыванию (макс. ≥ 2026).  
🤖 **Автотест:** `e2e/tests/sort-pagination.spec.ts` (после 10.6).

### TC-SORT-03: Сортировка по пробегу asc → desc
**Шаги:** два клика `sort-mileage`.  
**Ожидание:** asc — мин. 0 км; desc — макс. ≥ 99999 км; порядок монотонный.  
🤖 **Автотест:** `e2e/tests/sort-pagination.spec.ts` (после 10.6).

### TC-PAGINATION-01: Лимит 10 и переход next
**Шаги:** `pagination-limit` = 10 → `pagination-next`.  
**Ожидание:** 10 строк; «СТРАНИЦА 1 ИЗ 5» → «2 ИЗ 5»; на стр. 1 prev disabled; набор VIN меняется.  
🤖 **Автотест:** `e2e/tests/sort-pagination.spec.ts` (после 10.6).

### TC-PAGINATION-02: Prev возвращает на страницу 1
**Ожидание:** после next → prev → снова страница 1, prev disabled.  
🤖 **Автотест:** `e2e/tests/sort-pagination.spec.ts` (после 10.6).

### TC-PAGINATION-03: Лимит 50 при 50 байках — одна страница
**Ожидание:** 50 строк; «1 ИЗ 1»; next disabled.  
🤖 **Автотест:** `e2e/tests/sort-pagination.spec.ts` (после 10.6).

---

## 9. Сохранённые разделы v1.1

Фильтры (BUG-01), CRUD позитивные, cookie — без изменений; testid по v2.2.
