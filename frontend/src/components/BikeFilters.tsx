import { useEffect, useState } from 'react';
import {
  Filter, Check, Wrench, RefreshCcw, Tag, X, ChevronDown, ChevronUp,
} from 'lucide-react';
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
    <div className="min-w-0 w-full">
      <label
        htmlFor={testId}
        className="mb-0.5 block text-[9px] font-black uppercase tracking-widest text-slate-400"
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
          className={`w-full rounded-lg border py-1 pl-2 pr-7 text-sm font-semibold outline-none transition-all focus:ring-2 focus:ring-blue-500 ${error ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-white'}`}
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
        <p data-testid={errorTestId} className="mt-0.5 text-[10px] font-bold uppercase leading-tight text-rose-500">
          {error}
        </p>
      )}
    </div>
  );
}

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
    <div className="min-w-0 w-full">
      <label
        htmlFor={testId}
        className="mb-0.5 block text-[9px] font-black uppercase tracking-widest text-slate-400"
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
          className="w-full rounded-lg border border-slate-200 bg-white py-1 pl-2 pr-7 text-sm font-semibold outline-none transition-all focus:ring-2 focus:ring-blue-500"
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
  search: string;
  brand: string;
  model: string;
  yearFrom: string;
  yearTo: string;
  mileageFrom: string;
  mileageTo: string;
  filterErrors: Partial<Record<FilterFieldKey, string>>;
  hasActiveFilters: boolean;
  onStatusFilter: (status: string) => void;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBrandChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onModelChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onYearFromChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onYearToChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onMileageFromChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onMileageToChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSearch: () => void;
  onClearBrand: () => void;
  onClearModel: () => void;
  onClearYearFrom: () => void;
  onClearYearTo: () => void;
  onClearMileageFrom: () => void;
  onClearMileageTo: () => void;
  onClearAll: () => void;
};

/**
 * ФИЛЬТРЫ: статусы + поиск всегда; марка/модель/диапазоны — свёрнутый блок.
 * Компактные отступы и на desktop, и на mobile.
 */
export default function BikeFilters({
  activeStatuses,
  search,
  brand,
  model,
  yearFrom,
  yearTo,
  mileageFrom,
  mileageTo,
  filterErrors,
  hasActiveFilters,
  onStatusFilter,
  onSearchChange,
  onBrandChange,
  onModelChange,
  onYearFromChange,
  onYearToChange,
  onMileageFromChange,
  onMileageToChange,
  onClearSearch,
  onClearBrand,
  onClearModel,
  onClearYearFrom,
  onClearYearTo,
  onClearMileageFrom,
  onClearMileageTo,
  onClearAll,
}: BikeFiltersProps) {
  const isStatusFilterActive = (status: string) => activeStatuses.includes(status);

  const hasAdvancedValues =
    brand !== '' ||
    model !== '' ||
    yearFrom !== '' ||
    yearTo !== '' ||
    mileageFrom !== '' ||
    mileageTo !== '' ||
    Object.keys(filterErrors).length > 0;

  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    if (hasAdvancedValues) setAdvancedOpen(true);
  }, [hasAdvancedValues]);

  const showAdvanced = advancedOpen;

  const chip = (active: boolean, activeClass: string, idleClass: string) =>
    `inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition-all sm:gap-1.5 sm:px-3 ${active ? activeClass : idleClass}`;

  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:mb-6">
      <div
        data-testid="filter-status-row"
        className="flex flex-wrap items-center gap-1.5 px-3 py-2 sm:gap-2 sm:px-4 sm:py-2.5"
      >
        <Filter size={16} className="shrink-0 text-slate-400" aria-hidden />
        <button
          data-testid="filter-all"
          onClick={() => onStatusFilter('')}
          className={chip(activeStatuses.length === 0, 'bg-blue-600 text-white shadow-sm', 'bg-slate-100 text-slate-600')}
        >
          <RefreshCcw size={12} aria-hidden /> Все
        </button>
        <button
          data-testid="filter-available"
          onClick={() => onStatusFilter('available')}
          className={chip(isStatusFilterActive('available'), 'bg-emerald-600 text-white shadow-sm', 'bg-emerald-100 text-emerald-700')}
        >
          <Check size={12} aria-hidden /> Доступен
        </button>
        <button
          data-testid="filter-repair"
          onClick={() => onStatusFilter('repair')}
          className={chip(isStatusFilterActive('repair'), 'bg-amber-600 text-white shadow-sm', 'bg-amber-100 text-amber-700')}
        >
          <Wrench size={12} aria-hidden /> Ремонт
        </button>
        <button
          data-testid="filter-sold"
          onClick={() => onStatusFilter('sold')}
          className={chip(isStatusFilterActive('sold'), 'bg-rose-600 text-white shadow-sm', 'bg-rose-100 text-rose-700')}
        >
          <Tag size={12} aria-hidden /> Продан
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2 border-t border-slate-100 bg-slate-50/50 px-3 py-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:gap-3 sm:px-4 sm:py-2.5">
        <FilterTextInput
          label="Марка или модель"
          testId="filter-search"
          clearTestId="filter-search-clear"
          value={search}
          placeholder="KTM / EXC"
          onChange={onSearchChange}
          onClear={onClearSearch}
        />
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            data-testid="filter-advanced-toggle"
            aria-expanded={showAdvanced}
            onClick={() => setAdvancedOpen((open) => !open)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-50"
          >
            {showAdvanced ? <ChevronUp size={14} aria-hidden /> : <ChevronDown size={14} aria-hidden />}
            Ещё
          </button>
          <button
            type="button"
            data-testid="filter-clear-all"
            onClick={onClearAll}
            disabled={!hasActiveFilters}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X size={14} aria-hidden /> Сброс
          </button>
        </div>
      </div>

      {showAdvanced && (
        <div
          data-testid="filter-advanced"
          className="grid grid-cols-2 gap-2 border-t border-slate-100 bg-slate-50/50 px-3 py-2 sm:grid-cols-3 lg:grid-cols-6 sm:gap-3 sm:px-4 sm:py-2.5"
        >
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
        </div>
      )}
    </div>
  );
}
