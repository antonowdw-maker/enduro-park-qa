import axios from 'axios';

/**
 * НАСТРОЙКА API
 * withCredentials: true — КРИТИЧЕСКИ ВАЖНО ДЛЯ QA!
 * Без этого параметра браузер не будет сохранять и отправлять куки (токены).
 */
const api = axios.create({
  baseURL: '/api',
  withCredentials: true, 
});

// Получить список байков
export const getBikes = async (status: string = '', search: string = '', page: number = 1, limit: number = 10) => {
  const response = await api.get('/bikes', {
    params: { status, search, page, limit }
  });
  return response.data;
};

// Создать новый байк
export const createBike = async (bikeData: any) => {
  const response = await api.post('/bikes', bikeData);
  return response.data;
};

/** 
 * АВТОРИЗАЦИЯ 
 */
// Вход в систему (POST /api/auth/login)
export const loginRequest = async (credentials: any) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

// Выход из системы (POST /api/auth/logout)
export const logoutRequest = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};