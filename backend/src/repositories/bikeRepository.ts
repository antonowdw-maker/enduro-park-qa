import { Prisma, PrismaClient, Bike } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Преобразует ошибки Prisma в понятные сообщения для UI.
 * P2002 — нарушение уникальности (например, дубликат VIN).
 */
function handlePrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    const fields = error.meta?.target as string[] | undefined;
    if (fields?.includes('vin')) {
      throw new Error('Мотоцикл с таким VIN уже существует в базе');
    }
    throw new Error('Такая запись уже существует');
  }
  throw error;
}

/** Поля, для которых сортировка должна быть без учёта регистра (SQLite BINARY по умолчанию) */
const CASE_INSENSITIVE_SORT_FIELDS = ['brand', 'model', 'vin', 'status'] as const;

/** Собирает SQL-условие WHERE из фильтров списка */
function buildWhereSql(filters?: {
  statuses?: string[];
  search?: string;
  brand?: string;
  model?: string;
  yearFrom?: number;
  yearTo?: number;
  mileageFrom?: number;
  mileageTo?: number;
}): Prisma.Sql {
  const conditions: Prisma.Sql[] = [];

  if (filters?.statuses && filters.statuses.length > 0) {
    conditions.push(
      Prisma.sql`status IN (${Prisma.join(filters.statuses.map((s) => Prisma.sql`${s}`))})`,
    );
  }
  if (filters?.search) {
    const pattern = `%${filters.search}%`;
    conditions.push(Prisma.sql`(brand LIKE ${pattern} OR model LIKE ${pattern})`);
  }
  if (filters?.brand) {
    const pattern = `%${filters.brand}%`;
    conditions.push(Prisma.sql`brand LIKE ${pattern}`);
  }
  if (filters?.model) {
    const pattern = `%${filters.model}%`;
    conditions.push(Prisma.sql`model LIKE ${pattern}`);
  }
  if (filters?.yearFrom !== undefined) {
    conditions.push(Prisma.sql`year >= ${filters.yearFrom}`);
  }
  if (filters?.yearTo !== undefined) {
    conditions.push(Prisma.sql`year <= ${filters.yearTo}`);
  }
  if (filters?.mileageFrom !== undefined) {
    conditions.push(Prisma.sql`mileage >= ${filters.mileageFrom}`);
  }
  if (filters?.mileageTo !== undefined) {
    conditions.push(Prisma.sql`mileage <= ${filters.mileageTo}`);
  }

  return conditions.length > 0 ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}` : Prisma.empty;
}

/**
 * РЕПОЗИТОРИЙ БАЙКОВ
 * Слой прямой работы с базой данных SQLite.
 */
export const BikeRepository = {
  /**
   * Поиск байков с фильтрами, сортировкой и пагинацией
   * @param filters - объект с параметрами поиска
   */
  async findAll(filters?: {
    statuses?: string[];
    search?: string;
    brand?: string;
    model?: string;
    yearFrom?: number;
    yearTo?: number;
    mileageFrom?: number;
    mileageTo?: number;
    page?: number;
    limit?: number;
    offset?: number;
    sortBy?: string;
    order?: 'asc' | 'desc';
  }) {
    const limit = filters?.limit || 10;
    const offset = filters?.offset ?? (Math.max(1, filters?.page || 1) - 1) * limit;
    const page = Math.floor(offset / limit) + 1;

    // Белый список полей для сортировки (F-SORT-01)
    const allowedSortFields = ['brand', 'model', 'year', 'vin', 'mileage', 'status', 'lastService'] as const;
    // По умолчанию — марка по возрастанию (TC-SORT-01, согласовано с заказчиком)
    const sortField = allowedSortFields.includes(filters?.sortBy as typeof allowedSortFields[number])
      ? filters!.sortBy!
      : 'brand';
    const sortOrder = filters?.order === 'desc' ? 'desc' : 'asc';

    const whereSql = buildWhereSql(filters);
    const orderDir = sortOrder === 'asc' ? Prisma.sql`ASC` : Prisma.sql`DESC`;

    // Для текстовых колонок — LOWER(), иначе «test121» окажется выше «YZ250F»
    const orderClause = CASE_INSENSITIVE_SORT_FIELDS.includes(
      sortField as (typeof CASE_INSENSITIVE_SORT_FIELDS)[number],
    )
      ? Prisma.sql`ORDER BY LOWER(${Prisma.raw(sortField)}) ${orderDir}`
      : Prisma.sql`ORDER BY ${Prisma.raw(sortField)} ${orderDir}`;

    const countResult = await prisma.$queryRaw<[{ count: bigint }]>(
      Prisma.sql`SELECT COUNT(*) as count FROM Bike ${whereSql}`,
    );
    const total = Number(countResult[0].count);

    const bikes = await prisma.$queryRaw<Bike[]>(
      Prisma.sql`SELECT * FROM Bike ${whereSql} ${orderClause} LIMIT ${limit} OFFSET ${offset}`,
    );

    return {
      bikes,
      total,
      page,
      limit,
      offset,
      totalPages: Math.ceil(total / limit),
      sortBy: sortField,
      order: sortOrder,
    };
  },

  // Найти один байк по ID
  async findById(id: string) {
    return await prisma.bike.findUnique({ where: { id } });
  },

  // Создать новую запись
  async create(data: any) {
    try {
      return await prisma.bike.create({ data });
    } catch (error) {
      handlePrismaError(error);
    }
  },

  // Обновить существующую запись по id
  async update(id: string, data: any) {
    try {
      return await prisma.bike.update({ where: { id }, data });
    } catch (error) {
      handlePrismaError(error);
    }
  },

  // Удалить байк
  async delete(id: string) {
    return await prisma.bike.delete({ where: { id } });
  },
};