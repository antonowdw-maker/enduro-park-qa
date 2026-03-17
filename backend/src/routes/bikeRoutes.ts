import { Router } from 'express';
// Добавь createBike в фигурные скобки ниже:
import { getAllBikes, createBike } from '../controllers/bikeController'; 

const router = Router();

// GET /api/bikes — получить все байки
router.get('/', getAllBikes);
router.post('/', createBike); // <--- Добавляем возможность создания

export default router;