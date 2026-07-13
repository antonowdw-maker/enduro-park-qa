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

/** Общая валидация полей байка (создание и обновление) */
function validateBikeFields(bikeData: any) {
  const currentYear = new Date().getFullYear();

  if (bikeData.year < 1990 || bikeData.year > currentYear + 1) {
    throw new Error(`Год должен быть от 1990 до ${currentYear + 1}`);
  }

  if (bikeData.mileage < 0) {
    throw new Error('Пробег не может быть отрицательным');
  }

  validateVin(bikeData.vin);

  if (bikeData.lastService) {
    const serviceDate = new Date(bikeData.lastService);
    if (Number.isNaN(serviceDate.getTime())) {
      throw new Error('Некорректная дата последнего ТО');
    }
  }

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
  async getAllBikes(
    status?: string,
    search?: string,
    page?: number,
    limit?: number,
    sortBy?: string,
    order?: 'asc' | 'desc',
  ) {
    return await BikeRepository.findAll({ status, search, page, limit, sortBy, order });
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

    return await BikeRepository.update(id, prepareBikeData(bikeData, false));
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
