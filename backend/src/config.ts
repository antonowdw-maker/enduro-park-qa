import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

/** Пароли, которые нельзя использовать даже на стенде */
const WEAK_PASSWORDS = new Set([
  'admin123',
  'password',
  'password123',
  '12345678',
  '123456789',
  'qwerty123',
  'change_me',
  'changeme',
  'secret',
  'admin',
  'mechanic',
]);

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Не задана переменная ${name}. Скопируйте backend/.env.example → backend/.env и заполните значения.`,
    );
  }
  return value;
}

/** Проверка сложности пароля для seed */
export function assertStrongPassword(password: string, label: string): void {
  if (password.length < 12) {
    throw new Error(`${label}: минимум 12 символов (задайте в .env).`);
  }
  if (WEAK_PASSWORDS.has(password.toLowerCase())) {
    throw new Error(`${label}: слишком простой пароль. Задайте уникальный пароль в .env.`);
  }
}

function loadJwtSecret(): string {
  const secret = requireEnv('JWT_SECRET');
  if (secret.length < 32) {
    throw new Error('JWT_SECRET: минимум 32 символа. Сгенерируйте: openssl rand -base64 48');
  }
  if (WEAK_PASSWORDS.has(secret.toLowerCase()) || secret.includes('qa-benchmark') || secret.includes('head-qa')) {
    throw new Error('JWT_SECRET: используйте случайную строку, не тестовый placeholder.');
  }
  return secret;
}

/** Валидация конфигурации при старте сервера или seed */
export function validateAppConfig(): void {
  loadJwtSecret();
}

/** Пароли для npm run seed */
export function getSeedPasswords(): { adminPassword: string; mechanicPassword: string } {
  validateAppConfig();

  const adminPassword = requireEnv('SEED_ADMIN_PASSWORD');
  const mechanicPassword = requireEnv('SEED_MECHANIC_PASSWORD');

  assertStrongPassword(adminPassword, 'SEED_ADMIN_PASSWORD');
  assertStrongPassword(mechanicPassword, 'SEED_MECHANIC_PASSWORD');

  return { adminPassword, mechanicPassword };
}

export const JWT_SECRET = loadJwtSecret();

export const CORS_ORIGIN = process.env.CORS_ORIGIN?.trim() || 'http://localhost:5173';

export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
