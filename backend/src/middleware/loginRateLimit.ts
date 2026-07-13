import rateLimit from 'express-rate-limit';
import type { RequestHandler } from 'express';

/**
 * Опциональный лимит попыток входа.
 * По умолчанию ВЫКЛЮЧЕН — не мешает Playwright и многократному логину в автотестах.
 * На публичном деплое: ENABLE_LOGIN_RATE_LIMIT=true в secrets хостинга.
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много попыток входа. Повторите через 15 минут.' },
});

export const loginRateLimit: RequestHandler = (req, res, next) => {
  if (process.env.ENABLE_LOGIN_RATE_LIMIT !== 'true') {
    return next();
  }
  return limiter(req, res, next);
};
