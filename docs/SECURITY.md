# Безопасность QA-стенда

Стенд **открытый** (публичный репозиторий, возможен публичный URL). Секреты **не хранятся в git**.

## Первый запуск (локально)

1. `cp backend/.env.example backend/.env`
2. Заполните в `.env`:
   - `JWT_SECRET` — случайная строка ≥ 32 символов (`openssl rand -base64 48`)
   - `SEED_ADMIN_PASSWORD`, `SEED_MECHANIC_PASSWORD` — ≥ 12 символов, **не** `admin123` и подобные
   - для локального Playwright: `DISABLE_LOGIN_RATE_LIMIT=true` (иначе 429 на многократных login)
3. `cd backend && npm run seed`
4. Логины фиксированы: `admin`, `mechanic`. Пароли — **только из вашего `.env`**.

## Публичный деплой (демо работодателю)

| Правило | Зачем |
|---------|--------|
| Уникальные пароли в secrets платформы (Render, Railway…) | Никто из git не войдёт |
| `NODE_ENV=production`, HTTPS | Cookie `secure`, защита сессии |
| `CORS_ORIGIN` = URL вашего фронта | Чужие сайты не дергают API |
| Пароли работодателю — **в личку**, не в README | Не светить в открытом доступе |
| Перед демо: `npm run seed` | Сброс вандализма в БД |
| **Не** задавать `DISABLE_LOGIN_RATE_LIMIT` на публичном URL | Rate-limit login 10 / 15 мин (волна G — по умолчанию вкл.) |
| **Не** задавать `DISABLE_CSRF` на публичном URL | Double-submit CSRF на cookie-мутациях |
| Сменить `JWT_SECRET` если старый светился в git | Старые сессии недействительны |

## GitHub Actions (E2E)

Воркфлоу `.github/workflows/e2e.yml` **сам генерирует** `JWT_SECRET` и пароли seed на каждый job (в `backend/.env`) и пишет `DISABLE_LOGIN_RATE_LIMIT=true`.  
Отдельные GitHub Secrets для локальных паролей **не обязательны**. Не коммитьте `.env`.

## Что сделано в коде (волна G)

- `.env` в `.gitignore`, в репо только `.env.example`
- Старт сервера и seed **падают** без валидного `JWT_SECRET` и паролей seed
- Блок слабых паролей (`admin123`, `password`, …)
- **Helmet** (базовые security headers; CSP для API выкл.)
- Явный лимит JSON-тела **100kb** → **413**
- `GET /health` (liveness), `GET /ready` (БД)
- Rate limit на login — **включён по умолчанию**; отключение: `DISABLE_LOGIN_RATE_LIMIT=true` (CI / Playwright). Legacy: `ENABLE_LOGIN_RATE_LIMIT=false`
- **CSRF (double-submit):** `GET /api/auth/csrf` → cookie `csrf` (не httpOnly) + `{ csrfToken }`; мутации требуют заголовок `X-CSRF-Token`. Пропуск: login. Bypass: `DISABLE_CSRF=true`
- **Zod/DTO** на login и create/update bike (`.strip()` — mass-assignment); BUG-03 по году сохранён
- Пароли в БД — bcrypt; в логах seed пароли не выводятся
- XSS regression E2E на `notes` (TC-SEC-XSS-01)
- UI CSRF: logout/create проверяют заголовок `X-CSRF-Token` (`security-csrf-ui.spec.ts`)

## Если репозиторий уже был публичным со старыми секретами

1. Сгенерируйте новые `JWT_SECRET` и пароли seed  
2. Задеплойте с новыми secrets  
3. `npm run seed`  
4. (Опционально) удалить секреты из истории git — `git filter-repo` / BFG
