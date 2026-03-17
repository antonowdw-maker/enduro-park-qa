import axios from 'axios';

// Создаем экземпляр axios с базовым URL /api
// Благодаря прокси в vite.config, запросы полетят на http://localhost:5000/api
const api = axios.create({
  baseURL: '/api',
});

// Функция для получения данных (используется в useEffect на фронте)
export const getBikes = async () => {
  const response = await api.get('/bikes');
  return response.data;
};

// Функция для отправки данных из формы (POST запрос)
export const createBike = async (bikeData: any) => {
  const response = await api.post('/bikes', bikeData);
  return response.data;
};
