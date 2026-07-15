import { Router } from 'express';
import { login, logout, me } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';
import { loginRateLimit } from '../middleware/loginRateLimit';
import { issueCsrf } from '../middleware/csrf';
import { validateBody } from '../middleware/validateBody';
import { loginBodySchema } from '../schemas/dto';

const router = Router();

/**
 * МАРШРУТЫ АВТОРИЗАЦИИ
 * GET  /api/auth/csrf   — выдать CSRF (волна G)
 * POST /api/auth/login  — вход (публичный, без CSRF)
 * POST /api/auth/logout — выход (нужен CSRF)
 * GET  /api/auth/me     — текущий пользователь (нужна валидная cookie)
 */

router.get('/csrf', issueCsrf);
router.post('/login', loginRateLimit, validateBody(loginBodySchema), login);
router.post('/logout', logout);
router.get('/me', authenticate, me);

export default router;
