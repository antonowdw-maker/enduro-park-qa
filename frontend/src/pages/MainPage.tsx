import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type BikeFormData } from '../schemas';
import { getBikes, createBike, updateBike, deleteBike } from '../api';
import { useAuth } from '../contexts/AuthContext';
import BikeFormModal, { type BikeModalMode } from '../components/BikeFormModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import {
  Bike, Plus, Filter, Check, Wrench, RefreshCcw,
  ChevronLeft, ChevronRight, LogOut, LogIn, Tag, ArrowUp, ArrowDown,
  Pencil, Trash2, X,
} from 'lucide-react';

/** Поля, по которым разрешена сортировка (F-SORT-01) */
type SortField = 'brand' | 'model' | 'year' | 'vin' | 'mileage' | 'status' | 'lastService';

/** Строка таблицы байков с бэкенда */
type BikeRow = {
  id: string;
  brand: string;
  model: string;
  year: number;
  vin: string;
  mileage: number;
  status: string;
  lastService: string;
  notes?: string | null;
};

/**
 * Возвращает текст статуса для отображения в таблице.
 * BUG-01: для repair показываем «В ремонте», а на кнопке фильтра — «Ремонт».
 */
function getStatusLabel(status: string): string {
  if (status === 'available') return 'Доступен';
  if (status === 'repair') return 'В ремонте';
  return 'Продан';
}

/** Форматирование даты последнего ТО для колонки таблицы */
function formatLastService(value: string): string {
  return new Date(value).toLocaleDateString('ru-RU');
}

/** Форматирование пробега с разделителем тысяч */
function formatMileage(km: number): string {
  return `${km.toLocaleString('ru-RU')} км`;
}

/** Преобразование байка из API в значения формы модалки */
function bikeToFormValues(bike: BikeRow): Partial<BikeFormData> {
  return {
    brand: bike.brand,
    model: bike.model,
    year: bike.year,
    vin: bike.vin,
    mileage: bike.mileage,
    status: bike.status as BikeFormData['status'],
    lastService: new Date(bike.lastService).toISOString().slice(0, 10),
    notes: bike.notes ?? '',
  };
}

/**
 * КЛИКАБЕЛЬНЫЙ ЗАГОЛОВОК КОЛОНКИ (F-SORT-01, F-SORT-02)
 * Первый клик — по возрастанию, повторный — по убыванию.
 */
