import { Router } from 'express';
// Импортируем логику входа и выхода из нашего контроллера
import { login, logout } from '../controllers/authController';

const router = Router();

/**
 * МАРШРУТЫ АВТОРИЗАЦИИ
 * POST /api/auth/login  - для входа
 * POST /api/auth/logout - для выхода
 */

// QA-Кейс: проверить, что метод именно POST (безопасная передача пароля)
router.post('/login', login);
router.post('/logout', logout);

export default router;