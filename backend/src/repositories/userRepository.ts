import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Репозиторий пользователей (слой данных для auth) */
export const UserRepository = {
  async findByUsername(username: string) {
    return prisma.user.findUnique({ where: { username } });
  },
};
