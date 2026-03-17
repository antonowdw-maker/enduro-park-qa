import { z } from 'zod';

/**
 * СХЕМА ВАЛИДАЦИИ БАЙКА (Zod)
 * Описываем правила для полей.
 */
export const bikeSchema = z.object({
  brand: z.string().min(2, "Минимум 2 символа"),
  model: z.string().min(1, "Модель обязательна"),
  year: z.number().min(1990, "Год должен быть не раньше 1990").max(new Date().getFullYear() + 1, "Год не из будущего"),
  vin: z.string().length(17, "VIN должен быть ровно 17 символов"),
  mileage: z.number().min(0, "Пробег не может быть отрицательным"),
  status: z.enum(['available', 'repair', 'sold'])
});

// ЭТОЙ СТРОЧКИ СКОРЕЕ ВСЕГО НЕ ХВАТАЛО:
// Мы экспортируем тип данных, чтобы App.tsx понимал, что такое BikeFormData
export type BikeFormData = z.infer<typeof bikeSchema>;