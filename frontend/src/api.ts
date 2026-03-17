import axios from 'axios';

/**
 * API КЛИЕНТ
 * Единая точка входа для всех запросов к Бэкенду.
 */
const api = axios.create({
  baseURL: '/api', // Прокси настроен в vite.config на http://localhost:5000
});

/**
 * Получить список байков с учетом всех фильтров
 * @param status - строка ('available', 'repair', 'sold')
 * @param search - текст для поиска по марке/модели
 * @param page - номер страницы (1, 2, 3...)
 * @param limit - сколько штук за раз (10, 20, 50)
 */
export const getBikes = async (
  status: string = '', 
  search: string = '', 
  page: number = 1, 
  limit: number = 10
) => {
  // Отправляем GET запрос с параметрами в URL
  const response = await api.get('/bikes', {
    params: { status, search, page, limit }
  });
  
  // Сервер теперь возвращает объект { bikes: [], total: 50, page: 1, limit: 10, totalPages: 5 }
  return response.data;
};

/**
 * Создать новый байк
 * @param bikeData - данные из формы (проверенные через Zod)
 */
export const createBike = async (bikeData: any) => {
  const response = await api.post('/bikes', bikeData);
  return response.data;
};