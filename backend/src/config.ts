/**
 * ОБЩИЕ НАСТРОЙКИ БЭКЕНДА
 * Здесь хранятся константы, которые используются в разных модулях.
 * Важно: JWT_SECRET должен быть одинаковым везде (контроллер, middleware, сервис).
 */
export const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-qa-benchmarking';
