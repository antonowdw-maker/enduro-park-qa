import type { RequestHandler } from 'express';
import type { ZodSchema } from 'zod';

/**
 * Парсинг и валидация req.body через Zod (.strip() — лишние поля отбрасываем).
 */
export function validateBody<T>(schema: ZodSchema<T>): RequestHandler {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      const message = first?.message || 'Ошибка валидации';
      return res.status(400).json({ error: message });
    }
    req.body = parsed.data;
    return next();
  };
}
