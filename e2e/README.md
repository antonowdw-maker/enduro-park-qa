# E2E — Enduro Park Manager (Playwright + TypeScript)

Автотесты в отдельном пакете `e2e/` (итерация 10).

## Требования

1. Заполнен `backend/.env` (пароли seed) — см. корневой README / `docs/SECURITY.md`
2. Установлены зависимости backend и frontend
3. В этой папке: `npm install` и `npm run install:browsers`

## Команды

```bash
cd e2e
npm install
npm run install:browsers
npm test              # весь набор
npm run test:smoke    # только auth.spec
npm run test:headed   # с окном браузера
npm run test:ui       # Playwright UI mode
```

Перед прогоном `globalSetup` делает `prisma db push` + `npm run seed` в `backend/`.
`webServer` поднимает backend (:5000) и frontend (:5173), если они ещё не запущены.

## Практики

- Локаторы: `data-testid` через Page Object (`src/pages/`)
- Пароли: только из `backend/.env`, не в git
- Якорные VIN: `src/data/seed-vins.ts`
- Имена тестов = ID ручных ТК (`TC-AUTH-01`); после волны — пометка в `docs/MANUAL-TEST-CASES-v1.2.md`
- Демо с замедлением: `$env:SLOW_MO='900'; npx playwright test --headed`
