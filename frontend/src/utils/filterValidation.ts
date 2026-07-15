import type { FilterFieldKey } from '../types/bike';

export const MAX_YEAR_FILTER_DIGITS = 4;

/** Ввод года в фильтре: только цифры, не более 4 символов */
export function sanitizeYearFilterInput(value: string): string | null {
  if (value === '') return '';
  if (!/^\d+$/.test(value)) return null;
  if (value.length > MAX_YEAR_FILTER_DIGITS) return null;
  return value;
}

/** Проверка диапазонных фильтров: неотрицательные значения, «до» ≥ «от» */
export function validateRangeFilters(
  yearFrom: string,
  yearTo: string,
  mileageFrom: string,
  mileageTo: string,
): Partial<Record<FilterFieldKey, string>> {
  const errors: Partial<Record<FilterFieldKey, string>> = {};

  const checkYear = (value: string, key: 'yearFrom' | 'yearTo') => {
    if (value === '') return null;
    if (!/^\d{1,4}$/.test(value)) {
      errors[key] = 'Год: не более 4 цифр';
      return null;
    }
    const num = Number(value);
    if (num < 0) {
      errors[key] = 'Значение не может быть отрицательным';
      return null;
    }
    return num;
  };

  const checkNonNegative = (value: string, key: FilterFieldKey) => {
    if (value === '') return null;
    const num = Number(value);
    if (Number.isNaN(num) || num < 0) {
      errors[key] = 'Значение не может быть отрицательным';
      return null;
    }
    return num;
  };

  const yFrom = checkYear(yearFrom, 'yearFrom');
  const yTo = checkYear(yearTo, 'yearTo');
  const mFrom = checkNonNegative(mileageFrom, 'mileageFrom');
  const mTo = checkNonNegative(mileageTo, 'mileageTo');

  if (yFrom !== null && yTo !== null && yTo < yFrom) {
    errors.yearTo = 'Год «до» должен быть не меньше «от»';
  }
  if (mFrom !== null && mTo !== null && mTo < mFrom) {
    errors.mileageTo = 'Пробег «до» должен быть не меньше «от»';
  }

  return errors;
}
