import rateLimit from 'express-rate-limit';
import type { RequestHandler } from 'express';

/**
 * Лимит попыток входа (волна G): ВКЛЮЧЁН по умолчанию.
 * Для CI / Playwright: DISABLE_LOGIN_RATE_LIMIT=true
 * (legacy: ENABLE_LOGIN_RATE_LIMIT=false тоже отключает).
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много попыток входа. Повторите через 15 минут.' },
});

function isLoginRateLimitDisabled(): boolean {
  if (process.env.DISABLE_LOGIN_RATE_LIMIT === 'true') return true;
  // обратная совместимость с CI до волны G
  if (process.env.ENABLE_LOGIN_RATE_LIMIT === 'false') return true;
  return false;
}

export const loginRateLimit: RequestHandler = (req, res, next) => {
  if (isLoginRateLimitDisabled()) {
    return next();
  }
  return limiter(req, res, next);
};
