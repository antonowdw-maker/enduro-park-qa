import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'qa-secret';

export const generateToken = (userId: string, role: string) => {
  // Создаем токен на 24 часа. Для тестов это идеальное время.
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '24h' });
};