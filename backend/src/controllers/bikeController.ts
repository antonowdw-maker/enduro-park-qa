import { Request, Response } from 'express';
import { BikeService } from '../services/bikeService';

/**
 * КОНТРОЛЛЕР БАЙКОВ
 * Обрабатывает HTTP-запросы и возвращает JSON-ответы.
 */

// Получить список байков (поддерживает ?status=...)
export const getAllBikes = async (req: Request, res: Response) => {
  try {
    // Извлекаем статус из Query String: /api/bikes?status=repair
    const { status } = req.query;
    
    // Запрашиваем данные у сервиса, приводя статус к строке
    const bikes = await BikeService.getAllBikes(status as string);
    
    // Возвращаем результат QA-инструментам или фронтенду
    res.json(bikes);
  } catch (error: any) {
    res.status(500).json({ error: 'Ошибка сервера при получении списка байков' });
  }
};

// Создать новый байк
export const createBike = async (req: Request, res: Response) => {
  try {
    const newBike = await BikeService.createBike(req.body);
    res.status(201).json(newBike);
  } catch (error: any) {
    // Возвращаем 400 ошибку, если не прошли правила в Сервисе
    res.status(400).json({ error: error.message });
  }
};
