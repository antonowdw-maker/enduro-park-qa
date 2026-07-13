import { Request, Response } from 'express';
import { BikeService } from '../services/bikeService';

// Список байков (с фильтрами, сортировкой и пагинацией)
export const getAllBikes = async (req: Request, res: Response) => {
  try {
    const { status, search, page, limit, sortBy, order } = req.query;
    const result = await BikeService.getAllBikes(
      status as string,
      search as string,
      Number(page) || 1,
      Number(limit) || 10,
      sortBy as string,
      order === 'asc' || order === 'desc' ? order : undefined,
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Ошибка при получении списка' });
  }
};

// Создание байка (с передачей роли из токена)
export const createBike = async (req: any, res: Response) => {
  try {
    const userRole = req.user?.role || 'guest';

    const newBike = await BikeService.createBike(req.body, userRole);
    res.status(201).json(newBike);
  } catch (error: any) {
    const statusCode = error.message.includes('роль') ? 403 : 400;
    res.status(statusCode).json({ error: error.message });
  }
};

/** Обновление байка по id (PUT /bikes/:id) */
export const updateBike = async (req: any, res: Response) => {
  try {
    const updated = await BikeService.updateBike(req.params.id, req.body);
    res.json(updated);
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      res.status(404).json({ error: 'Bike not found' });
      return;
    }
    res.status(400).json({ error: error.message });
  }
};

/** Удаление байка по id (DELETE /bikes/:id) */
export const deleteBike = async (req: any, res: Response) => {
  try {
    const userRole = req.user?.role || 'guest';
    await BikeService.deleteBike(req.params.id, userRole);
    res.status(204).send();
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      res.status(404).json({ error: 'Bike not found' });
      return;
    }
    const statusCode = error.message.includes('прав') ? 403 : 400;
    res.status(statusCode).json({ error: error.message });
  }
};