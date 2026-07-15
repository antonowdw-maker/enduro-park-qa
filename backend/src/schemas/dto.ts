import { z } from 'zod';

const currentYear = new Date().getFullYear();

/** VIN: как frontend getVinValidationError */
function vinRefine(vin: string, ctx: z.RefinementCtx) {
  const normalized = String(vin).toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!normalized) {
    ctx.addIssue({ code: 'custom', message: 'VIN обязателен' });
    return;
  }
  if (/[IOQ]/.test(normalized)) {
    ctx.addIssue({ code: 'custom', message: 'VIN: нельзя использовать буквы I, O, Q' });
    return;
  }
  if (normalized.length !== 17) {
    ctx.addIssue({ code: 'custom', message: 'VIN должен содержать ровно 17 символов' });
    return;
  }
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(normalized)) {
    ctx.addIssue({ code: 'custom', message: 'VIN: только A–Z и 0–9, без букв I, O, Q' });
    return;
  }
  if (!/[A-HJ-NPR-Z]/.test(normalized) || !/[0-9]/.test(normalized)) {
    ctx.addIssue({ code: 'custom', message: 'VIN должен содержать и буквы, и цифры' });
  }
}

/** BUG-03: ошибка только на 1989 и current+1 */
function yearRefine(year: number, ctx: z.RefinementCtx) {
  if (Number.isNaN(year)) {
    ctx.addIssue({ code: 'custom', message: 'Укажите корректный год' });
    return;
  }
  if (year === 1989) {
    ctx.addIssue({ code: 'custom', message: 'Год выпуска не может быть раньше 1990' });
    return;
  }
  if (year === currentYear + 1) {
    ctx.addIssue({ code: 'custom', message: `Год не может быть позже ${currentYear}` });
  }
}

function lastServiceRefine(value: string, ctx: z.RefinementCtx) {
  const trimmed = value.trim();
  if (!trimmed) {
    ctx.addIssue({ code: 'custom', message: 'Укажите дату последнего ТО' });
    return;
  }
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    ctx.addIssue({ code: 'custom', message: 'Некорректная дата последнего ТО' });
    return;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const serviceDate = new Date(year, month - 1, day);
  if (
    serviceDate.getFullYear() !== year ||
    serviceDate.getMonth() !== month - 1 ||
    serviceDate.getDate() !== day
  ) {
    ctx.addIssue({ code: 'custom', message: 'Некорректная дата последнего ТО' });
    return;
  }
  if (serviceDate < new Date(1990, 0, 1)) {
    ctx.addIssue({ code: 'custom', message: 'Дата последнего ТО не может быть раньше 1990' });
    return;
  }
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  if (serviceDate > todayEnd) {
    ctx.addIssue({ code: 'custom', message: 'Дата последнего ТО не может быть в будущем' });
  }
}

export const loginBodySchema = z
  .object({
    username: z.string().trim().min(1, 'Укажите имя пользователя'),
    password: z.string().min(1, 'Укажите пароль'),
  })
  .strip();

export const bikeBodySchema = z
  .object({
    brand: z.string().min(2, 'Минимум 2 символа для марки'),
    model: z.string().min(1, 'Модель обязательна'),
    year: z.coerce.number().superRefine(yearRefine),
    vin: z.string().superRefine(vinRefine),
    mileage: z.coerce.number().superRefine((value, ctx) => {
      if (Number.isNaN(value)) {
        ctx.addIssue({ code: 'custom', message: 'Укажите корректный пробег' });
        return;
      }
      if (value < 0) {
        ctx.addIssue({ code: 'custom', message: 'Пробег не может быть отрицательным числом' });
      }
    }),
    status: z.enum(['available', 'repair', 'sold']),
    lastService: z.string().superRefine(lastServiceRefine),
    notes: z
      .union([z.string().max(500, 'Заметки не длиннее 500 символов'), z.null()])
      .optional(),
  })
  .strip();

export type LoginBody = z.infer<typeof loginBodySchema>;
export type BikeBody = z.infer<typeof bikeBodySchema>;
