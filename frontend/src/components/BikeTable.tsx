import {
  Plus, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Pencil, Trash2,
} from 'lucide-react';
import type { BikeRow, SortField } from '../types/bike';

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

function statusBadgeClass(status: string): string {
  if (status === 'available') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'repair') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-rose-200 bg-rose-50 text-rose-700';
}

/**
 * КЛИКАБЕЛЬНЫЙ ЗАГОЛОВОК КОЛОНКИ (F-SORT-01, F-SORT-02, F-A11Y-02)
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
  const active = sortBy === field;
  const ariaSort = active ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none';

  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={`px-4 py-3 ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'}`}
    >
      <button
        type="button"
        data-testid={testId}
        onClick={() => onSort(field)}
        aria-label={`Сортировать по полю ${label}${active ? `, сейчас ${sortOrder === 'asc' ? 'по возрастанию' : 'по убыванию'}` : ''}`}
        className={`inline-flex w-full items-center gap-1 text-[10px] font-black uppercase tracking-widest transition-colors hover:text-blue-600 ${alignClass} ${active ? 'text-blue-600' : 'text-slate-400'}`}
      >
        {label}
        {active && (sortOrder === 'asc' ? <ArrowUp size={12} aria-hidden /> : <ArrowDown size={12} aria-hidden />)}
      </button>
    </th>
  );
}

/** Кнопки действий строки / карточки (F-A11Y-01) */
function BikeActions({
  bike,
  canCreateOrEdit,
  canDelete,
  isReadOnly,
  onEdit,
  onDelete,
}: {
  bike: BikeRow;
  canCreateOrEdit: boolean;
  canDelete: boolean;
  isReadOnly: boolean;
  onEdit: (bike: BikeRow) => void;
  onDelete: (bike: BikeRow) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      {canCreateOrEdit && (
        <button
          type="button"
          data-testid={`edit-bike-${bike.vin}`}
          onClick={() => onEdit(bike)}
          title="Редактировать"
          aria-label={`Редактировать байк ${bike.brand} ${bike.model}, VIN ${bike.vin}`}
          className="rounded-lg border border-slate-200 p-1.5 text-blue-600 transition-all hover:bg-blue-50"
        >
          <Pencil size={14} aria-hidden />
        </button>
      )}
      {canDelete && (
        <button
          type="button"
          data-testid={`delete-bike-${bike.vin}`}
          onClick={() => onDelete(bike)}
          title="Удалить"
          aria-label={`Удалить байк ${bike.brand} ${bike.model}, VIN ${bike.vin}`}
          className="rounded-lg border border-slate-200 p-1.5 text-rose-600 transition-all hover:bg-rose-50"
        >
          <Trash2 size={14} aria-hidden />
        </button>
      )}
      {isReadOnly && (
        <span data-testid="actions-readonly-placeholder" className="text-slate-300">—</span>
      )}
    </div>
  );
}

export type BikeTableProps = {
  bikes: BikeRow[];
  sortBy: SortField;
  sortOrder: 'asc' | 'desc';
  onSort: (field: SortField) => void;
  canCreateOrEdit: boolean;
  canDelete: boolean;
  isReadOnly: boolean;
  onAdd: () => void;
  onEdit: (bike: BikeRow) => void;
  onDelete: (bike: BikeRow) => void;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  onLimitChange: (limit: number) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  /** Ошибка загрузки списка (волна E); null — нет ошибки */
  listError?: string | null;
  onRetry?: () => void;
};

/**
 * ТАБЛИЦА БАЙКОВ + ПАГИНАЦИЯ (F-BIKE-LIST, F-SORT, F-PAGINATION, F-A11Y, F-MOBILE)
 * Desktop: таблица; < md: карточки без горизонтального скролла.
 */
