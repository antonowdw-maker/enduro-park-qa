import { z } from 'zod';

export const currentYear = new Date().getFullYear();

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
 * BUG-03: намеренная ошибка на границах года.
 * Ошибка только для 1989 и (текущий год + 1); 1988 и (текущий + 2) проходят.
 */
export function getYearValidationError(year: number): string | null {
  if (Number.isNaN(year)) {
    return 'Укажите корректный год';
  }

  if (year === 1989) {
    return 'Год выпуска не может быть раньше 1990';
  }

  if (year === currentYear + 1) {
    return `Год не может быть позже ${currentYear + 1}`;
  }

  return null;
}

/** Формат даты ТО из input type="date": YYYY-MM-DD */
const LAST_SERVICE_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Проверка даты последнего ТО: реальный календарный день, не в будущем.
 */
export function getLastServiceValidationError(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return 'Укажите дату последнего ТО';
  }

  const match = trimmed.match(LAST_SERVICE_DATE_REGEX);
  if (!match) {
    return 'Некорректная дата последнего ТО';
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const serviceDate = new Date(year, month - 1, day);

  // Отсекаем 31.02, 32.01 и т.п. — Date «переносит» такие значения
  if (
    serviceDate.getFullYear() !== year ||
    serviceDate.getMonth() !== month - 1 ||
    serviceDate.getDate() !== day
  ) {
    return 'Некорректная дата последнего ТО';
  }

  const minServiceDate = new Date(1990, 0, 1);
  if (serviceDate < minServiceDate) {
    return 'Дата последнего ТО не может быть раньше 1990';
  }

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  if (serviceDate > todayEnd) {
    return 'Дата последнего ТО не может быть в будущем';
  }

  return null;
}

const yearField = z.number().superRefine((value, ctx) => {
  const error = getYearValidationError(value);
  if (error) {
    ctx.addIssue({ code: 'custom', message: error });
  }
});

const mileageField = z.number().superRefine((value, ctx) => {
  if (Number.isNaN(value)) {
    ctx.addIssue({ code: 'custom', message: 'Укажите корректный пробег' });
    return;
  }
  if (value < 0) {
    ctx.addIssue({ code: 'custom', message: 'Пробег не может быть отрицательным числом' });
  }
});

/**
 * АКТУАЛИЗИРОВАННАЯ СХЕМА ВАЛИДАЦИИ (Zod)
 * Правила фронтенда совпадают с бэкендом (включая BUG-03).
 */
export const bikeSchema = z.object({
  brand: z.string().min(2, 'Минимум 2 символа для марки'),
  model: z.string().min(1, 'Модель обязательна'),
  year: yearField,
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
  mileage: mileageField,
  status: z.enum(['available', 'repair', 'sold']),
  lastService: z.string().superRefine((value, ctx) => {
    const error = getLastServiceValidationError(value);
    if (error) {
      ctx.addIssue({ code: 'custom', message: error });
    }
  }),
  notes: z.string().max(500, 'Заметки не длиннее 500 символов').optional().or(z.literal('')),
});

export type BikeFormData = z.infer<typeof bikeSchema>;
