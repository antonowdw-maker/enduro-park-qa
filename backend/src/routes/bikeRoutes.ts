import { Router } from 'express';
import { getAllBikes } from '../controllers/bikeController';

const router = Router();

// GET /api/bikes — получить все байки
router.get('/', getAllBikes);

export default router;