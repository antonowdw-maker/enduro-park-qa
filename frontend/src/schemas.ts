import { z } from 'zod';

const currentYear = new Date().getFullYear();

/** Допустимые символы VIN: 17 знаков, латиница и цифры без I, O, Q */
export const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i;

/** Нормализация ввода VIN: верхний регистр, только допустимые символы, макс. 17 */
export function normalizeVinInput(value: string): string {
  return String(value).toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '').slice(0, 17);
}

/** Полная проверка VIN (длина, алфавит, смесь букв и цифр) */
export function isValidVin(value: string): boolean {
  const vin = normalizeVinInput(value);
  if (!VIN_REGEX.test(vin)) return false;
  return /[A-HJ-NPR-Z]/.test(vin) && /[0-9]/.test(vin);
}

/** Подсказка формата VIN для поля ввода */
export const VIN_FORMAT_HINT =
  '17 символов: буквы A–Z и цифры 0–9 (без I, O, Q), обязательно и буквы, и цифры. Пример: 1HGBH41JXMN109186';

/**
 * АКТУАЛИЗИРОВАННАЯ СХЕМА ВАЛИДАЦИИ (Zod)
 * Правила фронтенда совпадают с бэкендом.
 */
export const bikeSchema = z.object({
  // Поле «Марка» в UI, ключ brand в API
  brand: z.string().min(2, 'Минимум 2 символа для марки'),
  model: z.string().min(1, 'Модель обязательна'),

  year: z.number()
    .min(1990, 'Год выпуска не может быть раньше 1990')
    .max(currentYear + 1, `Год не может быть позже ${currentYear + 1}`),

  vin: z
    .string()
    .min(1, 'VIN обязателен')
    .transform(normalizeVinInput)
    .pipe(
      z
        .string()
        .length(17, 'VIN должен содержать ровно 17 символов')
        .regex(VIN_REGEX, 'VIN: только A–Z и 0–9, без букв I, O, Q')
        .refine((value) => /[A-HJ-NPR-Z]/.test(value) && /[0-9]/.test(value), {
          message: 'VIN должен содержать и буквы, и цифры',
        }),
    ),

  mileage: z.number().min(0, 'Пробег не может быть отрицательным числом'),

  status: z.enum(['available', 'repair', 'sold']),

  lastService: z.string().min(1, 'Укажите дату последнего ТО'),

  notes: z.string().max(500, 'Заметки не длиннее 500 символов').optional().or(z.literal('')),
});
export type BikeFormData = z.infer<typeof bikeSchema>;