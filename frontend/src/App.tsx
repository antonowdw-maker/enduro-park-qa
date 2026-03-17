import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { bikeSchema, type BikeFormData } from './schemas'
import { getBikes, createBike } from './api'
import { 
  Bike, Plus, Filter, Check, Wrench, X, RefreshCcw,
  Tag, Package, Calendar, Hash, Gauge
} from 'lucide-react'

function App() {
  const [bikes, setBikes] = useState<any[]>([])
  const [activeStatus, setActiveStatus] = useState('')

  // Настройка формы с валидацией
  const { register, handleSubmit, reset, formState: { errors } } = useForm<BikeFormData>({
    resolver: zodResolver(bikeSchema),
    defaultValues: { year: 2024, mileage: 0, status: 'available' }
  })

  // Функция загрузки данных
  const loadData = (status: string = '') => getBikes(status).then(setBikes)

  useEffect(() => {
    loadData(activeStatus)
  }, [activeStatus])

  // Отправка формы
  const onSubmit = async (data: BikeFormData) => {
    try {
      await createBike(data)
      loadData(activeStatus)
      reset()
      alert('Успех: Мотоцикл добавлен в базу!')
    } catch (err: any) {
      alert('Ошибка: ' + (err.response?.data?.error || 'Сервер отклонил запрос'));
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      <div className="mx-auto max-w-6xl">
        
        {/* ЗАГОЛОВОК */}
        <header className="mb-10 flex items-center gap-4">
          <div className="rounded-xl bg-blue-600 p-3 text-white shadow-lg">
            <Bike size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Enduro Park <span className="text-blue-600">QA-Stand</span></h1>
        </header>

        {/* ПАНЕЛЬ ФИЛЬТРОВ (Единый стиль с таблицей) */}
        <div className="mb-8 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
          <Filter size={18} className="text-slate-400 ml-2" />
          <span className="text-sm font-semibold text-slate-500 mr-2">Фильтр:</span>
          
          <button 
            data-testid="filter-all"
            onClick={() => setActiveStatus('')} 
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${activeStatus === '' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600'}`}
          >
            <RefreshCcw size={14} /> Все
          </button>

          <button 
            data-testid="filter-available"
            onClick={() => setActiveStatus('available')} 
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${activeStatus === 'available' ? 'bg-emerald-600 text-white shadow-md' : 'bg-emerald-100 text-emerald-700'}`}
          >
            <Check size={14} /> Доступен
          </button>

          <button 
            data-testid="filter-repair"
            onClick={() => setActiveStatus('repair')} 
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${activeStatus === 'repair' ? 'bg-amber-600 text-white shadow-md' : 'bg-amber-100 text-amber-700'}`}
          >
            <Wrench size={14} /> В ремонте
          </button>

          <button 
            data-testid="filter-sold"
            onClick={() => setActiveStatus('sold')} 
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${activeStatus === 'sold' ? 'bg-rose-600 text-white shadow-md' : 'bg-rose-100 text-rose-700'}`}
          >
            <X size={14} /> Продан
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
          {/* ФОРМА ДОБАВЛЕНИЯ */}
          <section className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-700">
              <Plus size={20} className="text-blue-600" /> Новый байк
            </h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-400 tracking-wider">Марка</label>
                <input {...register('brand')} data-testid="input-brand" className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:ring-2 focus:ring-blue-500" placeholder="KTM" />
                {errors.brand && <p className="mt-1 text-xs text-rose-500">{errors.brand.message}</p>}
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-400 tracking-wider">Модель</label>
                <input {...register('model')} data-testid="input-model" className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:ring-2 focus:ring-blue-500" placeholder="300 EXC" />
                {errors.model && <p className="mt-1 text-xs text-rose-500">{errors.model.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-400 tracking-wider">Год</label>
                  <input type="number" {...register('year', { valueAsNumber: true })} data-testid="input-year" className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-400 tracking-wider">Пробег</label>
                  <input type="number" {...register('mileage', { valueAsNumber: true })} data-testid="input-mileage" className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-400 tracking-wider">VIN (17 знаков)</label>
                <input {...register('vin')} data-testid="input-vin" className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm" placeholder="Уникальный код..." />
                {errors.vin && <p className="mt-1 text-xs text-rose-500">{errors.vin.message}</p>}
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-400 tracking-wider">Статус</label>
                <select {...register('status')} data-testid="select-status" className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="available">Доступен</option>
                  <option value="repair">В ремонте</option>
                  <option value="sold">Продан</option>
                </select>
              </div>

              <button type="submit" data-testid="btn-submit" className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-[0.98] mt-4">
                Добавить в базу
              </button>
            </form>
          </section>

          {/* ТАБЛИЦА БАЙКОВ */}
          <section className="lg:col-span-2">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50 font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Мотоцикл</th>
                    <th className="px-6 py-4 text-center">Год</th>
                    <th className="px-6 py-4">VIN-код</th>
                    <th className="px-6 py-4 text-right">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bikes.map((bike) => (
                    <tr 
                      key={bike.id} 
                      data-testid={`bike-row-${bike.vin}`} 
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-700">{bike.brand}</div>
                        <div className="text-slate-400 text-xs italic">{bike.model}</div>
                      </td>
                      <td className="px-6 py-4 text-center text-slate-500 font-medium">{bike.year}</td>
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-blue-500 tracking-tighter">
                        {bike.vin}
                      </td>
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
              {bikes.length === 0 && (
                <div className="p-12 text-center text-slate-400 italic">
                  Байков с таким статусом пока нет...
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default App