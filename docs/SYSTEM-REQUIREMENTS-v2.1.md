# Системные требования к проекту Enduro Park Manager

**Версия:** 2.4  
**Дата:** 13.07.2026  
**Изменения от v2.3:** валидация диапазонных фильтров, кнопки очистки, запрет отрицательных значений.

**История:** v2.3 — offset, фильтры год/пробег; v2.2 — валидация, BUG-03, дата ТО; v2.1 — публичная главная, без guest, VIN редактируем; v2.0 — исходный PDF.

---

## 2.2 Пользователи системы

| Тип | Описание | Доступ |
|-----|----------|--------|
| **Анонимный посетитель** | Не авторизован | Просмотр таблицы, фильтры, сортировка, пагинация |
| **Механик (mechanic)** | `mechanic` / `admin123` | Просмотр + добавление + редактирование (без удаления) |
| **Администратор (admin)** | `admin` / `admin123` | Полный доступ, включая удаление |

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
| year | см. BUG-03; целевой диапазон 1990…(текущий+1) | `error-year` |
| vin | 17 символов; A–Z, 0–9; без I/O/Q; буквы **и** цифры; **unique** | `error-vin` |
| mileage | ≥ 0 | `error-mileage` |
| status | available / repair / sold | `error-status` |
| lastService | Формат `YYYY-MM-DD`; **реальная дата**; **≥ 1990-01-01**; **≤ сегодня** | `error-lastService` |
| notes | ≤ 500 символов | `error-notes` |

### F-BIKE-VALID-01: Дата последнего ТО (`lastService`)

- Поле: `input-lastService`, тип `date`, атрибуты `min="1990-01-01"`, `max={сегодня}`.
- Клиент (Zod) и сервер проверяют одинаково.
- Несуществующий день (напр. `2024-02-31`) → «Некорректная дата последнего ТО».
- Дата &lt; 1990-01-01 → «Дата последнего ТО не может быть раньше 1990».
- Дата в будущем → «Дата последнего ТО не может быть в будущем».

### F-BIKE-VALID-02: Ошибки API в модалке

- Любая ошибка сервера при save → `form-server-error` (в т.ч. BUG-02, дубликат VIN).

---

## 5.2 Модель User (seed)

| username | password | role |
|----------|----------|------|
| admin | admin123 | admin |
| mechanic | admin123 | mechanic |

---

## 4.3 Фильтры списка (итерация 8)

| ID | Требование | Роли | Проверка |
|----|------------|------|----------|
| F-FILTER-01 | Фильтр по статусу | public | `filter-all`, `filter-available`, `filter-repair`, `filter-sold` |
| F-FILTER-03 | Год от / до | public | `filter-year-from`, `filter-year-to` |
| F-FILTER-04 | Пробег от / до | public | `filter-mileage-from`, `filter-mileage-to` |
| F-FILTER-05 | Пустое поле диапазона — фильтр не применяется | public | API без соответствующего query-параметра |
| F-FILTER-06 | Сброс всех фильтров (статус + диапазоны) | public | `filter-clear-all` |
| F-FILTER-07 | Очистка отдельного поля | public | `filter-{field}-clear` |
| F-FILTER-08 | «До» ≥ «от» (год и пробег) | public | `error-filter-year-to`, `error-filter-mileage-to`; запрос не уходит при ошибке |
| F-FILTER-09 | Только неотрицательные значения | public | минус не вводится; `error-filter-*` при отрицательном |
| F-FILTER-10 | Год в фильтре — только цифры, **не более 4** | public | `filter-year-from`, `filter-year-to`; `maxLength=4` |

---

## 6.1.2 data-testid

| Элемент | data-testid |
|---------|-------------|
| Войти (шапка) | `header-login-btn` |
| На главную (login) | `back-to-home-btn` |
| Пользователь / роль | `user-username`, `user-role` |
| Нет прав на действия | `actions-readonly-placeholder` |
| Фильтры год/пробег | `filter-year-from`, `filter-year-to`, `filter-mileage-from`, `filter-mileage-to` |
| Очистка фильтров | `filter-clear-all`, `filter-year-from-clear`, `filter-year-to-clear`, `filter-mileage-from-clear`, `filter-mileage-to-clear` |
| Ошибки фильтров | `error-filter-year-from`, `error-filter-year-to`, `error-filter-mileage-from`, `error-filter-mileage-to` |
| Ошибки полей | `error-brand`, `error-model`, `error-year`, `error-vin`, `error-mileage`, `error-status`, `error-lastService`, `error-notes` |
| Ошибка API в форме | `form-server-error` |

---

## 6.2 API — мотоциклы

### GET /bikes — query-параметры

| Параметр | Описание |
|----------|----------|
| `status` | available / repair / sold (пусто — все) |
| `search` | Поиск по марке/модели |
| `yearFrom`, `yearTo` | Диапазон года выпуска (включительно) |
| `mileageFrom`, `mileageTo` | Диапазон пробега (включительно) |
| `sortBy`, `order` | Сортировка (asc/desc) |
| `limit` | 1…50, по умолчанию 10 |
| `offset` | Смещение (приоритет над `page`) |
| `page` | Номер страницы (если `offset` не передан) |

Ответ: `{ bikes, total, limit, offset, page, totalPages, sortBy, order }`.

### Авторизация

| Метод | Auth | Роли | Примечание |
|-------|------|------|------------|
| GET /bikes | Опционально | public | Без cookie — 200; **невалидный** cookie — 401 |
| POST /bikes | Да | mechanic, admin | |
| PUT /bikes/:id | Да | mechanic, admin | |
| DELETE /bikes/:id | Да | admin | |

---

## 7. Намеренные баги (QA-стенд)

| ID | Описание | Фактическое поведение | Тест |
|----|----------|----------------------|------|
| BUG-01 | Фильтр «Ремонт» ≠ «В ремонте» в таблице | Расхождение текста | TC-FILTER-* |
| BUG-02 | Марка `TEST` + модель `123` | `form-server-error`: «Ошибка безопасности: Ваша роль [guest] не позволяет создавать тестовые записи» | TC-BIKE-NEG-10 |
| BUG-03 | Границы **года выпуска** | Ошибка на **1989** и **(текущий+1)**; **1988** и **(текущий+2)** проходят | TC-BIKE-NEG-06…09 |

**Целевой диапазон года (в требованиях):** 1990 … (текущий год + 1). BUG-03 — намеренное отклонение на ±1 от границы.
