import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * РЕПОЗИТОРИЙ БАЙКОВ
 * Слой прямой работы с базой данных SQLite.
 */
export const BikeRepository = {
  /**
   * Поиск байков с фильтрами и пагинацией
   * @param filters - объект с параметрами поиска
   */
  async findAll(filters?: { status?: string, search?: string, page?: number, limit?: number }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit; // Рассчитываем, сколько записей пропустить

    // Условие фильтрации (вынесено в переменную, чтобы использовать дважды)
    const whereClause = {
      status: (filters?.status && filters.status !== 'all') ? filters.status : undefined,
      OR: filters?.search ? [
        { brand: { contains: filters.search } },
        { model: { contains: filters.search } }
      ] : undefined
    };

    // 1. Считаем ОБЩЕЕ количество байков (нужно для расчета страниц на фронте)
    const total = await prisma.bike.count({ where: whereClause });

    // 2. Получаем только нужную "порцию" байков
    const bikes = await prisma.bike.findMany({
      where: whereClause,
      skip: skip,
      take: limit,
      orderBy: { year: 'desc' } // Свежие байки всегда сверху
    });

    // Возвращаем объект со всеми данными для QA-тестов
    return {
      bikes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  },

  // Найти один байк по ID
  async findById(id: string) {
    return await prisma.bike.findUnique({ where: { id } });
  },

  // Создать новую запись
  async create(data: any) {
    return await prisma.bike.create({ data });
  },

  // Удалить байк
  async delete(id: string) {
    return await prisma.bike.delete({ where: { id } });
  }
};