function SortableHeader({
  testId,
  field,
  label,
  sortBy,
  sortOrder,
  onSort,
  align = 'left',
}: {
  testId: string;
  field: SortField;
  label: string;
  sortBy: SortField;
  sortOrder: 'asc' | 'desc';
  onSort: (field: SortField) => void;
  align?: 'left' | 'center' | 'right';
}) {
  const alignClass =
    align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start';

  return (
    <th className={`px-4 py-3 ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'}`}>
      <button
        type="button"
        data-testid={testId}
        onClick={() => onSort(field)}
        className={`inline-flex w-full items-center gap-1 text-[10px] font-black uppercase tracking-widest transition-colors hover:text-blue-600 ${alignClass} ${sortBy === field ? 'text-blue-600' : 'text-slate-400'}`}
      >
        {label}
        {sortBy === field && (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
      </button>
    </th>
  );
}

type FilterFieldKey = 'yearFrom' | 'yearTo' | 'mileageFrom' | 'mileageTo';

const MAX_YEAR_FILTER_DIGITS = 4;

/** Ввод года в фильтре: только цифры, не более 4 символов */
function sanitizeYearFilterInput(value: string): string | null {
  if (value === '') return '';
  if (!/^\d+$/.test(value)) return null;
  if (value.length > MAX_YEAR_FILTER_DIGITS) return null;
  return value;
}

/** Проверка диапазонных фильтров: неотрицательные значения, «до» ≥ «от» */
function validateRangeFilters(
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

/** Поле числового фильтра с кнопкой очистки (×) — разметка как в форме байка */
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

/**
 * ГЛАВНАЯ СТРАНИЦА (/)
 * Таблица байков, фильтры, модалка CRUD, пагинация.
 */
export default function MainPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // --- СОСТОЯНИЯ ДАННЫХ ---
  const [bikes, setBikes] = useState<BikeRow[]>([]);
  const [total, setTotal] = useState(0);
  const [activeStatuses, setActiveStatuses] = useState<string[]>([]);
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [mileageFrom, setMileageFrom] = useState('');
  const [mileageTo, setMileageTo] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState<SortField>('brand');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // --- МОДАЛЬНОЕ ОКНО ФОРМЫ (F-BIKE-CREATE / F-BIKE-EDIT) ---
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<BikeModalMode>('create');
  const [editingBike, setEditingBike] = useState<BikeRow | null>(null);
  const [formServerError, setFormServerError] = useState<string | null>(null);

  // --- ПОДТВЕРЖДЕНИЕ УДАЛЕНИЯ (модалка вместо window.confirm) ---
  const [deleteTarget, setDeleteTarget] = useState<BikeRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Ролевая модель (TC-ROLE-01…02): без входа — только просмотр; mechanic — без удаления; admin — полный доступ
  const canCreateOrEdit = user?.role === 'admin' || user?.role === 'mechanic';
  const canDelete = user?.role === 'admin';
  const isReadOnly = !canCreateOrEdit && !canDelete;

  const filterErrors = useMemo(
    () => validateRangeFilters(yearFrom, yearTo, mileageFrom, mileageTo),
    [yearFrom, yearTo, mileageFrom, mileageTo],
  );
  const hasFilterErrors = Object.keys(filterErrors).length > 0;
  const hasActiveFilters = activeStatuses.length > 0 || yearFrom !== '' || yearTo !== '' || mileageFrom !== '' || mileageTo !== '';

  // Загрузка списка байков с бэкенда (фильтр, пагинация, сортировка) — доступна без авторизации
  const loadData = () => {
    getBikes({
      statuses: activeStatuses,
      page,
      limit,
      sortBy,
      order: sortOrder,
      yearFrom,
      yearTo,
      mileageFrom,
      mileageTo,
    })
      .then((res) => {
        setBikes(res.bikes);
        setTotal(res.total);
      })
      .catch(() => {
        setBikes([]);
        setTotal(0);
      });
  };

  useEffect(() => {
    if (hasFilterErrors) return;
    loadData();
  }, [activeStatuses, yearFrom, yearTo, mileageFrom, mileageTo, page, limit, sortBy, sortOrder, hasFilterErrors]);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const totalPages = Math.ceil(total / limit) || 1;

  /** Мультивыбор статусов: повторный клик снимает фильтр; «Все» — сброс */
  const handleStatusFilter = (status: string) => {
    if (status === '') {
      setActiveStatuses([]);
      setPage(1);
      return;
    }

    setActiveStatuses((prev) => {
      if (prev.includes(status)) {
        return prev.filter((item) => item !== status);
      }
      return [...prev, status];
    });
    setPage(1);
  };

  const isStatusFilterActive = (status: string) => activeStatuses.includes(status);

  /** Ввод года: только цифры, максимум 4 */
  const handleYearFilterChange = (
    setter: (value: string) => void,
  ) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = sanitizeYearFilterInput(event.target.value);
    if (next === null) return;

    setter(next);
    setPage(1);
  };

  /** Ввод пробега: только неотрицательные числа */
  const handleMileageFilterChange = (
    setter: (value: string) => void,
  ) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    if (next === '') {
      setter('');
      setPage(1);
      return;
    }
    if (next.includes('-')) return;

    const num = Number(next);
    if (Number.isNaN(num) || num < 0) return;

    setter(next);
    setPage(1);
  };

  const clearFilterField = (setter: (value: string) => void) => () => {
    setter('');
    setPage(1);
  };

  const handleClearAllFilters = () => {
    setActiveStatuses([]);
    setYearFrom('');
    setYearTo('');
    setMileageFrom('');
    setMileageTo('');
    setPage(1);
  };

  const handlePrevPage = () => setPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setPage((p) => Math.min(totalPages, p + 1));

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder((order) => (order === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  // Открыть модалку в режиме создания (F-BIKE-CREATE-01)
  const openCreateModal = () => {
    setEditingBike(null);
    setModalMode('create');
    setFormServerError(null);
    setModalOpen(true);
  };

  // Открыть модалку в режиме редактирования (F-BIKE-EDIT-01)
  const openEditModal = (bike: BikeRow) => {
    setEditingBike(bike);
    setModalMode('edit');
    setFormServerError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingBike(null);
    setFormServerError(null);
  };

  // Сохранение формы: создание или обновление
  const handleFormSubmit = async (data: BikeFormData) => {
    try {
      if (modalMode === 'create') {
        await createBike(data);
      } else if (editingBike) {
        await updateBike(editingBike.id, data);
      }
      closeModal();
      loadData();
    } catch (err: any) {
      setFormServerError(err.response?.data?.error || 'Запрос отклонен');
    }
  };

  // Открыть модалку подтверждения удаления
  const openDeleteModal = (bike: BikeRow) => {
    setDeleteTarget(bike);
    setDeleteError(null);
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;
    setDeleteTarget(null);
    setDeleteError(null);
  };

  // Подтверждённое удаление (F-BIKE-DELETE-02)
  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteBike(deleteTarget.id);
      setDeleteTarget(null);
      loadData();
    } catch (err: any) {
      setDeleteError(err.response?.data?.error || 'Не удалось удалить');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      <div className="mx-auto max-w-[88rem]">

        {/* ШАПКА */}
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-blue-600 p-3 text-white shadow-lg shadow-blue-200">
              <Bike size={32} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800 uppercase tracking-tighter">
              Enduro Park Manager
            </h1>
          </div>
          <div className="flex items-center gap-4 rounded-full border border-slate-200 bg-white p-2 px-4 shadow-sm">
            {user ? (
              <>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black uppercase leading-none tracking-widest text-slate-400">
                    Пользователь
                  </span>
                  <span className="text-sm font-bold uppercase leading-tight tracking-tighter text-blue-600">
                    <span data-testid="user-username">{user.username}</span>
                    {' '}
                    [<span data-testid="user-role">{user.role}</span>]
                  </span>
                </div>
                <button
                  data-testid="logout-btn"
                  onClick={handleLogout}
                  className="rounded-full p-2 text-rose-500 transition-all hover:bg-rose-50"
                  title="Завершить сеанс"
                >
                  <LogOut size={20} />
                </button>
              </>
            ) : (
              <button
                type="button"
                data-testid="header-login-btn"
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white shadow-md transition-all hover:bg-blue-700"
              >
                <LogIn size={16} /> Войти
              </button>
            )}
          </div>
        </header>

        {/* ФИЛЬТРЫ ПО СТАТУСУ (F-FILTER-01) и диапазоны год/пробег (F-FILTER-03…05) */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center p-4">
            <div className="flex items-center gap-3">
              <Filter size={18} className="ml-2 text-slate-400" />
              <button
                data-testid="filter-all"
                onClick={() => handleStatusFilter('')}
                className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold transition-all ${activeStatuses.length === 0 ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600'}`}
              >
                <RefreshCcw size={14} /> Все
              </button>
              <button
                data-testid="filter-available"
                onClick={() => handleStatusFilter('available')}
                className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold transition-all ${isStatusFilterActive('available') ? 'bg-emerald-600 text-white shadow-md' : 'bg-emerald-100 text-emerald-700'}`}
              >
                <Check size={14} /> Доступен
              </button>
              <button
                data-testid="filter-repair"
                onClick={() => handleStatusFilter('repair')}
                className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold transition-all ${isStatusFilterActive('repair') ? 'bg-amber-600 text-white shadow-md' : 'bg-amber-100 text-amber-700'}`}
              >
                <Wrench size={14} /> Ремонт
              </button>
              <button
                data-testid="filter-sold"
                onClick={() => handleStatusFilter('sold')}
                className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold transition-all ${isStatusFilterActive('sold') ? 'bg-rose-600 text-white shadow-md' : 'bg-rose-100 text-rose-700'}`}
              >
              <Tag size={14} /> Продан
            </button>
            </div>
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
              onChange={handleYearFilterChange(setYearFrom)}
              onClear={clearFilterField(setYearFrom)}
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
              onChange={handleYearFilterChange(setYearTo)}
              onClear={clearFilterField(setYearTo)}
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
              onChange={handleMileageFilterChange(setMileageFrom)}
              onClear={clearFilterField(setMileageFrom)}
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
              onChange={handleMileageFilterChange(setMileageTo)}
              onClear={clearFilterField(setMileageTo)}
            />
            <button
              type="button"
              data-testid="filter-clear-all"
              onClick={handleClearAllFilters}
              disabled={!hasActiveFilters}
              className="mt-6 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <X size={14} /> Сбросить всё
            </button>
          </div>
        </div>

        {/* ТАБЛИЦА (F-BIKE-LIST-01) */}
        <section>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Панель над таблицей: кнопка «Добавить байк» (F-BIKE-CREATE-01) */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Реестр мотоциклов
              </span>
              {canCreateOrEdit && (
                <button
                  type="button"
                  data-testid="add-bike-btn"
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white shadow-md shadow-blue-200 transition-all hover:bg-blue-700"
                >
                  <Plus size={16} /> Добавить байк
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <SortableHeader testId="sort-brand" field="brand" label="Марка" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                    <SortableHeader testId="sort-model" field="model" label="Модель" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                    <SortableHeader testId="sort-year" field="year" label="Год" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} align="center" />
                    <SortableHeader testId="sort-vin" field="vin" label="VIN" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                    <SortableHeader testId="sort-mileage" field="mileage" label="Пробег" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} align="right" />
                    <SortableHeader testId="sort-status" field="status" label="Статус" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} align="center" />
                    <SortableHeader testId="sort-lastService" field="lastService" label="Последнее ТО" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} align="center" />
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Заметки</th>
                    <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bikes.map((bike) => (
                    <tr key={bike.id} data-testid={`bike-row-${bike.vin}`} className="transition-colors hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-black uppercase tracking-tighter text-blue-600">{bike.brand}</td>
                      <td className="px-4 py-3 text-xs font-bold uppercase italic tracking-widest text-slate-500">{bike.model}</td>
                      <td className="px-4 py-3 text-center font-black text-slate-500">{bike.year}</td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-500">{bike.vin}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-600">{formatMileage(bike.mileage)}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center rounded-md border px-2 py-1 text-[9px] font-black uppercase tracking-widest ${
                            bike.status === 'available'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : bike.status === 'repair'
                                ? 'border-amber-200 bg-amber-50 text-amber-700'
                                : 'border-rose-200 bg-rose-50 text-rose-700'
                          }`}
                        >
                          {getStatusLabel(bike.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs font-semibold text-slate-500">
                        {bike.lastService ? formatLastService(bike.lastService) : '—'}
                      </td>
                      <td className="max-w-[8rem] truncate px-4 py-3 text-xs text-slate-500" title={bike.notes || ''}>
                        {bike.notes || '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {canCreateOrEdit && (
                            <button
                              type="button"
                              data-testid={`edit-bike-${bike.vin}`}
                              onClick={() => openEditModal(bike)}
                              title="Редактировать"
                              className="rounded-lg border border-slate-200 p-1.5 text-blue-600 transition-all hover:bg-blue-50"
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              data-testid={`delete-bike-${bike.vin}`}
                              onClick={() => openDeleteModal(bike)}
                              title="Удалить"
                              className="rounded-lg border border-slate-200 p-1.5 text-rose-600 transition-all hover:bg-rose-50"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                          {isReadOnly && (
                            <span data-testid="actions-readonly-placeholder" className="text-slate-300">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 bg-slate-50/50 p-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Всего в базе: {total}
              </span>
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                Записей на странице
                <select
                  data-testid="pagination-limit"
                  value={limit}
                  onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                  className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2 py-1 font-black text-blue-600 outline-none"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </label>
              <div className="ml-auto flex items-center gap-4">
                <button
                  data-testid="pagination-prev"
                  type="button"
                  disabled={page === 1}
                  onClick={handlePrevPage}
                  title="Предыдущая страница"
                  aria-label="Предыдущая страница"
                  className="rounded-full border border-slate-200 bg-white p-2 shadow-sm transition-all hover:bg-slate-100 disabled:opacity-30"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="text-[10px] font-black uppercase tracking-tighter text-blue-600">
                  СТРАНИЦА {page} ИЗ {totalPages}
                </span>
                <button
                  data-testid="pagination-next"
                  type="button"
                  disabled={page === totalPages}
                  onClick={handleNextPage}
                  title="Следующая страница"
                  aria-label="Следующая страница"
                  className="rounded-full border border-slate-200 bg-white p-2 shadow-sm transition-all hover:bg-slate-100 disabled:opacity-30"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Модальное окно добавления / редактирования */}
      <BikeFormModal
        open={modalOpen}
        mode={modalMode}
        initialValues={editingBike ? bikeToFormValues(editingBike) : null}
        serverError={formServerError}
        onClose={closeModal}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDeleteModal
        open={deleteTarget !== null}
        title="Удалить байк?"
        description={
          deleteTarget
            ? `${deleteTarget.brand} ${deleteTarget.model} · VIN ${deleteTarget.vin}. Это действие нельзя отменить.`
            : ''
        }
        error={deleteError}
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
        onCancel={closeDeleteModal}
      />
    </div>
  );
}
