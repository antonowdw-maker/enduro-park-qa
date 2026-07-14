import { resetDatabaseSeed } from './src/helpers/seed';

/**
 * globalSetup: перед всем прогоном — схема БД + детерминированный seed.
 */
async function globalSetup() {
  resetDatabaseSeed();
}

export default globalSetup;
