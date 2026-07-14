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
