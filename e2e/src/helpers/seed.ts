import { execSync } from 'child_process';
import { BACKEND_DIR, loadBackendEnv } from './env';

/**
 * Полный сброс SQLite к детерминированному seed.
 * Нужен тестам со счётчиками (19 / 50): CRUD/validation иначе оставляют «грязь».
 */
export function resetDatabaseSeed(): void {
  loadBackendEnv();

  console.log('[e2e seed] prisma db push…');
  execSync('npx prisma db push --skip-generate', {
    cwd: BACKEND_DIR,
    stdio: 'inherit',
    env: process.env,
  });

  console.log('[e2e seed] npm run seed…');
  execSync('npm run seed', {
    cwd: BACKEND_DIR,
    stdio: 'inherit',
    env: process.env,
  });

  console.log('[e2e seed] готово');
}

/** Только `npm run seed` (без db push) — для TC-SEED-01 */
export function runNpmSeed(): void {
  loadBackendEnv();
  execSync('npm run seed', {
    cwd: BACKEND_DIR,
    stdio: 'pipe',
    env: process.env,
  });
}

/** Снимок БД после seed: состав байков + счётчики (TC-SEED-01) */
export type SeedFingerprint = {
  version: string;
  total: number;
  byStatus: { available: number; repair: number; sold: number };
  firstVin: string;
  rows: string[];
};

export function captureSeedFingerprint(): SeedFingerprint {
  loadBackendEnv();
  const raw = execSync('npx ts-node --transpile-only prisma/printSeedFingerprint.ts', {
    cwd: BACKEND_DIR,
    encoding: 'utf8',
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const line = raw
    .trim()
    .split(/\r?\n/)
    .filter((row) => row.startsWith('{'))
    .pop();
  if (!line) {
    throw new Error(`Не удалось прочитать fingerprint seed. stdout:\n${raw}`);
  }
  return JSON.parse(line) as SeedFingerprint;
}

/** Seed + fingerprint (один проход для сравнения) */
export function seedAndCaptureFingerprint(): SeedFingerprint {
  runNpmSeed();
  return captureSeedFingerprint();
}
