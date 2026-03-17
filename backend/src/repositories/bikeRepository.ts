import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * РЕПОЗИТОРИЙ БАЙКОВ
 * Здесь только "чистая" работа с базой данных.
 * QA-кейс: если база упадет, ошибка возникнет именно здесь.
 */
export const BikeRepository = {
  // Найти все байки в базе
  async findAll() {
    return await prisma.bike.findMany();
  },

  // Найти один байк по его ID
  async findById(id: string) {
    return await prisma.bike.findUnique({ where: { id } });
  },

  // Сохранить новый байк в базу
  async create(data: any) {
    return await prisma.bike.create({ data });
  },

  // Удалить байк из базы
  async delete(id: string) {
    return await prisma.bike.delete({ where: { id } });
  }
};
