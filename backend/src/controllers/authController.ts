import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/authMiddleware';
import { generateToken } from '../services/authService';

const prisma = new PrismaClient();

// Настройки cookie для JWT (требование F-AUTH-02: httpOnly + SameSite)
const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,       // JavaScript в браузере не может прочитать токен (защита от XSS)
  secure: false,        // true только для HTTPS в продакшне
  sameSite: 'lax' as const,
  maxAge: 24 * 60 * 60 * 1000, // 24 часа
};

/**
 * КОНТРОЛЛЕР АВТОРИЗАЦИИ
 * Логика входа, выхода и проверки текущей сессии.
 */

// POST /api/auth/login — вход в систему
export const login = async (req: AuthRequest, res: Response) => {
  try {
    const { username, password } = req.body;

    // 1. Ищем пользователя в базе SQLite
    const user = await prisma.user.findUnique({ where: { username } });

    // 2. Не раскрываем, что именно неверно (логин или пароль) — единое сообщение (F-AUTH-03)
    if (!user) {
      return res.status(401).json({ error: 'Неверные учётные данные' });
    }

    // 3. Сверяем присланный пароль с хешем в базе
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Неверные учётные данные' });
    }

    // Роль guest снята в v2.1 — старые записи в БД не принимаем
    if (user.role === 'guest') {
      return res.status(401).json({ error: 'Неверные учётные данные' });
    }

    // 4. Создаем JWT и отправляем в защищенной cookie
    const token = generateToken(user.id, user.username, user.role);
    res.cookie('token', token, AUTH_COOKIE_OPTIONS);

    // 5. Возвращаем данные пользователя (без пароля!) — формат по спецификации API
    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
    });
  } catch {
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
