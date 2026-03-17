import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs'; // Библиотека для шифрования паролей

const prisma = new PrismaClient();

async function main() {
  // Очищаем старые данные
  await prisma.user.deleteMany();
  await prisma.bike.deleteMany();

  const hashedSharedPassword = await bcrypt.hash('admin123', 10);

  // Создаем пользователей (как и раньше)
  await prisma.user.createMany({
    data: [
      { username: 'admin', passwordHash: hashedSharedPassword, role: 'admin' },
      { username: 'mechanic', passwordHash: hashedSharedPassword, role: 'mechanic' },
      { username: 'guest', passwordHash: hashedSharedPassword, role: 'guest' },
    ],
  });

  // Генератор случайных байков для тестов пагинации и поиска
  const brands = ['KTM', 'Honda', 'Yamaha', 'Husqvarna', 'Beta', 'GasGas', 'Sherco', 'Kawasaki', 'Suzuki', 'BMW'];
  const models = ['300 EXC', 'CRF450R', 'YZ250F', 'TE300', 'RR300', 'EC300', 'SE300', 'KX450', 'RM-Z450', 'R1250GS'];
  const statuses = ['available', 'repair', 'sold'];

  const testBikes = [];

  for (let i = 1; i <= 50; i++) {
    const brand = brands[Math.floor(Math.random() * brands.length)];
    testBikes.push({
      brand: brand,
      model: models[Math.floor(Math.random() * models.length)],
      year: 1990 + Math.floor(Math.random() * 36), // Года от 1990 до 2026
      vin: `${brand.substring(0, 3).toUpperCase()}${2020 + i}SAMPLE${i.toString().padStart(3, '0')}`, // Ровно 17 символов
      mileage: Math.floor(Math.random() * 5000),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      lastService: new Date(),
    });
  }

  await prisma.bike.createMany({ data: testBikes });

  console.log('✅ База успешно наполнена: 3 пользователя и 50 случайных байков для тестов!');
}

// --- ЭТОТ БЛОК НУЖНО ДОБАВИТЬ В КОНЕЦ ФАЙЛА ---

main()
  .then(async () => {
    // Если всё прошло успешно — отключаемся от базы
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    // Если произошла ошибка — выводим её и выходим с кодом ошибки
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })