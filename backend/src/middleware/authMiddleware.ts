import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'super-secret-key-for-qa-benchmarking';

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
      
      // Теперь req.user легален и типизирован
      req.user = decoded;

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