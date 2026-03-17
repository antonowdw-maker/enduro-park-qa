import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.bike.createMany({
    data: [
      { brand: 'KTM', model: '300 EXC', year: 2023, vin: 'KTM12345678901234', mileage: 50, status: 'available', lastService: new Date() },
      { brand: 'Honda', model: 'CRF450R', year: 2021, vin: 'HONDA987654321098', mileage: 120, status: 'repair', lastService: new Date() }
    ]
  });
  console.log('✅ Данные успешно добавлены!');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());