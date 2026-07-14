import { Filter, Check, Wrench, RefreshCcw, Tag, X } from 'lucide-react';
import type { FilterFieldKey } from '../types/bike';

const MAX_YEAR_FILTER_DIGITS = 4;

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

/** Поле числового фильтра с кнопкой очистки (×) */
function FilterNumberInput({
  label,
  testId,
  clearTestId,
  errorTestId,
  value,
  error,
  kind,
  placeholder,
  onChange,
  onClear,
}: {
  label: string;
  testId: string;
  clearTestId: string;
  errorTestId: string;
  value: string;
  error?: string;
  kind: 'year' | 'mileage';
  placeholder: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}) {
  const isYear = kind === 'year';

  return (
    <div className="w-32">
      <label
        htmlFor={testId}
        className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={testId}
          data-testid={testId}
          type={isYear ? 'text' : 'number'}
          inputMode={isYear ? 'numeric' : undefined}
          maxLength={isYear ? MAX_YEAR_FILTER_DIGITS : undefined}
          min={isYear ? undefined : 0}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyDown={(event) => {
            if (event.key === '-' || event.key === 'e' || event.key === 'E') {
              event.preventDefault();
            }
          }}
          className={`w-full rounded-lg border py-1.5 pl-2 pr-7 text-sm font-semibold outline-none transition-all focus:ring-2 focus:ring-blue-500 ${error ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-white'}`}
        />
        {value !== '' && (
          <button
            type="button"
            data-testid={clearTestId}
            onClick={onClear}
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label={`Очистить ${label}`}
          >
            <X size={14} />
          </button>
        )}
      </div>
      {error && (
        <p data-testid={errorTestId} className="mt-1 text-[10px] font-bold uppercase leading-tight text-rose-500">
          {error}
        </p>
      )}
    </div>
  );
}

/** Поле текстового фильтра с кнопкой очистки (×) */
function FilterTextInput({
  label,
  testId,
  clearTestId,
  value,
  placeholder,
  onChange,
  onClear,
}: {
  label: string;
  testId: string;
  clearTestId: string;
  value: string;
  placeholder: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}) {
  return (
    <div className="w-36">
      <label
        htmlFor={testId}
        className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={testId}
          data-testid={testId}
          type="text"
          autoComplete="off"
          maxLength={40}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-2 pr-7 text-sm font-semibold outline-none transition-all focus:ring-2 focus:ring-blue-500"
        />
        {value !== '' && (
          <button
            type="button"
            data-testid={clearTestId}
            onClick={onClear}
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label={`Очистить ${label}`}
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

export type BikeFiltersProps = {
  activeStatuses: string[];
  brand: string;
  model: string;
  yearFrom: string;
  yearTo: string;
  mileageFrom: string;
  mileageTo: string;
  filterErrors: Partial<Record<FilterFieldKey, string>>;
  hasActiveFilters: boolean;
  onStatusFilter: (status: string) => void;
  onBrandChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onModelChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onYearFromChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onYearToChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onMileageFromChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onMileageToChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClearBrand: () => void;
  onClearModel: () => void;
  onClearYearFrom: () => void;
  onClearYearTo: () => void;
  onClearMileageFrom: () => void;
  onClearMileageTo: () => void;
  onClearAll: () => void;
};

/**
 * ФИЛЬТРЫ СПИСКА (F-FILTER-01…11)
 * Статусы + марка/модель + диапазоны год/пробег.
 */
export default function BikeFilters({
  activeStatuses,
  brand,
  model,
  yearFrom,
  yearTo,
  mileageFrom,
  mileageTo,
  filterErrors,
  hasActiveFilters,
  onStatusFilter,
  onBrandChange,
  onModelChange,
  onYearFromChange,
  onYearToChange,
  onMileageFromChange,
  onMileageToChange,
  onClearBrand,
  onClearModel,
  onClearYearFrom,
  onClearYearTo,
  onClearMileageFrom,
  onClearMileageTo,
  onClearAll,
}: BikeFiltersProps) {
  const isStatusFilterActive = (status: string) => activeStatuses.includes(status);

  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center p-4">
        <div className="flex items-center gap-3">
          <Filter size={18} className="ml-2 text-slate-400" />
          <button
            data-testid="filter-all"
            onClick={() => onStatusFilter('')}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold transition-all ${activeStatuses.length === 0 ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600'}`}
          >
            <RefreshCcw size={14} /> Все
          </button>
          <button
            data-testid="filter-available"
            onClick={() => onStatusFilter('available')}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold transition-all ${isStatusFilterActive('available') ? 'bg-emerald-600 text-white shadow-md' : 'bg-emerald-100 text-emerald-700'}`}
          >
            <Check size={14} /> Доступен
          </button>
          <button
            data-testid="filter-repair"
            onClick={() => onStatusFilter('repair')}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold transition-all ${isStatusFilterActive('repair') ? 'bg-amber-600 text-white shadow-md' : 'bg-amber-100 text-amber-700'}`}
          >
            <Wrench size={14} /> Ремонт
          </button>
          <button
            data-testid="filter-sold"
            onClick={() => onStatusFilter('sold')}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold transition-all ${isStatusFilterActive('sold') ? 'bg-rose-600 text-white shadow-md' : 'bg-rose-100 text-rose-700'}`}
          >
            <Tag size={14} /> Продан
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-4 border-t border-slate-100 bg-slate-50/50 px-4 py-3">
        <span className="pt-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Марка / модель</span>
        <FilterTextInput
          label="Марка"
          testId="filter-brand"
          clearTestId="filter-brand-clear"
          value={brand}
          placeholder="KTM"
          onChange={onBrandChange}
          onClear={onClearBrand}
        />
        <FilterTextInput
          label="Модель"
          testId="filter-model"
          clearTestId="filter-model-clear"
          value={model}
          placeholder="300 EXC"
          onChange={onModelChange}
          onClear={onClearModel}
        />
      </div>

      <div className="flex flex-wrap items-start gap-4 border-t border-slate-100 bg-slate-50/50 px-4 py-3">
        <span className="pt-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Диапазоны</span>
        <FilterNumberInput
          label="Год от"
          testId="filter-year-from"
          clearTestId="filter-year-from-clear"
          errorTestId="error-filter-year-from"
          value={yearFrom}
          error={filterErrors.yearFrom}
          kind="year"
          placeholder="1990"
          onChange={onYearFromChange}
          onClear={onClearYearFrom}
        />
        <FilterNumberInput
          label="Год до"
          testId="filter-year-to"
          clearTestId="filter-year-to-clear"
          errorTestId="error-filter-year-to"
          value={yearTo}
          error={filterErrors.yearTo}
          kind="year"
          placeholder="2026"
          onChange={onYearToChange}
          onClear={onClearYearTo}
        />
        <FilterNumberInput
          label="Пробег от"
          testId="filter-mileage-from"
          clearTestId="filter-mileage-from-clear"
          errorTestId="error-filter-mileage-from"
          value={mileageFrom}
          error={filterErrors.mileageFrom}
          kind="mileage"
          placeholder="0"
          onChange={onMileageFromChange}
          onClear={onClearMileageFrom}
        />
        <FilterNumberInput
          label="Пробег до"
          testId="filter-mileage-to"
          clearTestId="filter-mileage-to-clear"
          errorTestId="error-filter-mileage-to"
          value={mileageTo}
          error={filterErrors.mileageTo}
          kind="mileage"
          placeholder="100000"
          onChange={onMileageToChange}
          onClear={onClearMileageTo}
        />
        <button
          type="button"
          data-testid="filter-clear-all"
          onClick={onClearAll}
          disabled={!hasActiveFilters}
          className="mt-6 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <X size={14} /> Сбросить всё
        </button>
      </div>
    </div>
  );
}
