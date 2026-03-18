import { Request, Response } from 'express';
import { BikeService } from '../services/bikeService';

// Список байков
export const getAllBikes = async (req: Request, res: Response) => {
  try {
    const { status, search, page, limit } = req.query;
    const result = await BikeService.getAllBikes(
      status as string, 
      search as string, 
      Number(page) || 1, 
      Number(limit) || 10
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Ошибка при получении списка' });
  }
};

// Создание байка (с передачей роли из токена)
export const createBike = async (req: any, res: Response) => {
  try {
    // Роль берется из Middleware (req.user.role)
    const userRole = req.user?.role || 'guest';
    
    const newBike = await BikeService.createBike(req.body, userRole);
    res.status(201).json(newBike);
  } catch (error: any) {
    // Если в тексте ошибки есть слово "роль", шлем 403 (Forbidden)
    const statusCode = error.message.includes('роль') ? 403 : 400;
    res.status(statusCode).json({ error: error.message });
  }
};