import axios from 'axios';

/**
 * НАСТРОЙКА API-КЛИЕНТА
 * withCredentials: true — КРИТИЧЕСКИ ВАЖНО ДЛЯ QA!
 * Без этого параметра браузер не будет сохранять и отправлять cookie (JWT-токен).
 */

// Тип пользователя, который возвращает бэкенд после логина или /me
export type AuthUser = {
  id: string;
  username: string;
  role: string;
};

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

/** GET /auth/me — проверить, есть ли активная сессия (cookie) */
export const getMe = async (): Promise<AuthUser> => {
  const response = await api.get('/auth/me');
  return response.data;
};

/** GET /bikes — список байков (фильтры, сортировка sortBy/order, пагинация) */
export const getBikes = async (
  status: string = '',
  search: string = '',
  page: number = 1,
  limit: number = 10,
  sortBy: string = 'brand',
  order: 'asc' | 'desc' = 'asc',
) => {
  const response = await api.get('/bikes', {
    params: { status, search, page, limit, sortBy, order },
  });
  return response.data;
};

/** POST /bikes — создать новый байк (требуется роль mechanic или admin) */
export const createBike = async (bikeData: any) => {
  const response = await api.post('/bikes', bikeData);
  return response.data;
};

/** PUT /bikes/:id — обновить байк (mechanic или admin) */
export const updateBike = async (id: string, bikeData: any) => {
  const response = await api.put(`/bikes/${id}`, bikeData);
  return response.data;
};

/** DELETE /bikes/:id — удалить байк (только admin) */
export const deleteBike = async (id: string) => {
  await api.delete(`/bikes/${id}`);
};

/** POST /auth/login — вход в систему */
export const loginRequest = async (credentials: { username: string; password: string }): Promise<AuthUser> => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

/** POST /auth/logout — выход из системы (очистка cookie на сервере) */
export const logoutRequest = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};
