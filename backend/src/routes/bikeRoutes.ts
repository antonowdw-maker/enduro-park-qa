import { Router } from 'express';
import { getAllBikes, createBike } from '../controllers/bikeController';

const router = Router();

// GET /api/bikes — получить все байки
router.get('/', getAllBikes); // Показать всех
router.post('/', createBike); // Создать нового

export default router;