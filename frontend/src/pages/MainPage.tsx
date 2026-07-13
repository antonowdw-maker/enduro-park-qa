import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bikeSchema, type BikeFormData } from '../schemas';
import { getBikes, createBike } from '../api';
import { useAuth } from '../contexts/AuthContext';
import {
  Bike, Plus, Filter, Check, Wrench, RefreshCcw,
  ChevronLeft, ChevronRight, LogOut, Tag,
} from 'lucide-react';

/**
 * Возвращает текст статуса для отображения в таблице.
 * BUG-01: для repair показываем «В ремонте», а на кнопке фильтра — «Ремонт».
 */
function getStatusLabel(status: string): string {
  if (status === 'available') return 'Доступен';
  if (status === 'repair') return 'В ремонте';
  return 'Продан';
}

/**
 * ГЛАВНАЯ СТРАНИЦА (/)
 * Таблица байков, фильтры, форма добавления, пагинация.
 * Доступна только авторизованным пользователям (через ProtectedRoute).
 */
export default function MainPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // --- СОСТОЯНИЯ ДАННЫХ ---
  const [bikes, setBikes] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [activeStatus, setActiveStatus] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // --- НАСТРОЙКА ФОРМЫ БАЙКА С ВАЛИДАЦИЕЙ ZOD ---
  const { register, handleSubmit, reset, formState: { errors } } = useForm<BikeFormData>({
    resolver: zodResolver(bikeSchema),
    defaultValues: { year: 2024, mileage: 0, status: 'available' },
  });

  // Загрузка списка байков с бэкенда (учитывает фильтр и пагинацию)
  const loadData = () => {
    getBikes(activeStatus, '', page, limit)
      .then((res) => {
        setBikes(res.bikes);
        setTotal(res.total);
      })
      .catch(() => {
        // Сессия протухла — выходим и уходим на логин
        logout().then(() => navigate('/login', { replace: true }));
      });
  };

  // Перезагружаем данные при смене фильтра, страницы или лимита
  useEffect(() => {
    loadData();
  }, [activeStatus, page, limit]);

  // --- ОБРАБОТКА ВЫХОДА (F-AUTH-05: редирект на /login) ---
  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  // --- ОБРАБОТКА ДОБАВЛЕНИЯ БАЙКА ---
  const onAddBike = async (data: BikeFormData) => {
    try {
      await createBike(data);
      loadData();
      reset();
      alert('Успех: Байк добавлен!');
    } catch (err: any) {
      // Здесь мы поймаем ловушку TEST/123 или ошибки валидации с бэкенда
      alert('Ошибка: ' + (err.response?.data?.error || 'Запрос отклонен'));
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  // Применить фильтр по статусу и вернуться на первую страницу (F-FILTER-02)
  const handleStatusFilter = (status: string) => {
    setActiveStatus(status);
    setPage(1);
  };

  // Переход на предыдущую / следующую страницу (F-PAGINATION-02)
  const handlePrevPage = () => setPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setPage((p) => Math.min(totalPages, p + 1));

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      <div className="mx-auto max-w-6xl">

        {/* ШАПКА: логотип, имя пользователя, кнопка выхода */}
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-blue-600 p-3 text-white shadow-lg shadow-blue-200">
              <Bike size={32} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800 uppercase tracking-tighter">
              Enduro Park Manager
            </h1>
          </div>
          <div className="flex items-center gap-4 bg-white p-2 px-4 rounded-full border border-slate-200 shadow-sm">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase leading-none tracking-widest">
                Пользователь
              </span>
              <span className="text-sm font-bold text-blue-600 uppercase leading-tight tracking-tighter">
                {user.username} [{user.role}]
              </span>
            </div>
            <button
              data-testid="logout-btn"
              onClick={handleLogout}
              className="p-2 text-rose-500 hover:bg-rose-50 rounded-full transition-all"
              title="Завершить сеанс"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* ФИЛЬТРЫ ПО СТАТУСУ (F-FILTER-01) */}
        <div className="mb-8 flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <Filter size={18} className="text-slate-400 ml-2" />
            {/* Кнопка «Все» — сбрасывает фильтр по статусу */}
            <button
              data-testid="filter-all"
              onClick={() => handleStatusFilter('')}
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold transition-all ${activeStatus === '' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600'}`}
            >
              <RefreshCcw size={14} /> Все
            </button>
            {/* Кнопка «Доступен» — status = available */}
            <button
              data-testid="filter-available"
              onClick={() => handleStatusFilter('available')}
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold transition-all ${activeStatus === 'available' ? 'bg-emerald-600 text-white shadow-md' : 'bg-emerald-100 text-emerald-700'}`}
            >
              <Check size={14} /> Доступен
            </button>
            {/* BUG-01: текст кнопки «Ремонт» ≠ текст в таблице «В ремонте» */}
            <button
              data-testid="filter-repair"
              onClick={() => handleStatusFilter('repair')}
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold transition-all ${activeStatus === 'repair' ? 'bg-amber-600 text-white shadow-md' : 'bg-amber-100 text-amber-700'}`}
            >
              <Wrench size={14} /> Ремонт
            </button>
            {/* Кнопка «Продан» — status = sold */}
            <button
              data-testid="filter-sold"
              onClick={() => handleStatusFilter('sold')}
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold transition-all ${activeStatus === 'sold' ? 'bg-rose-600 text-white shadow-md' : 'bg-rose-100 text-rose-700'}`}
            >
              <Tag size={14} /> Продан
            </button>
          </div>
          {/* F-PAGINATION-01: выбор количества строк на странице (10 / 20 / 50) */}
          <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <span>Записей:</span>
            <select
              data-testid="pagination-limit"
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
              className="rounded-lg border border-slate-200 bg-white p-1 outline-none text-blue-600 font-black cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/*
          Flex + фиксированная ширина формы (lg:w-96 shrink-0):
          блок «Новый байк» не сужается при появлении/исчезновении скроллбара.
        */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">

          {/* СЕКЦИЯ: ФОРМА ДОБАВЛЕНИЯ — ширина фиксирована, не сжимается при пагинации */}
          <section className="w-full shrink-0 rounded-2xl bg-white p-6 shadow-sm border border-slate-200 lg:w-96">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-700 uppercase tracking-tighter underline decoration-blue-500 decoration-4 underline-offset-4">
              <Plus size={20} className="text-blue-600" /> Новый байк
            </h2>
            <form onSubmit={handleSubmit(onAddBike)} className="space-y-4">
              <div>
                <label className="mb-1 block text-[10px] font-black uppercase text-slate-400 tracking-widest">Марка</label>
                <input
                  {...register('brand')}
                  data-testid="input-brand"
                  className={`w-full rounded-lg border p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold ${errors.brand ? 'border-rose-500 bg-rose-50' : 'border-slate-200'}`}
                  placeholder="Напр. KTM"
                />
                {errors.brand && (
                  <p className="mt-1 text-[10px] text-rose-500 font-bold uppercase">{errors.brand.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-black uppercase text-slate-400 tracking-widest">Модель</label>
                <input
                  {...register('model')}
                  data-testid="input-model"
                  className={`w-full rounded-lg border p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold ${errors.model ? 'border-rose-500 bg-rose-50' : 'border-slate-200'}`}
                  placeholder="Напр. 300 EXC"
                />
                {errors.model && (
                  <p className="mt-1 text-[10px] text-rose-500 font-bold uppercase">{errors.model.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-[10px] font-black uppercase text-slate-400 tracking-widest">Год</label>
                  <input
                    type="number"
                    {...register('year', { valueAsNumber: true })}
                    className={`w-full rounded-lg border p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold ${errors.year ? 'border-rose-500 bg-rose-50' : 'border-slate-200'}`}
                  />
                  {errors.year && (
                    <p className="mt-1 text-[10px] text-rose-500 font-bold uppercase leading-none mt-2">{errors.year.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-black uppercase text-slate-400 tracking-widest">Пробег</label>
                  <input
                    type="number"
                    {...register('mileage', { valueAsNumber: true })}
                    className={`w-full rounded-lg border p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold ${errors.mileage ? 'border-rose-500 bg-rose-50' : 'border-slate-200'}`}
                  />
                  {errors.mileage && (
                    <p className="mt-1 text-[10px] text-rose-500 font-bold uppercase leading-none mt-2">{errors.mileage.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-black uppercase text-slate-400 tracking-widest">VIN (17 знаков)</label>
                <input
                  {...register('vin')}
                  className={`w-full rounded-lg border p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm transition-all ${errors.vin ? 'border-rose-500 bg-rose-50 text-rose-900' : 'border-slate-200'}`}
                  placeholder="Уникальный номер..."
                />
                {errors.vin && (
                  <p className="mt-1 text-[10px] text-rose-500 font-bold uppercase">{errors.vin.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-black uppercase text-slate-400 tracking-widest">Статус в парке</label>
                <select
                  {...register('status')}
                  className="w-full rounded-lg border border-slate-200 p-2.5 outline-none bg-white font-bold text-slate-700 cursor-pointer"
                >
                  <option value="available">Доступен</option>
                  <option value="repair">В ремонте</option>
                  <option value="sold">Продан</option>
                </select>
              </div>

              <button
                type="submit"
                data-testid="btn-submit"
                className="w-full rounded-xl bg-blue-600 py-4 font-black text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-[0.98] mt-4 uppercase tracking-widest text-xs"
              >
                Добавить в базу
              </button>
            </form>
          </section>

          {/* СЕКЦИЯ: ТАБЛИЦА — высота по количеству строк (без искусственного растягивания) */}
          <section className="min-w-0 flex-1">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50 font-black text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Мотоцикл</th>
                    <th className="px-6 py-4 text-center">Год</th>
                    <th className="px-6 py-4">VIN-код</th>
                    <th className="px-6 py-4 text-right">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bikes.map((bike) => (
                    <tr key={bike.id} data-testid={`bike-row-${bike.vin}`} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-700 leading-tight">
                        <div className="uppercase tracking-tighter text-blue-600 font-black">{bike.brand}</div>
                        <div className="text-slate-400 text-[10px] font-bold uppercase italic tracking-widest">{bike.model}</div>
                      </td>
                      <td className="px-6 py-4 text-center text-slate-500 font-black">{bike.year}</td>
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-blue-500">{bike.vin}</td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`inline-flex items-center rounded-md px-3 py-1 text-[9px] font-black uppercase tracking-widest border ${
                            bike.status === 'available'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : bike.status === 'repair'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {getStatusLabel(bike.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* F-PAGINATION-02: навигация по страницам таблицы */}
              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Всего в базе: {total}</span>
                <div className="flex items-center gap-4">
                  <button
                    data-testid="pagination-prev"
                    type="button"
                    disabled={page === 1}
                    onClick={handlePrevPage}
                    title="Предыдущая страница"
                    aria-label="Предыдущая страница"
                    className="p-2 rounded-full border border-slate-200 bg-white shadow-sm disabled:opacity-30 transition-all hover:bg-slate-100"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">
                    СТРАНИЦА {page} ИЗ {totalPages}
                  </span>
                  <button
                    data-testid="pagination-next"
                    type="button"
                    disabled={page === totalPages}
                    onClick={handleNextPage}
                    title="Следующая страница"
                    aria-label="Следующая страница"
                    className="p-2 rounded-full border border-slate-200 bg-white shadow-sm disabled:opacity-30 transition-all hover:bg-slate-100"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
