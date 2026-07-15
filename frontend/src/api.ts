import axios from 'axios';

/**
 * НАСТРОЙКА API-КЛИЕНТА
 * withCredentials: true — КРИТИЧЕСКИ ВАЖНО ДЛЯ QA!
 * Без этого параметра браузер не будет сохранять и отправлять cookie (JWT-токен).
 *
 * Волна G: double-submit CSRF — Axios читает cookie `csrf` и шлёт X-CSRF-Token.
 */

export type AuthUser = {
  id: string;
  username: string;
  role: string;
};

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  xsrfCookieName: 'csrf',
  xsrfHeaderName: 'X-CSRF-Token',
});

let csrfReady: Promise<void> | null = null;

/** GET /auth/csrf — выставить cookie `csrf` (не httpOnly) */
export async function ensureCsrf(): Promise<void> {
  if (!csrfReady) {
    csrfReady = api.get('/auth/csrf').then(() => undefined).catch((err) => {
      csrfReady = null;
      throw err;
    });
  }
  await csrfReady;
}

api.interceptors.request.use(async (config) => {
  const method = (config.method || 'get').toLowerCase();
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    const url = String(config.url || '');
    // login сам без CSRF; csrf endpoint — GET
    if (!url.includes('/auth/login') && !url.includes('/auth/csrf')) {
      await ensureCsrf();
    }
  }
  return config;
});

/** GET /auth/me — проверить, есть ли активная сессия (cookie) */
export const getMe = async (): Promise<AuthUser> => {
  const response = await api.get('/auth/me');
  return response.data;
};

/** Параметры GET /bikes */
export type GetBikesParams = {
  statuses?: string[];
  search?: string;
  brand?: string;
  model?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  yearFrom?: number | '';
  yearTo?: number | '';
  mileageFrom?: number | '';
  mileageTo?: number | '';
};

/** GET /bikes — список байков (фильтры, сортировка sortBy/order, пагинация через offset) */
export const getBikes = async ({
  statuses = [],
  search = '',
  brand = '',
  model = '',
  page = 1,
  limit = 10,
  sortBy = 'brand',
  order = 'asc',
  yearFrom,
  yearTo,
  mileageFrom,
  mileageTo,
}: GetBikesParams = {}) => {
  const params: Record<string, string | number> = {
    limit,
    offset: (page - 1) * limit,
    sortBy,
    order,
  };

  if (statuses.length > 0) {
    params.status = statuses.join(',');
  }

  if (search.trim()) params.search = search.trim();
  if (brand.trim()) params.brand = brand.trim();
  if (model.trim()) params.model = model.trim();

  if (yearFrom !== '' && yearFrom !== undefined) params.yearFrom = yearFrom;
  if (yearTo !== '' && yearTo !== undefined) params.yearTo = yearTo;
  if (mileageFrom !== '' && mileageFrom !== undefined) params.mileageFrom = mileageFrom;
  if (mileageTo !== '' && mileageTo !== undefined) params.mileageTo = mileageTo;

  const response = await api.get('/bikes', { params });
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
