/**
 * Детерминированные тестовые данные (итерация 9 + каталог modern).
 * Повторный `npm run seed` всегда создаёт одинаковый набор из 50 байков.
 */

export const SEED_VERSION = '2026.07.14';
export const SEED_BIKE_COUNT = 50;

/**
 * Каталог марка+модель для генерации (пары, без «Kayo + CRF»).
 * Европейские / японские / китайские эндуро — реалистика стенда и будущего проката.
 */
const CATALOG = [
  { brand: 'KTM', model: '300 EXC' },
  { brand: 'Honda', model: 'CRF450R' },
  { brand: 'Yamaha', model: 'YZ250F' },
  { brand: 'Husqvarna', model: 'TE300' },
  { brand: 'Beta', model: 'RR300' },
  { brand: 'GasGas', model: 'EC300' },
  { brand: 'Sherco', model: 'SE300' },
  { brand: 'Kawasaki', model: 'KX450' },
  { brand: 'Suzuki', model: 'RM-Z450' },
  { brand: 'BMW', model: 'R1250GS' },
  // Китайские / локально популярные эндуро
  { brand: 'Kayo', model: 'T2 300' },
  { brand: 'Regulmoto', model: 'Athlete 300' },
  { brand: 'Motoland', model: 'XT 250 Enduro' },
  { brand: 'GR', model: '7 300 F' },
  { brand: 'Kews', model: 'K16 300' },
  // Доп. европейские / кросс-эндуро
  { brand: 'Fantic', model: 'XXF 250' },
  { brand: 'Rieju', model: 'MR 300' },
  { brand: 'Triumph', model: 'Scrambler 1200' },
] as const;

const STATUSES = ['available', 'repair', 'sold'] as const;

export type SeedBikeInput = {
  brand: string;
  model: string;
  year: number;
  vin: string;
  mileage: number;
  status: string;
  lastService: Date;
  notes: string | null;
};

/** VIN ровно 17 символов: 3 буквы марки + 4 цифры года + «QA» + 8-значный индекс */
export function buildSeedVin(brand: string, year: number, index: number): string {
  const prefix = brand.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3).padEnd(3, 'X');
  const yearStr = String(year).padStart(4, '0');
  const seq = String(index).padStart(8, '0');
  return `${prefix}${yearStr}QA${seq}`.slice(0, 17);
}

/** Фиксированная дата ТО по индексу (без new Date()) */
function buildLastService(index: number): Date {
  const month = index % 12;
  const day = 1 + (index % 28);
  return new Date(Date.UTC(2020 + (index % 5), month, day));
}

/**
 * Якорные байки для ручных ТК — VIN и поля не меняются между прогонами seed.
 * data-testid строки: bike-row-{vin}
 *
 * Индексы 1…8 — исторические якоря (не трогать VIN).
 * Индексы 9…11 — современные китайские (каталог / прокат).
 * Статусы 9–11 подобраны так, чтобы итог остался available=19 / repair=16 / sold=15.
 */
