import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { buildDeterministicBikes, getSeedSummary, SEED_BIKE_COUNT } from './seedData';
import { getSeedPasswords } from '../src/config';

const prisma = new PrismaClient();

async function main() {
  const { adminPassword, mechanicPassword } = getSeedPasswords();

  await prisma.user.deleteMany();
  await prisma.bike.deleteMany();

  const [adminHash, mechanicHash] = await Promise.all([
    bcrypt.hash(adminPassword, 10),
    bcrypt.hash(mechanicPassword, 10),
  ]);

  await prisma.user.createMany({
    data: [
      { username: 'admin', passwordHash: adminHash, role: 'admin' },
      { username: 'mechanic', passwordHash: mechanicHash, role: 'mechanic' },
    ],
  });

  const bikes = buildDeterministicBikes();
  await prisma.bike.createMany({ data: bikes });

  const summary = getSeedSummary(bikes);
  console.log('✅ Seed завершён (детерминированный набор):');
  console.log(`   версия: ${summary.version}`);
  console.log(`   пользователи: admin, mechanic (пароли из .env — не логируются)`);
  console.log(`   байки: ${summary.total} (available=${summary.byStatus.available}, repair=${summary.byStatus.repair}, sold=${summary.byStatus.sold})`);
  console.log(`   первый VIN: ${summary.firstVin}`);

  if (bikes.length !== SEED_BIKE_COUNT) {
    throw new Error(`Ожидалось ${SEED_BIKE_COUNT} байков, получено ${bikes.length}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
