/**
 * Детерминированные тестовые данные (итерация 9).
 * Повторный `npm run seed` всегда создаёт одинаковый набор из 50 байков.
 */

export const SEED_VERSION = '2026.07.13';
export const SEED_BIKE_COUNT = 50;

const BRANDS = ['KTM', 'Honda', 'Yamaha', 'Husqvarna', 'Beta', 'GasGas', 'Sherco', 'Kawasaki', 'Suzuki', 'BMW'] as const;
const MODELS = ['300 EXC', 'CRF450R', 'YZ250F', 'TE300', 'RR300', 'EC300', 'SE300', 'KX450', 'RM-Z450', 'R1250GS'] as const;
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
];

/** Генерация байка по индексу — формула фиксирована, без Math.random */
function buildGeneratedBike(index: number): SeedBikeInput {
  const brand = BRANDS[index % BRANDS.length];
  const model = MODELS[index % MODELS.length];
  const year = 1990 + (index % 37);
  const mileage = (index * 1379) % 120000;
  const status = STATUSES[index % STATUSES.length];

  return {
    brand,
    model,
    year,
    vin: buildSeedVin(brand, year, index),
    mileage,
    status,
    lastService: buildLastService(index),
    notes: index % 5 === 0 ? `Авто-заметка #${index}` : null,
  };
}

/** Полный набор из 50 байков: 8 фикстур + 42 детерминированных */
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
  };
}
