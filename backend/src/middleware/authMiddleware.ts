import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, IS_PRODUCTION } from '../config';

/** Опции для сброса cookie (должны совпадать с установкой при login) */
const CLEAR_TOKEN_COOKIE = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: 'lax' as const,
};

/**
 * Расширяем стандартный тип запроса Express, 
 * чтобы добавить туда поле user (которое мы достанем из токена).
 */
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    username: string;
    role: string;
  };
}

/**
 * MIDDLEWARE: ПРОВЕРКА ТОКЕНА (без проверки роли)
 * Используется для /auth/me — достаточно просто быть залогиненным.
 */
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Достаем токен из cookie
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Расшифровываем JWT и кладем данные пользователя в req.user
    const decoded: any = jwt.verify(token, JWT_SECRET);
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

/**
 * Опциональная авторизация для GET /bikes:
 * без cookie — публичный просмотр;
 * невалидный/устаревший токен — очищаем cookie и всё равно отдаём список (главная публична).
 */
export const optionalAuthenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies.token;

  if (!token) {
    return next();
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);

    if (decoded.role === 'guest') {
      res.clearCookie('token', CLEAR_TOKEN_COOKIE);
      return next();
    }

    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
    };
    next();
  } catch {
    // Старый JWT (напр. после смены JWT_SECRET) — не блокируем публичный просмотр
    res.clearCookie('token', CLEAR_TOKEN_COOKIE);
    next();
  }
};

/**
 * MIDDLEWARE ЗАЩИТЫ (ОХРАННИК)
 */
export const protect = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // Достаем токен из кук
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: 'Доступ запрещен: авторизуйтесь' });
    }

    try {
      // Проверяем токен
      const decoded: any = jwt.verify(token, JWT_SECRET);
      
      req.user = {
        userId: decoded.userId,
        username: decoded.username,
        role: decoded.role,
      };

      // Проверка роли
      if (!allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ 
          error: `Доступ запрещен. Ваша роль: ${decoded.role}. Требуется: ${allowedRoles.join('/')}` 
        });
      }

      next();
    } catch (err) {
      return res.status(401).json({ error: 'Токен невалиден или просрочен' });
    }
  };
};