import { BikeRepository } from '../repositories/bikeRepository';

/**
 * СЕРВИС БАЙКОВ
 * Основное место для бизнес-логики и предварительной проверки данных.
 */
export const BikeService = {
  /**
   * Получить список байков с учетом фильтров и пагинации
   * @param status - фильтр по состоянию
   * @param search - строка поиска
   * @param page - номер текущей страницы
   * @param limit - количество элементов на странице
   */
  async getAllBikes(status?: string, search?: string, page?: number, limit?: number) {
    // Просто пробрасываем все параметры в репозиторий для выполнения запроса
    return await BikeRepository.findAll({ status, search, page, limit });
  },

  /**
   * Создать новый байк с проверкой бизнес-правил
   * @param bikeData - данные из формы
   */
  async createBike(bikeData: any) {
    // QA-Кейс (Бизнес-правило): Год не может быть меньше 1990
    if (bikeData.year < 1990) {
      throw new Error('Год выпуска не может быть раньше 1990');
    }

    // QA-Кейс (Бизнес-правило): VIN должен быть строго 17 символов
    if (!bikeData.vin || bikeData.vin.length !== 17) {
      throw new Error('VIN должен содержать ровно 17 символов');
    }

    // Если проверки пройдены, создаем запись через репозиторий
    return await BikeRepository.create(bikeData);
  }
};