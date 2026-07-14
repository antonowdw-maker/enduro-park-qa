import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config';
import { UserRepository } from '../repositories/userRepository';

/** Публичные данные пользователя без пароля (ответ login / me) */
export type AuthUserPublic = {
  id: string;
  username: string;
  role: string;
};

/** Ошибка входа — всегда один текст (F-AUTH-03) */
export class AuthError extends Error {
  readonly statusCode = 401;

  constructor(message = 'Неверные учётные данные') {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * СЕРВИС АВТОРИЗАЦИИ
 * Бизнес-логика входа и выпуск JWT. HTTP/cookie — в контроллере.
 */
export const AuthService = {
  /** Создаёт JWT на 24 часа (id, username, role) */
  generateToken(userId: string, username: string, role: string) {
    return jwt.sign({ userId, username, role }, JWT_SECRET, { expiresIn: '24h' });
  },

  /**
   * Проверка логина/пароля.
   * Не раскрывает, что именно неверно; роль guest отклоняется.
   */
  async login(username: string, password: string): Promise<AuthUserPublic> {
    const user = await UserRepository.findByUsername(username);

    if (!user) {
      throw new AuthError();
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AuthError();
    }

    // Роль guest снята в v2.1 — старые записи в БД не принимаем
    if (user.role === 'guest') {
      throw new AuthError();
    }

    return {
      id: user.id,
      username: user.username,
      role: user.role,
    };
  },
};
