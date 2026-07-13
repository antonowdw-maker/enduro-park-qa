import { Request, Response } from 'express';
import { BikeService } from '../services/bikeService';

/** Приводит query-параметр Express к скалярному значению */
function queryScalar(value: unknown): string | number | undefined {
  if (Array.isArray(value)) {
    return value[0] as string | undefined;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }
  return undefined;
}

/** Парсит опциональное число из query (пустое — фильтр не применяется) */
function parseOptionalInt(value: unknown): number | undefined {
  const scalar = queryScalar(value);
  if (scalar === undefined || scalar === '') {
    return undefined;
  }
  const num = Number(scalar);
  return Number.isNaN(num) ? undefined : num;
}

/** limit/offset для пагинации (поддержка page для обратной совместимости) */
function resolvePagination(query: {
  page?: string | number;
  limit?: string | number;
  offset?: string | number;
}) {
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));

  let offset: number;
  if (query.offset !== undefined && query.offset !== '') {
    offset = Math.max(0, Number(query.offset) || 0);
  } else {
    const page = Math.max(1, Number(query.page) || 1);
    offset = (page - 1) * limit;
  }

  const page = Math.floor(offset / limit) + 1;
  return { limit, offset, page };
}

// Список байков (с фильтрами, сортировкой и пагинацией)
export const getAllBikes = async (req: Request, res: Response) => {
  try {
    const {
      status,
      search,
      page,
      limit,
      offset,
      sortBy,
      order,
      yearFrom,
      yearTo,
      mileageFrom,
      mileageTo,
    } = req.query;

    const pagination = resolvePagination({
      page: queryScalar(page),
      limit: queryScalar(limit),
      offset: queryScalar(offset),
    });

    const result = await BikeService.getAllBikes({
      status: status as string,
      search: search as string,
      ...pagination,
      sortBy: sortBy as string,
      order: order === 'asc' || order === 'desc' ? order : undefined,
      yearFrom: parseOptionalInt(yearFrom),
      yearTo: parseOptionalInt(yearTo),
      mileageFrom: parseOptionalInt(mileageFrom),
      mileageTo: parseOptionalInt(mileageTo),
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Ошибка при получении списка' });
  }
};

// Создание байка (с передачей роли из токена)
export const createBike = async (req: any, res: Response) => {
  try {
    const userRole = req.user!.role;

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
    const userRole = req.user!.role;
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
