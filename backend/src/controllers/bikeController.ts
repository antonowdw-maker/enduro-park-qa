import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Получение списка всех байков (для GET запроса)
export const getAllBikes = async (req: Request, res: Response) => {
  try {
    // Тянем все записи из таблицы Bike в SQLite
    const bikes = await prisma.bike.findMany();
    res.json(bikes);
  } catch (error) {
    // В случае ошибки возвращаем 500 статус (кейс для негативного теста)
    res.status(500).json({ error: 'Ошибка сервера при получении списка' });
  }
};

// Создание нового байка (для POST запроса)
export const createBike = async (req: Request, res: Response) => {
  try {
    const { brand, model, year, vin, mileage, status } = req.body;
    
    // Создаем запись в БД. Важно: Prisma сама проверит уникальность VIN
    const newBike = await prisma.bike.create({
      data: {
        brand,
        model,
        year: Number(year), // Преобразуем в число для БД
        vin,
        mileage: Number(mileage),
        status,
        lastService: new Date() // Устанавливаем текущую дату ТО
      }
    });
    
    // Возвращаем 201 статус — объект успешно создан
    res.status(201).json(newBike);
  } catch (error) {
    // Если VIN дублируется, БД выдаст ошибку, и мы вернем 400
    res.status(400).json({ error: 'Ошибка: VIN должен быть уникальным' });
  }
};
