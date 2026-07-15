import { Router } from 'express';
import { getAllBikes, createBike, updateBike, deleteBike } from '../controllers/bikeController';
import { optionalAuthenticate, protect } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validateBody';
import { bikeBodySchema } from '../schemas/dto';

const router = Router();

// GET /api/bikes — список (публичный; невалидный токен → 401)
router.get('/', optionalAuthenticate, getAllBikes);

// POST /api/bikes — создание (mechanic, admin)
router.post('/', protect(['admin', 'mechanic']), validateBody(bikeBodySchema), createBike);

// PUT /api/bikes/:id — редактирование (mechanic, admin)
router.put('/:id', protect(['admin', 'mechanic']), validateBody(bikeBodySchema), updateBike);

// DELETE /api/bikes/:id — удаление (только admin)
router.delete('/:id', protect(['admin']), deleteBike);

export default router;
