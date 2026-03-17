import { Router } from 'express';
import { login } from '../controllers/authController'; // Импортируем логику

const router = Router();

// Теперь роут чистый: он просто говорит "на этот адрес — этот контроллер"
router.post('/login', login);

export default router;