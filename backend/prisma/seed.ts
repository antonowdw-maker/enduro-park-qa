import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { buildDeterministicBikes, getSeedSummary, SEED_BIKE_COUNT } from './seedData';

const prisma = new PrismaClient();

async function main() {
  await prisma.user.deleteMany();
  await prisma.bike.deleteMany();

  const hashedSharedPassword = await bcrypt.hash('admin123', 10);

  await prisma.user.createMany({
    data: [
      { username: 'admin', passwordHash: hashedSharedPassword, role: 'admin' },
      { username: 'mechanic', passwordHash: hashedSharedPassword, role: 'mechanic' },
    ],
  });

  const bikes = buildDeterministicBikes();
  await prisma.bike.createMany({ data: bikes });

  const summary = getSeedSummary(bikes);
  console.log('✅ Seed завершён (детерминированный набор):');
  console.log(`   версия: ${summary.version}`);
  console.log(`   пользователи: admin, mechanic (admin123)`);
  console.log(`   байки: ${summary.total} (available=${summary.byStatus.available}, repair=${summary.byStatus.repair}, sold=${summary.byStatus.sold})`);
  console.log(`   первый VIN: ${summary.firstVin}`);
  console.log(`   якорные VIN: ${summary.fixtureVins.join(', ')}`);

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
