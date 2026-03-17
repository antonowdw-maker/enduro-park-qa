import { BikeRepository } from '../repositories/bikeRepository';

/**
 * СЕРВИС БАЙКОВ
 * Основное место для твоих Unit-тестов и негативных проверок.
 */
export const BikeService = {
  /**
   * Получить список байков с учетом фильтра
   * @param status - фильтр по состоянию байка
   */
  async getAllBikes(status?: string) {
    // Просто пробрасываем запрос в репозиторий
    return await BikeRepository.findAll(status);
  },

  /**
   * Создать байк с проверкой бизнес-правил
   */
  async createBike(bikeData: any) {
    // QA-Кейс: Проверка минимального года выпуска
    if (bikeData.year < 1990) {
      throw new Error('Год выпуска не может быть раньше 1990');
    }

    // QA-Кейс: Проверка длины VIN (строго 17 символов)
    if (!bikeData.vin || bikeData.vin.length !== 17) {
      throw new Error('VIN должен содержать ровно 17 символов');
    }

    return await BikeRepository.create(bikeData);
  }
};
