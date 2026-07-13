# Системные требования к проекту Enduro Park Manager

**Версия:** 2.1  
**Дата:** 13.07.2026  
**Изменения от v2.0:** убрана роль `guest`; главная страница публична; вход только для изменения данных; VIN редактируем при update; уникальность VIN при create и update.

---

## 2.2 Пользователи системы

| Тип | Описание | Доступ |
|-----|----------|--------|
| **Анонимный посетитель** | Не авторизован | Просмотр таблицы, фильтры, сортировка, пагинация |
| **Механик (mechanic)** | Учётная запись `mechanic` / `admin123` | Просмотр + добавление + редактирование (без удаления) |
| **Администратор (admin)** | Учётная запись `admin` / `admin123` | Полный доступ, включая удаление |

Роль `guest` **удалена** из модели (была избыточна: анонимный просмотр не требует входа).

---

## 4.1 Аутентификация и авторизация

| ID | Требование | Роли | Проверка |
|----|------------|------|----------|
| F-AUTH-01 | Страница `/login` с полями «Имя пользователя» и «Пароль» | public | `input-username`, `input-password` |
| F-AUTH-02 | Успешный вход → httpOnly cookie JWT, редирект на `/` | mechanic, admin | cookie, редирект, `user-username`, `user-role` |
| F-AUTH-03 | Неверные данные → 401, сообщение под формой | public | `login-error-message` |
| F-AUTH-04 | Роли: **mechanic**, **admin** (без guest) | — | middleware на POST/PUT/DELETE |
| F-AUTH-05 | Выход очищает cookie; пользователь остаётся на `/` в режиме просмотра | mechanic, admin | `logout-btn` |
| F-AUTH-06 | Главная `/` **публична**: таблица доступна без cookie | public | TC-AUTH-07 |
| F-AUTH-07 | Кнопка «Войти» на главной для неавторизованных | public | `header-login-btn` → `/login` |
| F-AUTH-08 | Со страницы входа можно вернуться на главную без авторизации | public | `back-to-home-btn` |

---

## 4.2.5 Добавление / Редактирование / Удаление

| ID | Требование | Роли | Проверка |
|----|------------|------|----------|
| F-BIKE-CREATE-01 | «Добавить байк» только для mechanic и admin | mechanic, admin | `add-bike-btn` |
| F-BIKE-CREATE-02 | Модалка с полями модели Bike | mechanic, admin | `input-*`, `select-status` |
| F-BIKE-CREATE-03 | Валидация Zod + сервер; `error-{field}` | mechanic, admin | `error-brand`, `error-vin`, … |
| F-BIKE-CREATE-04 | Успех → строка в таблице, модалка закрыта | mechanic, admin | — |
| F-BIKE-EDIT-01 | «Редактировать» в строке | mechanic, admin | `edit-bike-{vin}` |
| F-BIKE-EDIT-02 | Форма с предзаполненными данными; **VIN редактируем** | mechanic, admin | `input-vin` не readOnly |
| F-BIKE-EDIT-03 | При смене VIN на занятый → ошибка API | mechanic, admin | «Мотоцикл с таким VIN уже существует в базе» |
| F-BIKE-DELETE-01 | «Удалить» только admin | admin | `delete-bike-{vin}` |
| F-BIKE-DELETE-02 | Подтверждение in-app, затем удаление | admin | `delete-confirm-modal` |

**Анонимный пользователь:** кнопки `add-bike-btn`, `edit-bike-*`, `delete-bike-*` **отсутствуют** в DOM; в колонке «Действия» — `actions-readonly-placeholder`.

---

## 5.1 Модель Bike — поле VIN

| Поле | Ограничения |
|------|-------------|
| vin | 17 символов; A–Z, 0–9; без I, O, Q; обязательно буквы **и** цифры; **уникально** в БД |

Уникальность проверяется при **создании** и **обновлении** (ответ 400 с понятным текстом при дубликате).

---

## 5.2 Модель User (seed)

| username | password | role |
|----------|----------|------|
| admin | admin123 | admin |
| mechanic | admin123 | mechanic |

---

## 6.1.2 data-testid (дополнения v2.1)

| Элемент | data-testid |
|---------|-------------|
| Кнопка «Войти» в шапке главной | `header-login-btn` |
| Ссылка «На главную» на странице входа | `back-to-home-btn` |
| Имя пользователя в шапке | `user-username` |
| Роль в шапке | `user-role` |
| Прочерк в «Действия» (без прав) | `actions-readonly-placeholder` |

Удалены из спецификации: `guest-readonly-banner` (роль guest снята).

---

## 6.2 API — мотоциклы

| Метод | Auth | Роли |
|-------|------|------|
| GET /bikes | Нет (v2.1) | public |
| POST /bikes | Да | mechanic, admin |
| PUT /bikes/:id | Да | mechanic, admin |
| DELETE /bikes/:id | Да | admin |

Без cookie на POST/PUT/DELETE → **401** или **403**.
