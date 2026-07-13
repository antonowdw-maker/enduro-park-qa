import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config';

/**
 * СЕРВИС АВТОРИЗАЦИИ
 * Отвечает за создание JWT-токена (паспорта пользователя).
 */
export const generateToken = (userId: string, username: string, role: string) => {
  // Создаем токен на 24 часа — в payload кладем id, имя и роль
  return jwt.sign({ userId, username, role }, JWT_SECRET, { expiresIn: '24h' });
};
