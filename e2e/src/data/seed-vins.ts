/**
 * Якорные VIN из backend/prisma/seedData.ts (SEED_FIXTURE_BIKES).
 * Ассертим только эти значения — UUID/createdAt из БД нестабильны.
 */
export const SEED_VINS = {
  availableKtm: 'KTM2020QA00000001',
  repairHonda: 'HON2015QA00000002',
} as const;

export const SEED_BIKE_COUNT = 50;
