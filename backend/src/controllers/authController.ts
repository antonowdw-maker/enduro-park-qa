import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { AuthError, AuthService } from '../services/authService';
import { IS_PRODUCTION } from '../config';

// Настройки cookie для JWT (требование F-AUTH-02: httpOnly + SameSite)
const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: 'lax' as const,
  maxAge: 24 * 60 * 60 * 1000,
};

/**
 * КОНТРОЛЛЕР АВТОРИЗАЦИИ
 * HTTP-слой: cookie, статусы ответа. Бизнес-логика — в AuthService.
 */

// POST /api/auth/login — вход в систему
export const login = async (req: AuthRequest, res: Response) => {
  try {
    const { username, password } = req.body;
    const user = await AuthService.login(username, password);
    const token = AuthService.generateToken(user.id, user.username, user.role);
    res.cookie('token', token, AUTH_COOKIE_OPTIONS);
    res.json(user);
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    res.status(500).json({ error: 'Ошибка сервера при авторизации' });
  }
};

// POST /api/auth/logout — выход из системы (удаляем cookie)
export const logout = (_req: AuthRequest, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
};

// GET /api/auth/me — получить текущего пользователя по cookie (для восстановления сессии после F5)
export const me = (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Старая сессия guest — сбрасываем (роль удалена в v2.1)
  if (req.user.role === 'guest') {
    res.clearCookie('token');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  res.json({
    id: req.user.userId,
    username: req.user.username,
    role: req.user.role,
  });
};