export const SEED_FIXTURE_BIKES: SeedBikeInput[] = [
  {
    brand: 'KTM',
    model: '300 EXC',
    year: 2020,
    vin: 'KTM2020QA00000001',
    mileage: 12000,
    status: 'available',
    lastService: new Date('2024-06-15'),
    notes: 'SEED: фильтр год/пробег',
  },
  {
    brand: 'Honda',
    model: 'CRF450R',
    year: 2015,
    vin: 'HON2015QA00000002',
    mileage: 45000,
    status: 'repair',
    lastService: new Date('2023-11-20'),
    notes: 'SEED: BUG-01 repair',
  },
  {
    brand: 'Yamaha',
    model: 'YZ250F',
    year: 2018,
    vin: 'YAM2018QA00000003',
    mileage: 25000,
    status: 'sold',
    lastService: new Date('2022-03-10'),
    notes: 'SEED: статус sold',
  },
  {
    brand: 'Beta',
    model: 'RR300',
    year: 1990,
    vin: 'BET1990QA00000004',
    mileage: 0,
    status: 'available',
    lastService: new Date('1990-01-01'),
    notes: 'SEED: мин. год и пробег',
  },
  {
    brand: 'BMW',
    model: 'R1250GS',
    year: 2026,
    vin: 'BMW2026QA00000005',
    mileage: 99999,
    status: 'available',
    lastService: new Date('2026-01-10'),
    notes: 'SEED: макс. пробег',
  },
  {
    brand: 'Husqvarna',
    model: 'TE300',
    year: 2024,
    vin: 'HUS2024QA00000006',
    mileage: 50000,
    status: 'available',
    lastService: new Date('2025-08-01'),
    notes: 'SEED: VIN edit (TC-BIKE-EDIT-VIN)',
  },
  {
    brand: 'GasGas',
    model: 'EC300',
    year: 2010,
    vin: 'GAS2010QA00000007',
    mileage: 10000,
    status: 'repair',
    lastService: new Date('2021-05-05'),
    notes: null,
  },
  {
    brand: 'Sherco',
    model: 'SE300',
    year: 2012,
    vin: 'SHE2012QA00000008',
    mileage: 80000,
    status: 'available',
    lastService: new Date('2020-12-12'),
    notes: 'SEED: пробег от 50000',
  },
  {
    brand: 'Kayo',
    model: 'T2 300',
    year: 2023,
    vin: 'KAY2023QA00000009',
    mileage: 3500,
    status: 'available',
    lastService: new Date('2025-03-01'),
    notes: 'SEED: каталог китайских эндуро',
  },
  {
    brand: 'Regulmoto',
    model: 'Athlete 300',
    year: 2022,
    vin: 'REG2022QA00000010',
    mileage: 8200,
    status: 'repair',
    lastService: new Date('2024-09-15'),
    notes: 'SEED: Regulmoto / прокат',
  },
  {
    brand: 'Motoland',
    model: 'XT 250 Enduro',
    year: 2021,
    vin: 'MOT2021QA00000011',
    mileage: 15000,
    status: 'sold',
    lastService: new Date('2023-07-20'),
    notes: 'SEED: Motoland',
  },
];

/** Генерация байка по индексу — формула фиксирована, без Math.random */
function buildGeneratedBike(index: number): SeedBikeInput {
  const entry = CATALOG[index % CATALOG.length];
  const year = 1990 + (index % 37);
  const mileage = (index * 1379) % 120000;
  const status = STATUSES[index % STATUSES.length];

  return {
    brand: entry.brand,
    model: entry.model,
    year,
    vin: buildSeedVin(entry.brand, year, index),
    mileage,
    status,
    lastService: buildLastService(index),
    notes: index % 5 === 0 ? `Авто-заметка #${index}` : null,
  };
}

/** Полный набор из 50 байков: 11 фикстур + 39 детерминированных */
export function buildDeterministicBikes(): SeedBikeInput[] {
  const bikes: SeedBikeInput[] = [...SEED_FIXTURE_BIKES];

  for (let index = SEED_FIXTURE_BIKES.length + 1; index <= SEED_BIKE_COUNT; index++) {
    bikes.push(buildGeneratedBike(index));
  }

  return bikes;
}

/** Сводка для документации и smoke-проверок после seed */
export function getSeedSummary(bikes: SeedBikeInput[]) {
  const byStatus = { available: 0, repair: 0, sold: 0 };
  for (const bike of bikes) {
    if (bike.status in byStatus) {
      byStatus[bike.status as keyof typeof byStatus] += 1;
    }
  }

  return {
    version: SEED_VERSION,
    total: bikes.length,
    byStatus,
    firstVin: bikes[0]?.vin,
    fixtureVins: SEED_FIXTURE_BIKES.map((bike) => bike.vin),
    catalogSize: CATALOG.length,
  };
}
