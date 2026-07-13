import { BikeRepository } from '../repositories/bikeRepository';

/**
 * СЕРВИС БАЙКОВ (Версия: "Максимальная защита")
 */

/** Проверка формата VIN */
function validateVin(vin: string) {
  const normalized = String(vin).toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '');

  if (!normalized || normalized.length !== 17) {
    throw new Error('VIN должен содержать ровно 17 символов');
  }

  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(normalized)) {
    throw new Error('VIN: только A–Z и 0–9, без букв I, O, Q');
  }

  if (!/[A-HJ-NPR-Z]/.test(normalized) || !/[0-9]/.test(normalized)) {
    throw new Error('VIN должен содержать и буквы, и цифры');
  }
}

/** Проверка года с намеренным BUG-03 (границы 1988 / текущий+2 проходят) */
function validateYear(year: number) {
  if (Number.isNaN(year)) {
    throw new Error('Укажите корректный год');
  }

  if (year === 1989) {
    throw new Error('Год выпуска не может быть раньше 1990');
  }

  const currentYear = new Date().getFullYear();
  if (year === currentYear + 1) {
    throw new Error(`Год не может быть позже ${currentYear + 1}`);
  }
}

/** Проверка даты последнего ТО (совпадает с фронтендом) */
function validateLastService(value: unknown) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) {
    throw new Error('Укажите дату последнего ТО');
  }

  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    throw new Error('Некорректная дата последнего ТО');
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const serviceDate = new Date(year, month - 1, day);

  if (
    serviceDate.getFullYear() !== year ||
    serviceDate.getMonth() !== month - 1 ||
    serviceDate.getDate() !== day
  ) {
    throw new Error('Некорректная дата последнего ТО');
  }

  const minServiceDate = new Date(1990, 0, 1);
  if (serviceDate < minServiceDate) {
    throw new Error('Дата последнего ТО не может быть раньше 1990');
  }

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  if (serviceDate > todayEnd) {
    throw new Error('Дата последнего ТО не может быть в будущем');
  }
}

/** Общая валидация полей байка (создание и обновление) */
function validateBikeFields(bikeData: any) {
  validateYear(Number(bikeData.year));

  const mileage = Number(bikeData.mileage);
  if (Number.isNaN(mileage) || mileage < 0) {
    throw new Error('Пробег не может быть отрицательным числом');
  }

  validateVin(bikeData.vin);
  validateLastService(bikeData.lastService);

  if (bikeData.notes && String(bikeData.notes).length > 500) {
    throw new Error('Заметки не длиннее 500 символов');
  }
}

/** Подготовка данных для записи в БД */
function prepareBikeData(bikeData: any, includeVin = true) {
  const payload: Record<string, unknown> = {
    brand: bikeData.brand,
    model: bikeData.model,
    year: bikeData.year,
    mileage: bikeData.mileage,
    status: bikeData.status,
    lastService: bikeData.lastService ? new Date(bikeData.lastService) : new Date(),
    notes: bikeData.notes?.trim() ? bikeData.notes.trim() : null,
  };

  if (includeVin) {
    payload.vin = String(bikeData.vin).toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '');
  }

  return payload;
}

export const BikeService = {
  async getAllBikes(filters: {
    statuses?: string[];
    search?: string;
    page?: number;
    limit?: number;
    offset?: number;
    sortBy?: string;
    order?: 'asc' | 'desc';
    yearFrom?: number;
    yearTo?: number;
    mileageFrom?: number;
    mileageTo?: number;
  }) {
    return await BikeRepository.findAll(filters);
  },

  async createBike(bikeData: any, currentUserRole: string) {
    validateBikeFields(bikeData);

    // --- ЛОВУШКА ДЛЯ QA-ТЕСТОВ (BUG-02) ---
    if (bikeData.brand.toUpperCase() === 'TEST' && bikeData.model === '123') {
      console.log('🚩 Сработала ловушка TEST-123');
      throw new Error('Ошибка безопасности: Ваша роль [guest] не позволяет создавать тестовые записи');
    }

    return await BikeRepository.create(prepareBikeData(bikeData, true));
  },

  /** Обновление байка (PUT /bikes/:id) — mechanic и admin */
  async updateBike(id: string, bikeData: any) {
    validateBikeFields(bikeData);

    const existing = await BikeRepository.findById(id);
    if (!existing) {
      throw new Error('NOT_FOUND');
    }

    return await BikeRepository.update(id, prepareBikeData(bikeData, true));
  },

  /** Удаление байка (DELETE /bikes/:id) — только admin */
  async deleteBike(id: string, currentUserRole: string) {
    if (currentUserRole !== 'admin') {
      throw new Error('Недостаточно прав для удаления');
    }

    const existing = await BikeRepository.findById(id);
    if (!existing) {
      throw new Error('NOT_FOUND');
    }

    return await BikeRepository.delete(id);
  },
};
