/**
 * Печать fingerprint набора байков после seed (для TC-SEED-01).
 * Запуск: npx ts-node --transpile-only prisma/printSeedFingerprint.ts
 */
import { PrismaClient } from '@prisma/client';
import { SEED_FIXTURE_BIKES, SEED_VERSION } from './seedData';

async function main() {
  const prisma = new PrismaClient();
  try {
    const bikes = await prisma.bike.findMany({
      orderBy: { vin: 'asc' },
      select: {
        vin: true,
        brand: true,
        model: true,
        year: true,
        mileage: true,
        status: true,
      },
    });

    const byStatus = { available: 0, repair: 0, sold: 0 };
    for (const bike of bikes) {
      if (bike.status in byStatus) {
        byStatus[bike.status as keyof typeof byStatus] += 1;
      }
    }

    // «Первый VIN» в логе seed — порядок фикстур, не алфавит по VIN
    const firstVin = SEED_FIXTURE_BIKES[0]?.vin ?? '';

    const fingerprint = {
      version: SEED_VERSION,
      total: bikes.length,
      byStatus,
      firstVin,
      rows: bikes.map(
        (bike) =>
          `${bike.vin}|${bike.brand}|${bike.model}|${bike.year}|${bike.mileage}|${bike.status}`,
      ),
    };

    // Одна JSON-строка — парсим в e2e без шума Prisma
    process.stdout.write(`${JSON.stringify(fingerprint)}\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
