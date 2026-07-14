import { execSync } from 'child_process';
import { BACKEND_DIR, loadBackendEnv } from './src/helpers/env';

/**
 * globalSetup: перед всем прогоном поднимаем схему БД и детерминированный seed.
 * Так CRUD-тесты не наследуют грязное состояние от прошлого запуска.
 */
async function globalSetup() {
  loadBackendEnv();

  console.log('[e2e globalSetup] prisma db push…');
  // --skip-generate: не трогаем query engine, если backend уже запущен (Windows EPERM)
  execSync('npx prisma db push --skip-generate', {
    cwd: BACKEND_DIR,
    stdio: 'inherit',
    env: process.env,
  });

  console.log('[e2e globalSetup] npm run seed…');
  execSync('npm run seed', {
    cwd: BACKEND_DIR,
    stdio: 'inherit',
    env: process.env,
  });

  console.log('[e2e globalSetup] готово');
}

export default globalSetup;
