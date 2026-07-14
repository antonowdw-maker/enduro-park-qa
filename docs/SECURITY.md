# Безопасность QA-стенда

Стенд **открытый** (публичный репозиторий, возможен публичный URL). Секреты **не хранятся в git**.

## Первый запуск (локально)

1. `cp backend/.env.example backend/.env`
2. Заполните в `.env`:
   - `JWT_SECRET` — случайная строка ≥ 32 символов (`openssl rand -base64 48`)
   - `SEED_ADMIN_PASSWORD`, `SEED_MECHANIC_PASSWORD` — ≥ 12 символов, **не** `admin123` и подобные
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
| (Опционально) `ENABLE_LOGIN_RATE_LIMIT=true` | Защита от перебора на публичном URL; **не включать** для CI/Playwright |
| Сменить `JWT_SECRET` если старый светился в git | Старые сессии недействительны |

## GitHub Actions (E2E)

Воркфлоу `.github/workflows/e2e.yml` **сам генерирует** `JWT_SECRET` и пароли seed на каждый job (в `backend/.env`).  
Отдельные GitHub Secrets для локальных паролей **не обязательны**. Не коммитьте `.env`.

## Что сделано в коде

- `.env` в `.gitignore`, в репо только `.env.example`
- Старт сервера и seed **падают** без валидного `JWT_SECRET` и паролей seed
- Блок слабых паролей (`admin123`, `password`, …)
- Rate limit на login — **опционально** (`ENABLE_LOGIN_RATE_LIMIT=true` только на публичном деплое; для Playwright выключен)
- Пароли в БД — bcrypt; в логах seed пароли не выводятся

## Если репозиторий уже был публичным со старыми секретами

1. Сгенерируйте новые `JWT_SECRET` и пароли seed  
2. Задеплойте с новыми secrets  
3. `npm run seed`  
4. (Опционально) удалить секреты из истории git — `git filter-repo` / BFG
