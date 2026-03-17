import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * РЕПОЗИТОРИЙ БАЙКОВ
 * Слой прямой работы с SQLite через Prisma.
 */
export const BikeRepository = {
  /**
   * Найти все байки с опциональным фильтром по статусу
   * @param status - строка 'available', 'repair' или 'sold'
   */
  async findAll(status?: string) {
    // Если статус передан, добавляем условие where, иначе возвращаем всё
    return await prisma.bike.findMany({
      where: status ? { status: status } : {},
      orderBy: { createdAt: 'desc' } // Свежие байки всегда сверху
    });
  },

  // Найти один байк по ID
  async findById(id: string) {
    return await prisma.bike.findUnique({ where: { id } });
  },

  // Создать новую запись в базе
  async create(data: any) {
    return await prisma.bike.create({ data });
  },

  // Удалить байк (для будущих тестов прав доступа)
  async delete(id: string) {
    return await prisma.bike.delete({ where: { id } });
  }
};
