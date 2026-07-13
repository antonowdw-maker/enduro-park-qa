import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config';

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