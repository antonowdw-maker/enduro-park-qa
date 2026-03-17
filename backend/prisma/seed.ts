import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs'; // Библиотека для шифрования паролей

const prisma = new PrismaClient();

async function main() {
  // 1. Очищаем базу перед заполнением (чтобы не было дублей при перезапуске)
  await prisma.user.deleteMany();
  await prisma.bike.deleteMany();

  // 2. Создаем зашифрованный пароль 'admin123' для всех тестовых юзеров
  const hashedSharedPassword = await bcrypt.hash('admin123', 10);

  // 3. Создаем пользователей с разными ролями
  await prisma.user.createMany({
    data: [
      { username: 'admin', passwordHash: hashedSharedPassword, role: 'admin' },
      { username: 'mechanic', passwordHash: hashedSharedPassword, role: 'mechanic' },
      { username: 'guest', passwordHash: hashedSharedPassword, role: 'guest' },
    ],
  });

  // 4. Создаем 10 байков (тестовый набор для фильтров и сортировок)
  await prisma.bike.createMany({
        data: [
      { brand: 'KTM', model: '300 EXC', year: 2023, vin: 'KTM2023SAMPLE0001', mileage: 45, status: 'available', lastService: new Date() },
      { brand: 'Honda', model: 'CRF450R', year: 2021, vin: 'HONDA2021SAMPLE02', mileage: 120, status: 'repair', lastService: new Date() },
      { brand: 'Husqvarna', model: 'TE300', year: 2022, vin: 'HUSQ2022SAMPLE003', mileage: 80, status: 'available', lastService: new Date() },
      { brand: 'Yamaha', model: 'YZ250F', year: 2020, vin: 'YAMA2020SAMPLE004', mileage: 210, status: 'sold', lastService: new Date() },
      { brand: 'Beta', model: 'RR300', year: 2023, vin: 'BETA2023SAMPLE005', mileage: 15, status: 'available', lastService: new Date() },
      { brand: 'GasGas', model: 'EC300', year: 2022, vin: 'GASG2022SAMPLE006', mileage: 65, status: 'repair', lastService: new Date() },
      { brand: 'Sherco', model: 'SE300', year: 2021, vin: 'SHER2021SAMPLE007', mileage: 140, status: 'available', lastService: new Date() },
      { brand: 'KTM', model: '500 EXC-F', year: 1995, vin: 'KTM1995OLDIE00008', mileage: 5000, status: 'repair', lastService: new Date() },
      { brand: 'Honda', model: 'XR650R', year: 2005, vin: 'HONDA2005LEGEND09', mileage: 1500, status: 'available', lastService: new Date() },
      { brand: 'Kawasaki', model: 'KX450', year: 2024, vin: 'KAWA2024NEWBIE010', mileage: 0, status: 'available', lastService: new Date() },
    ],
  });

  console.log('✅ База успешно наполнена: 3 пользователя и 10 байков.');
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