export default function BikeTable({
  bikes,
  sortBy,
  sortOrder,
  onSort,
  canCreateOrEdit,
  canDelete,
  isReadOnly,
  onAdd,
  onEdit,
  onDelete,
  total,
  page,
  limit,
  totalPages,
  onLimitChange,
  onPrevPage,
  onNextPage,
  listError = null,
  onRetry,
}: BikeTableProps) {
  const actionProps = {
    canCreateOrEdit,
    canDelete,
    isReadOnly,
    onEdit,
    onDelete,
  };

  return (
    <section>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Реестр мотоциклов
          </span>
          {canCreateOrEdit && (
            <button
              type="button"
              data-testid="add-bike-btn"
              onClick={onAdd}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white shadow-md shadow-blue-200 transition-all hover:bg-blue-700"
            >
              <Plus size={16} aria-hidden /> Добавить байк
            </button>
          )}
        </div>

        {listError ? (
          <div
            data-testid="list-error"
            className="flex flex-col items-center gap-3 px-4 py-10 text-center"
            role="alert"
          >
            <p className="text-sm font-bold text-rose-600">{listError}</p>
            {onRetry && (
              <button
                type="button"
                data-testid="list-retry"
                onClick={onRetry}
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-rose-700 transition-all hover:bg-rose-100"
              >
                Повторить
              </button>
            )}
          </div>
        ) : bikes.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <span data-testid="list-empty" className="text-sm font-bold text-slate-400">
              Ничего не найдено
            </span>
          </div>
        ) : (
          <>
            {/* Mobile sort — вместо thead на узком viewport */}
            <div
              data-testid="mobile-sort"
              className="flex flex-wrap items-end gap-3 border-b border-slate-100 px-4 py-3 md:hidden"
            >
              <label className="min-w-0 flex-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Сортировка
                <select
                  data-testid="mobile-sort-field"
                  value={sortBy}
                  onChange={(event) => {
                    const field = event.target.value as SortField;
                    if (field !== sortBy) onSort(field);
                  }}
                  className="mt-1 block w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-bold normal-case tracking-normal text-slate-700 outline-none"
                >
                  <option value="brand">Марка</option>
                  <option value="model">Модель</option>
                  <option value="year">Год</option>
                  <option value="vin">VIN</option>
                  <option value="mileage">Пробег</option>
                  <option value="status">Статус</option>
                  <option value="lastService">Последнее ТО</option>
                </select>
              </label>
              <button
                type="button"
                data-testid="mobile-sort-order"
                onClick={() => onSort(sortBy)}
                aria-label={
                  sortOrder === 'asc' ? 'Сортировка по возрастанию, нажать для убывания' : 'Сортировка по убыванию, нажать для возрастания'
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-blue-600"
              >
                {sortOrder === 'asc' ? <ArrowUp size={14} aria-hidden /> : <ArrowDown size={14} aria-hidden />}
                {sortOrder === 'asc' ? 'По возр.' : 'По убыв.'}
              </button>
            </div>

            {/* Mobile cards — F-MOBILE-01 (без min-w / горизонтального скролла) */}
            <div className="divide-y divide-slate-100 md:hidden" data-testid="bike-cards">
              {bikes.map((bike) => (
                <article
                  key={bike.id}
                  data-testid={`bike-card-${bike.vin}`}
                  className="space-y-2 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-black uppercase tracking-tighter text-blue-600">
                        {bike.brand}{' '}
                        <span className="text-xs font-bold uppercase italic tracking-widest text-slate-500">
                          {bike.model}
                        </span>
                      </p>
                      <p className="mt-1 font-mono text-xs font-semibold text-blue-500">{bike.vin}</p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center rounded-md border px-2 py-1 text-[9px] font-black uppercase tracking-widest ${statusBadgeClass(bike.status)}`}
                    >
                      {getStatusLabel(bike.status)}
                    </span>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-600">
                    <div>
                      <dt className="text-[9px] font-black uppercase tracking-widest text-slate-400">Год</dt>
                      <dd className="font-semibold">{bike.year}</dd>
                    </div>
                    <div>
                      <dt className="text-[9px] font-black uppercase tracking-widest text-slate-400">Пробег</dt>
                      <dd className="font-semibold">{formatMileage(bike.mileage)}</dd>
                    </div>
                    <div>
                      <dt className="text-[9px] font-black uppercase tracking-widest text-slate-400">Последнее ТО</dt>
                      <dd className="font-semibold">
                        {bike.lastService ? formatLastService(bike.lastService) : '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[9px] font-black uppercase tracking-widest text-slate-400">Заметки</dt>
                      <dd className="truncate font-semibold" title={bike.notes || ''}>
                        {bike.notes || '—'}
                      </dd>
                    </div>
                  </dl>
                  <BikeActions bike={bike} {...actionProps} />
                </article>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <SortableHeader testId="sort-brand" field="brand" label="Марка" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
                    <SortableHeader testId="sort-model" field="model" label="Модель" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
                    <SortableHeader testId="sort-year" field="year" label="Год" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} align="center" />
                    <SortableHeader testId="sort-vin" field="vin" label="VIN" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
                    <SortableHeader testId="sort-mileage" field="mileage" label="Пробег" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} align="right" />
                    <SortableHeader testId="sort-status" field="status" label="Статус" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} align="center" />
                    <SortableHeader testId="sort-lastService" field="lastService" label="Последнее ТО" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} align="center" />
                    <th scope="col" className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Заметки</th>
                    <th scope="col" className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Действия</th>
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
                          className={`inline-flex items-center rounded-md border px-2 py-1 text-[9px] font-black uppercase tracking-widest ${statusBadgeClass(bike.status)}`}
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
                        <BikeActions bike={bike} {...actionProps} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 bg-slate-50/50 p-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Всего в базе: {total}
          </span>
          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
            Записей на странице
            <select
              data-testid="pagination-limit"
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
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
              onClick={onPrevPage}
              title="Предыдущая страница"
              aria-label="Предыдущая страница"
              className="rounded-full border border-slate-200 bg-white p-2 shadow-sm transition-all hover:bg-slate-100 disabled:opacity-30"
            >
              <ChevronLeft size={20} aria-hidden />
            </button>
            <span className="text-[10px] font-black uppercase tracking-tighter text-blue-600">
              СТРАНИЦА {page} ИЗ {totalPages}
            </span>
            <button
              data-testid="pagination-next"
              type="button"
              disabled={page === totalPages}
              onClick={onNextPage}
              title="Следующая страница"
              aria-label="Следующая страница"
              className="rounded-full border border-slate-200 bg-white p-2 shadow-sm transition-all hover:bg-slate-100 disabled:opacity-30"
            >
              <ChevronRight size={20} aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
