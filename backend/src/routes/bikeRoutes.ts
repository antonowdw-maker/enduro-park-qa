import { Router } from 'express';
import { getAllBikes, createBike, updateBike, deleteBike } from '../controllers/bikeController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// GET /api/bikes — список (пока без auth, итерация 8)
router.get('/', getAllBikes);

// POST /api/bikes — создание (mechanic, admin)
router.post('/', protect(['admin', 'mechanic']), createBike);

// PUT /api/bikes/:id — редактирование (mechanic, admin)
router.put('/:id', protect(['admin', 'mechanic']), updateBike);

// DELETE /api/bikes/:id — удаление (только admin)
router.delete('/:id', protect(['admin']), deleteBike);

export default router;