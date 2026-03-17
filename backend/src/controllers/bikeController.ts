import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllBikes = async (req: Request, res: Response) => {
  try {
    // Тянем все байки из базы данных
    const bikes = await prisma.bike.findMany();
    res.json(bikes);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении списка байков' });
  }
};