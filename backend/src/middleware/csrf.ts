import crypto from 'crypto';
import type { RequestHandler } from 'express';
import { Response } from 'express';
import { IS_PRODUCTION } from '../config';

export const CSRF_COOKIE = 'csrf';
export const CSRF_HEADER = 'x-csrf-token';

const CSRF_COOKIE_OPTIONS = {
  httpOnly: false, // double-submit: Axios читает cookie
  secure: IS_PRODUCTION,
  sameSite: 'lax' as const,
  maxAge: 24 * 60 * 60 * 1000,
  path: '/',
};

function timingSafeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Выдать CSRF cookie + токен в теле (GET /api/auth/csrf) */
export function issueCsrf(_req: unknown, res: Response) {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie(CSRF_COOKIE, token, CSRF_COOKIE_OPTIONS);
  res.status(200).json({ csrfToken: token });
}

/**
 * Double-submit CSRF для мутаций.
 * Пропуск: GET/HEAD/OPTIONS; /api/auth/login; /api/auth/csrf;
 * DISABLE_CSRF=true — только аварийный bypass.
 */
export const csrfProtection: RequestHandler = (req, res, next) => {
  if (process.env.DISABLE_CSRF === 'true') {
    return next();
  }

  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return next();
  }

  const url = req.originalUrl.split('?')[0];
  if (url === '/api/auth/login' || url === '/api/auth/csrf') {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.get(CSRF_HEADER) || req.get('X-CSRF-Token');

  if (
    typeof cookieToken !== 'string' ||
    typeof headerToken !== 'string' ||
    !cookieToken ||
    !headerToken ||
    !timingSafeEqualString(cookieToken, headerToken)
  ) {
    return res.status(403).json({ error: 'Неверный или отсутствующий CSRF-токен' });
  }

  return next();
};
