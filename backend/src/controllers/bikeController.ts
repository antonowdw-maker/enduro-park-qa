import { Request, Response } from 'express';
import { BikeService } from '../services/bikeService';

/**
 * КОНТРОЛЛЕР БАЙКОВ
 * Слой обработки HTTP-запросов и возврата JSON-ответов.
 */

// 1. Получить список байков (теперь с пагинацией и поиском)
// URL пример: /api/bikes?status=repair&search=KTM&page=2&limit=10
export const getAllBikes = async (req: Request, res: Response) => {
  try {
    // Извлекаем параметры из Query String (адресной строки)
    const { status, search, page, limit } = req.query;
    
    // Передаем всё в Сервис. Числа из URL приходят строками, 
    // поэтому мы явно превращаем их в Number через Number() или +
    const result = await BikeService.getAllBikes(
      status as string, 
      search as string, 
      Number(page) || 1,    // Если страница не указана, берем 1-ю
      Number(limit) || 10   // Если лимит не указан, берем по 10 штук
    );
    
    // Возвращаем объект { bikes, total, page, limit, totalPages }
    res.json(result);
  } catch (error: any) {
    // 500 - ошибка сервера (кейс для негативного тестирования)
    res.status(500).json({ error: 'Ошибка сервера при получении списка байков' });
  }
};

// 2. Создать байк (остается без изменений)
export const createBike = async (req: Request, res: Response) => {
  try {
    const newBike = await BikeService.createBike(req.body);
    res.status(201).json(newBike);
  } catch (error: any) {
    // 400 - ошибка валидации (не прошел проверку в Сервисе)
    res.status(400).json({ error: error.message });
  }
};