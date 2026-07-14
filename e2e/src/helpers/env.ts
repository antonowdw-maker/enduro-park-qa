import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

/** Абсолютный путь к корню монорепо (e2e/src/helpers → ../../..) */
export const REPO_ROOT = path.resolve(__dirname, '../../..');
export const BACKEND_DIR = path.join(REPO_ROOT, 'backend');
export const FRONTEND_DIR = path.join(REPO_ROOT, 'frontend');

/**
 * Читает backend/.env (пароли seed, JWT).
 * В тестах пароли НЕ хардкодим — только из окружения.
 */
export function loadBackendEnv(): void {
  const envPath = path.join(BACKEND_DIR, '.env');
  if (!fs.existsSync(envPath)) {
    throw new Error(
      `Нет файла ${envPath}. Скопируйте backend/.env.example → backend/.env и заполните пароли.`,
    );
  }
  dotenv.config({ path: envPath });
}

/** Обязательная переменная из env или понятная ошибка */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Переменная ${name} пуста. Проверьте backend/.env`);
  }
  return value.trim();
}

/** Базовый URL UI (Vite). Переопределяется BASE_URL в CI. */
export function getBaseUrl(): string {
  return process.env.BASE_URL?.trim() || 'http://localhost:5173';
}

/** Учётки seed для E2E */
export function getSeedCredentials() {
  loadBackendEnv();
  return {
    admin: {
      username: 'admin',
      password: requireEnv('SEED_ADMIN_PASSWORD'),
    },
    mechanic: {
      username: 'mechanic',
      password: requireEnv('SEED_MECHANIC_PASSWORD'),
    },
  };
}
