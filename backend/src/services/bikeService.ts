import { BikeRepository } from '../repositories/bikeRepository';

/**
 * СЕРВИС БАЙКОВ
 * Здесь живет логика. Именно сюда ты будешь писать тесты.
 * Пример: Проверка года выпуска или уникальности VIN.
 */
export const BikeService = {
  // Получить список байков
  async getAllBikes() {
    return await BikeRepository.findAll();
  },

  // Создать байк с проверкой логики
  async createBike(bikeData: any) {
    // QA-Кейс (Бизнес-правило): Год не может быть меньше 1990
    if (bikeData.year < 1990) {
      throw new Error('Год выпуска не может быть раньше 1990');
    }

    // QA-Кейс (Бизнес-правило): VIN должен быть ровно 17 символов
    if (bikeData.vin.length !== 17) {
      throw new Error('VIN должен содержать ровно 17 символов');
    }

    return await BikeRepository.create(bikeData);
  }
};
