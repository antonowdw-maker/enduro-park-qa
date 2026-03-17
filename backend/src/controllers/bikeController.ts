import { Request, Response } from 'express';
import { BikeService } from '../services/bikeService'; // Импортируем наш Сервис

/**
 * КОНТРОЛЛЕР БАЙКОВ
 * Он только принимает запрос и отдает ответ.
 * Вся логика теперь спрятана в BikeService.
 */

// 1. Получить все байки
export const getAllBikes = async (req: Request, res: Response) => {
  try {
    const bikes = await BikeService.getAllBikes();
    res.json(bikes);
  } catch (error: any) {
    // Если что-то пошло не так, отдаем 500 ошибку
    res.status(500).json({ error: 'Ошибка при получении списка байков' });
  }
};

// 2. Создать байк
export const createBike = async (req: Request, res: Response) => {
  try {
    const newBike = await BikeService.createBike(req.body);
    // 201 - объект успешно создан
    res.status(201).json(newBike);
  } catch (error: any) {
    // ВАЖНО ДЛЯ QA: Если Сервис выкинет ошибку (например, год < 1990), 
    // она попадет сюда, и мы отдадим 400 (Bad Request) с текстом ошибки.
    res.status(400).json({ error: error.message });
  }
};
