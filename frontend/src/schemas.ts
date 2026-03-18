import { z } from 'zod';

const currentYear = new Date().getFullYear();

/**
 * АКТУАЛИЗИРОВАННАЯ СХЕМА ВАЛИДАЦИИ (Zod)
 * Теперь правила фронтенда строго совпадают с бэкендом.
 */
export const bikeSchema = z.object({
  brand: z.string().min(2, "Минимум 2 символа для бренда"),
  model: z.string().min(1, "Модель обязательна"),
  
  // ВАЛИДАЦИЯ ГОДА: От 1990 до Текущий + 1
  year: z.number()
    .min(1990, "Год выпуска не может быть раньше 1990")
    .max(currentYear + 1, `Год не может быть позже ${currentYear + 1}`),
  
  // ВАЛИДАЦИЯ VIN: Строго 17 символов
  vin: z.string().length(17, "VIN должен содержать ровно 17 символов"),
  
  // ВАЛИДАЦИЯ ПРОБЕГА: Только положительные числа
  mileage: z.number().min(0, "Пробег не может быть отрицательным числом"),
  
  status: z.enum(['available', 'repair', 'sold'])
});

export type BikeFormData = z.infer<typeof bikeSchema>;