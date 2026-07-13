import { Router } from 'express';
import { login, logout, me } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';
import { loginRateLimit } from '../middleware/loginRateLimit';

const router = Router();

/**
 * МАРШРУТЫ АВТОРИЗАЦИИ
 * POST /api/auth/login  — вход (публичный)
 * POST /api/auth/logout — выход (публичный)
 * GET  /api/auth/me     — текущий пользователь (нужна валидная cookie)
 */

router.post('/login', loginRateLimit, login);
router.post('/logout', logout);
router.get('/me', authenticate, me);

export default router;
