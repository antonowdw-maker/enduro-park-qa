import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { bikeSchema, type BikeFormData } from './schemas'
import { getBikes, createBike } from './api'
import { 
  Bike, Plus, Filter, Check, Wrench, X, RefreshCcw, 
  ChevronLeft, ChevronRight, Hash, Calendar, Tag, Package, Gauge
} from 'lucide-react'

function App() {
  // --- СОСТОЯНИЯ (Для пагинации и данных) ---
  const [bikes, setBikes] = useState<any[]>([])
  const [total, setTotal] = useState(0) // Общее кол-во в базе
  const [activeStatus, setActiveStatus] = useState('')
  const [page, setPage] = useState(1) // Текущая страница
  const [limit, setLimit] = useState(10) // Сколько штук на странице (10/20/50)

  // --- НАСТРОЙКА ФОРМЫ ---
  const { register, handleSubmit, reset, formState: { errors } } = useForm<BikeFormData>({
    resolver: zodResolver(bikeSchema),
    defaultValues: { year: 2024, mileage: 0, status: 'available' }
  })

  // --- ЗАГРУЗКА ДАННЫХ (с учетом всех фильтров) ---
  const loadData = () => {
    // Вызываем API и передаем статус, пустой поиск, страницу и лимит
    getBikes(activeStatus, '', page, limit).then(res => {
      setBikes(res.bikes)
      setTotal(res.total)
    })
  }

  // Следим за изменениями: если сменили страницу, лимит или фильтр - грузим данные
  useEffect(() => {
    loadData()
  }, [activeStatus, page, limit])

  // --- ОТПРАВКА ФОРМЫ ---
  const onSubmit = async (data: BikeFormData) => {
    try {
      await createBike(data)
      loadData() // Обновляем текущую страницу
      reset()
      alert('Успех: Мотоцикл добавлен в систему!')
    } catch (err: any) {
      alert('Ошибка: ' + (err.response?.data?.error || 'Сервер отклонил запрос'));
    }
  }

  // Расчет общего количества страниц для кнопок навигации
  const totalPages = Math.ceil(total / limit) || 1

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      <div className="mx-auto max-w-6xl">
        
        <header className="mb-10 flex items-center gap-4">
          <div className="rounded-xl bg-blue-600 p-3 text-white shadow-lg"><Bike size={32} /></div>
          <h1 className="text-3xl font-bold tracking-tight">Enduro Park <span className="text-blue-600">QA-Stand</span></h1>
        </header>

        {/* --- ПАНЕЛЬ ФИЛЬТРОВ И ВЫБОРА ЛИМИТА --- */}
        <div className="mb-8 flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <Filter size={18} className="text-slate-400 ml-2" />
            <button onClick={() => {setActiveStatus(''); setPage(1)}} className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${activeStatus === '' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600'}`}><RefreshCcw size={14} /> Все</button>
            <button onClick={() => {setActiveStatus('available'); setPage(1)}} className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${activeStatus === 'available' ? 'bg-emerald-600 text-white shadow-md' : 'bg-emerald-100 text-emerald-700'}`}><Check size={14} /> Доступен</button>
            <button onClick={() => {setActiveStatus('repair'); setPage(1)}} className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${activeStatus === 'repair' ? 'bg-amber-600 text-white shadow-md' : 'bg-amber-100 text-amber-700'}`}><Wrench size={14} /> Ремонт</button>
          </div>
          
          {/* ВЫБОР ЛИМИТА (QA-Кейс: Проверь, как перерисовывается таблица) */}
          <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
            <span>Показывать по:</span>
            <select 
              data-testid="select-limit"
              value={limit} 
              onChange={(e) => {setLimit(Number(e.target.value)); setPage(1)}}
              className="rounded-lg border border-slate-200 bg-white p-1.5 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value={10}>10 штук</option>
              <option value={20}>20 штук</option>
              <option value={50}>50 штук</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
          {/* --- СЕКЦИЯ: ФОРМА ДОБАВЛЕНИЯ --- */}
          <section className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 h-fit">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-700"><Plus size={20} className="text-blue-600" /> Новый байк</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-400">Марка</label>
                <input {...register('brand')} data-testid="input-brand" className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:ring-2 focus:ring-blue-500" placeholder="KTM" />
                {errors.brand && <p className="mt-1 text-[10px] text-rose-500 font-bold">{errors.brand.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-400">Модель</label>
                <input {...register('model')} data-testid="input-model" className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:ring-2 focus:ring-blue-500" placeholder="300 EXC" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-400">Год</label>
                  <input type="number" {...register('year', { valueAsNumber: true })} className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-400">Пробег</label>
                  <input type="number" {...register('mileage', { valueAsNumber: true })} className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-400">VIN (17 символов)</label>
                <input {...register('vin')} className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm" placeholder="VIN..." />
                {errors.vin && <p className="mt-1 text-[10px] text-rose-500 font-bold uppercase">{errors.vin.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-400">Статус</label>
                <select {...register('status')} className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="available">Доступен</option>
                  <option value="repair">В ремонте</option>
                  <option value="sold">Продан</option>
                </select>
              </div>
              <button type="submit" data-testid="btn-submit" className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-[0.98] mt-4">Добавить в базу</button>
            </form>
          </section>

          {/* --- СЕКЦИЯ: ТАБЛИЦА С ПАГИНАЦИЕЙ --- */}
          <section className="lg:col-span-2">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50 font-semibold text-slate-500 uppercase tracking-wider">
                  <tr><th className="px-6 py-4">Мотоцикл</th><th className="px-6 py-4 text-center">Год</th><th className="px-6 py-4">VIN-код</th><th className="px-6 py-4 text-right">Статус</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bikes.map((bike) => (
                    <tr key={bike.id} data-testid={`bike-row-${bike.vin}`} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4"><div className="font-bold text-slate-700">{bike.brand}</div><div className="text-slate-400 text-xs italic">{bike.model}</div></td>
                      <td className="px-6 py-4 text-center text-slate-500 font-medium">{bike.year}</td>
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-blue-500 tracking-tighter">{bike.vin}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
                          bike.status === 'available' ? 'bg-emerald-100 text-emerald-700' :
                          bike.status === 'repair' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {bike.status === 'available' ? 'Доступен' : bike.status === 'repair' ? 'В ремонте' : 'Продан'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* --- БЛОК НАВИГАЦИИ (СТРЕЛКИ) --- */}
              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-4">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Всего байков: {total}</span>
                
                <div className="flex items-center gap-4">
                  <button 
                    data-testid="page-prev"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="p-2 rounded-full hover:bg-white border border-slate-200 disabled:opacity-30 transition-all shadow-sm bg-white/50"
                  >
                    <ChevronLeft size={20} className="text-slate-600" />
                  </button>
                  
                  <span className="text-xs font-black text-blue-600 uppercase tracking-tighter">
                    СТРАНИЦА {page} ИЗ {totalPages}
                  </span>
                  
                  <button 
                    data-testid="page-next"
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="p-2 rounded-full hover:bg-white border border-slate-200 disabled:opacity-30 transition-all shadow-sm bg-white/50"
                  >
                    <ChevronRight size={20} className="text-slate-600" />
                  </button>
                </div>
              </div>

            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default App