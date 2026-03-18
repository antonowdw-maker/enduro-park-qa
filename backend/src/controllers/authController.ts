import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
// Секретный ключ для подписи паспорта (в реале прячется в .env)
const JWT_SECRET = 'super-secret-key-for-qa-benchmarking';

/**
 * КОНТРОЛЛЕР АВТОРИЗАЦИИ
 * Логика входа, выхода и проверки личности.
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // 1. Ищем пользователя в SQLite
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      return res.status(401).json({ error: 'Пользователь не найден' });
    }

    // 2. Сверяем присланный пароль с хешем в базе
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Неверный пароль' });
    }

    // 3. Создаем JWT-токен (паспорт)
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // 4. Отправляем токен в защищенной куке (httpOnly)
    // Это значит, что JavaScript на фронте не сможет его прочитать (защита от XSS)
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // Включаем true только для HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 часа
    });

    // Возвращаем инфо о пользователе (без пароля!)
    res.json({ 
      message: 'Успешный вход', 
      user: { username: user.username, role: user.role } 
    });

  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера при авторизации' });
  }
};

// Выход из системы (просто удаляем куку)
export const logout = (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Вы успешно вышли' });
};