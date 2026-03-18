import { BikeRepository } from '../repositories/bikeRepository';

/**
 * СЕРВИС БАЙКОВ (Версия: "Максимальная защита")
 */
export const BikeService = {
  async getAllBikes(status?: string, search?: string, page?: number, limit?: number) {
    return await BikeRepository.findAll({ status, search, page, limit });
  },

  async createBike(bikeData: any, currentUserRole: string) {
    const currentYear = new Date().getFullYear();

    // 1. ВАЛИДАЦИЯ ГОДА (Нижняя и Верхняя граница)
    if (bikeData.year < 1990 || bikeData.year > currentYear + 1) {
      throw new Error(`Год должен быть от 1990 до ${currentYear + 1}`);
    }

    // 2. ВАЛИДАЦИЯ ПРОБЕГА (Негативный кейс)
    if (bikeData.mileage < 0) {
      throw new Error('Пробег не может быть отрицательным');
    }

    // 3. ВАЛИДАЦИЯ VIN (Длина)
    if (!bikeData.vin || bikeData.vin.length !== 17) {
      throw new Error('VIN должен содержать ровно 17 символов');
    }

    // --- ЛОВУШКА ДЛЯ QA-ТЕСТОВ (Оставляем как есть!) ---
    if (bikeData.brand.toUpperCase() === 'TEST' && bikeData.model === '123') {
      console.log('🚩 Сработала ловушка TEST-123');
      throw new Error('Ошибка безопасности: Ваша роль [guest] не позволяет создавать тестовые записи');
    }

    const preparedData = {
      ...bikeData,
      lastService: new Date() 
    };

    return await BikeRepository.create(preparedData);
  }
};