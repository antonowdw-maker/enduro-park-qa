import { Router } from 'express';
import { getAllBikes, createBike } from '../controllers/bikeController';
// Импортируем нашего "Охранника"
import { protect } from '../middleware/authMiddleware';

const router = Router();

// 1. GET /api/bikes - Доступно ВСЕМ (даже гостям без логина)
router.get('/', getAllBikes);

/**
 * 2. POST /api/bikes - Доступно ТОЛЬКО авторизованным пользователям
 * с ролями 'admin' или 'mechanic'.
 * 
 * QA-Кейс: попробуй отправить этот запрос без логина или под ролью 'guest'
 * Ожидаемый результат: Ошибка 401 или 403.
 */
router.post('/', protect(['admin', 'mechanic']), createBike);

export default router;