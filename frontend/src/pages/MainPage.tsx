import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type BikeFormData } from '../schemas';
import { getBikes, createBike, updateBike, deleteBike } from '../api';
import { useAuth } from '../contexts/AuthContext';
import BikeFormModal, { type BikeModalMode } from '../components/BikeFormModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import BikeFilters, {
  sanitizeYearFilterInput,
  validateRangeFilters,
} from '../components/BikeFilters';
import BikeTable from '../components/BikeTable';
import type { BikeRow, SortField } from '../types/bike';
import { Bike, LogOut, LogIn } from 'lucide-react';

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
 * ГЛАВНАЯ СТРАНИЦА (/)
 * Состояние, загрузка данных, модалки CRUD; фильтры и таблица — отдельные компоненты.
 */
export default function MainPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // --- СОСТОЯНИЯ ДАННЫХ ---
  const [bikes, setBikes] = useState<BikeRow[]>([]);
  const [total, setTotal] = useState(0);
  const [listError, setListError] = useState<string | null>(null);
  const [activeStatuses, setActiveStatuses] = useState<string[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [mileageFrom, setMileageFrom] = useState('');
  const [mileageTo, setMileageTo] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState<SortField>('brand');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const loadSeqRef = useRef(0);

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
  const hasActiveFilters =
    activeStatuses.length > 0 ||
    searchFilter !== '' ||
    brandFilter !== '' ||
    modelFilter !== '' ||
    yearFrom !== '' ||
    yearTo !== '' ||
    mileageFrom !== '' ||
    mileageTo !== '';

  // Debounce поиска 300 ms (волна E) — в API уходит debouncedSearch
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchFilter);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchFilter]);

  // Загрузка списка байков с бэкенда (фильтр, пагинация, сортировка) — доступна без авторизации
  const loadData = useCallback(() => {
    const seq = ++loadSeqRef.current;
    setListError(null);
    getBikes({
      statuses: activeStatuses,
      search: debouncedSearch,
      brand: brandFilter,
      model: modelFilter,
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
        if (seq !== loadSeqRef.current) return;
        setBikes(res.bikes);
        setTotal(res.total);
        setListError(null);
      })
      .catch((err: { response?: { data?: { error?: string } } }) => {
        if (seq !== loadSeqRef.current) return;
        setBikes([]);
        setTotal(0);
        setListError(err.response?.data?.error || 'Не удалось загрузить список');
      });
  }, [
    activeStatuses,
    debouncedSearch,
    brandFilter,
    modelFilter,
    page,
    limit,
    sortBy,
    sortOrder,
    yearFrom,
    yearTo,
    mileageFrom,
    mileageTo,
  ]);

  useEffect(() => {
    if (hasFilterErrors) return;
    loadData();
  }, [loadData, hasFilterErrors]);

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

  /** Ввод марки/модели: обрезка пробелов по краям не на каждый символ — только длина */
  const handleTextFilterChange =
    (setter: (value: string) => void) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setter(event.target.value.slice(0, 40));
      setPage(1);
    };

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
    setSearchFilter('');
    setDebouncedSearch('');
    setBrandFilter('');
    setModelFilter('');
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

  const openCreateModal = () => {
    setEditingBike(null);
    setModalMode('create');
    setFormServerError(null);
    setModalOpen(true);
  };

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

  const openDeleteModal = (bike: BikeRow) => {
    setDeleteTarget(bike);
    setDeleteError(null);
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;
    setDeleteTarget(null);
    setDeleteError(null);
  };

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

        <BikeFilters
          activeStatuses={activeStatuses}
          search={searchFilter}
          brand={brandFilter}
          model={modelFilter}
          yearFrom={yearFrom}
          yearTo={yearTo}
          mileageFrom={mileageFrom}
          mileageTo={mileageTo}
          filterErrors={filterErrors}
          hasActiveFilters={hasActiveFilters}
          onStatusFilter={handleStatusFilter}
          onSearchChange={handleTextFilterChange(setSearchFilter)}
          onBrandChange={handleTextFilterChange(setBrandFilter)}
          onModelChange={handleTextFilterChange(setModelFilter)}
          onYearFromChange={handleYearFilterChange(setYearFrom)}
          onYearToChange={handleYearFilterChange(setYearTo)}
          onMileageFromChange={handleMileageFilterChange(setMileageFrom)}
          onMileageToChange={handleMileageFilterChange(setMileageTo)}
          onClearSearch={() => {
            setSearchFilter('');
            setDebouncedSearch('');
            setPage(1);
          }}
          onClearBrand={clearFilterField(setBrandFilter)}
          onClearModel={clearFilterField(setModelFilter)}
          onClearYearFrom={clearFilterField(setYearFrom)}
          onClearYearTo={clearFilterField(setYearTo)}
          onClearMileageFrom={clearFilterField(setMileageFrom)}
          onClearMileageTo={clearFilterField(setMileageTo)}
          onClearAll={handleClearAllFilters}
        />

        <BikeTable
          bikes={bikes}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          canCreateOrEdit={canCreateOrEdit}
          canDelete={canDelete}
          isReadOnly={isReadOnly}
          onAdd={openCreateModal}
          onEdit={openEditModal}
          onDelete={openDeleteModal}
          total={total}
          page={page}
          limit={limit}
          totalPages={totalPages}
          onLimitChange={(nextLimit) => {
            setLimit(nextLimit);
            setPage(1);
          }}
          onPrevPage={handlePrevPage}
          onNextPage={handleNextPage}
          listError={listError}
          onRetry={loadData}
        />
      </div>

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
