import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { bikeSchema, type BikeFormData } from './schemas'
import { getBikes, createBike, loginRequest, logoutRequest } from './api'
import { 
  Bike, Plus, Filter, Check, Wrench, X, RefreshCcw, 
  ChevronLeft, ChevronRight, LogIn, LogOut, User, Lock,
  Tag, Package, Calendar, Hash, Gauge
} from 'lucide-react'

function App() {
  // --- СОСТОЯНИЯ (AUTH & DATA) ---
  const [user, setUser] = useState<{username: string, role: string} | null>(null)
  const [bikes, setBikes] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [activeStatus, setActiveStatus] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })

  // --- НАСТРОЙКА ФОРМЫ БАЙКА С ВАЛИДАЦИЕЙ ZOD ---
  const { register, handleSubmit, reset, formState: { errors } } = useForm<BikeFormData>({
    resolver: zodResolver(bikeSchema),
    defaultValues: { year: 2024, mileage: 0, status: 'available' }
  })

  // ЗАГРУЗКА ДАННЫХ
  const loadData = () => {
    if (!user) return
    getBikes(activeStatus, '', page, limit)
      .then(res => {
        setBikes(res.bikes)
        setTotal(res.total)
      })
      .catch(() => setUser(null))
  }

  useEffect(() => { loadData() }, [activeStatus, page, limit, user])

  // --- ОБРАБОТКА ЛОГИНА ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = await loginRequest(loginForm)
      setUser(data.user)
      alert('Добро пожаловать, ' + data.user.username)
    } catch (err: any) {
      alert('Ошибка входа: ' + (err.response?.data?.error || 'Неверные данные'))
    }
  }

  // --- ОБРАБОТКА ВЫХОДА ---
  const handleLogout = async () => {
    await logoutRequest()
    setUser(null)
    setBikes([])
  }

  // --- ОБРАБОТКА ДОБАВЛЕНИЯ БАЙКА ---
  const onAddBike = async (data: BikeFormData) => {
    try {
      await createBike(data)
      loadData()
      reset()
      alert('Успех: Байк добавлен!')
    } catch (err: any) {
      // Здесь мы поймаем нашу ловушку TEST/123 или ошибки года с бэкенда
      alert('Ошибка: ' + (err.response?.data?.error || 'Запрос отклонен'));
    }
  }

  const totalPages = Math.ceil(total / limit) || 1

  // --- ЭКРАН 1: ФОРМА ВХОДА ---
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-blue-600 p-4 rounded-full text-white mb-4 shadow-lg shadow-blue-900/20">
              <Bike size={40} />
            </div>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Enduro Park Manager</h1>
            <p className="text-slate-400 text-sm mt-1 text-center font-medium uppercase tracking-tighter">Вход в систему управления</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-3 text-slate-400" size={18} />
              <input 
                data-testid="login-username"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold"
                placeholder="Логин (admin / mechanic / guest)"
                onChange={e => setLoginForm({...loginForm, username: e.target.value})}
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
              <input 
                data-testid="login-password"
                type="password"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold"
                placeholder="Пароль (admin123)"
                onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                required
              />
            </div>
            <button 
              data-testid="login-submit"
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              <LogIn size={20} /> Авторизоваться
            </button>
          </form>
        </div>
      </div>
    )
  }

  // --- ЭКРАН 2: ОСНОВНОЙ ИНТЕРФЕЙС ---
  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      <div className="mx-auto max-w-6xl">
        
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-blue-600 p-3 text-white shadow-lg shadow-blue-200"><Bike size={32} /></div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800 uppercase tracking-tighter">Enduro Park Manager</h1>
          </div>
          <div className="flex items-center gap-4 bg-white p-2 px-4 rounded-full border border-slate-200 shadow-sm">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase leading-none tracking-widest">Пользователь</span>
              <span className="text-sm font-bold text-blue-600 uppercase leading-tight tracking-tighter">{user.username} [{user.role}]</span>
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

        {/* ФИЛЬТРЫ */}
        <div className="mb-8 flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <Filter size={18} className="text-slate-400 ml-2" />
            <button onClick={() => {setActiveStatus(''); setPage(1)}} className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold transition-all ${activeStatus === '' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600'}`}><RefreshCcw size={14} /> Все</button>
            <button onClick={() => {setActiveStatus('available'); setPage(1)}} className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold transition-all ${activeStatus === 'available' ? 'bg-emerald-600 text-white shadow-md' : 'bg-emerald-100 text-emerald-700'}`}><Check size={14} /> Доступен</button>
            <button onClick={() => {setActiveStatus('repair'); setPage(1)}} className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold transition-all ${activeStatus === 'repair' ? 'bg-amber-600 text-white shadow-md' : 'bg-amber-100 text-amber-700'}`}><Wrench size={14} /> Ремонт</button>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <span>Записей:</span>
            <select value={limit} onChange={(e) => {setLimit(Number(e.target.value)); setPage(1)}} className="rounded-lg border border-slate-200 bg-white p-1 outline-none text-blue-600 font-black cursor-pointer">
              <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
          {/* СЕКЦИЯ: ФОРМА ДОБАВЛЕНИЯ (Теперь с выводом всех ошибок) */}
          <section className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 h-fit">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-700 uppercase tracking-tighter underline decoration-blue-500 decoration-4 underline-offset-4"><Plus size={20} className="text-blue-600" /> Новый байк</h2>
            <form onSubmit={handleSubmit(onAddBike)} className="space-y-4">
              <div>
                <label className="mb-1 block text-[10px] font-black uppercase text-slate-400 tracking-widest">Марка</label>
                <input {...register('brand')} data-testid="input-brand" className={`w-full rounded-lg border p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold ${errors.brand ? 'border-rose-500 bg-rose-50' : 'border-slate-200'}`} placeholder="Напр. KTM" />
                {errors.brand && <p className="mt-1 text-[10px] text-rose-500 font-bold uppercase">{errors.brand.message}</p>}
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-black uppercase text-slate-400 tracking-widest">Модель</label>
                <input {...register('model')} data-testid="input-model" className={`w-full rounded-lg border p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold ${errors.model ? 'border-rose-500 bg-rose-50' : 'border-slate-200'}`} placeholder="Напр. 300 EXC" />
                {errors.model && <p className="mt-1 text-[10px] text-rose-500 font-bold uppercase">{errors.model.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-[10px] font-black uppercase text-slate-400 tracking-widest">Год</label>
                  <input type="number" {...register('year', { valueAsNumber: true })} className={`w-full rounded-lg border p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold ${errors.year ? 'border-rose-500 bg-rose-50' : 'border-slate-200'}`} />
                  {errors.year && <p className="mt-1 text-[10px] text-rose-500 font-bold uppercase leading-none mt-2">{errors.year.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-black uppercase text-slate-400 tracking-widest">Пробег</label>
                  <input type="number" {...register('mileage', { valueAsNumber: true })} className={`w-full rounded-lg border p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold ${errors.mileage ? 'border-rose-500 bg-rose-50' : 'border-slate-200'}`} />
                  {errors.mileage && <p className="mt-1 text-[10px] text-rose-500 font-bold uppercase leading-none mt-2">{errors.mileage.message}</p>}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-black uppercase text-slate-400 tracking-widest">VIN (17 знаков)</label>
                <input {...register('vin')} className={`w-full rounded-lg border p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm transition-all ${errors.vin ? 'border-rose-500 bg-rose-50 text-rose-900' : 'border-slate-200'}`} placeholder="Уникальный номер..." />
                {errors.vin && <p className="mt-1 text-[10px] text-rose-500 font-bold uppercase">{errors.vin.message}</p>}
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-black uppercase text-slate-400 tracking-widest">Статус в парке</label>
                <select {...register('status')} className="w-full rounded-lg border border-slate-200 p-2.5 outline-none bg-white font-bold text-slate-700 cursor-pointer">
                  <option value="available">Доступен</option><option value="repair">В ремонте</option><option value="sold">Продан</option>
                </select>
              </div>

              <button type="submit" data-testid="btn-submit" className="w-full rounded-xl bg-blue-600 py-4 font-black text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-[0.98] mt-4 uppercase tracking-widest text-xs">Добавить в базу</button>
            </form>
          </section>

          {/* СЕКЦИЯ: ТАБЛИЦА */}
          <section className="lg:col-span-2">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50 font-black text-slate-400 uppercase tracking-widest">
                  <tr><th className="px-6 py-4">Мотоцикл</th><th className="px-6 py-4 text-center">Год</th><th className="px-6 py-4">VIN-код</th><th className="px-6 py-4 text-right">Статус</th></tr>
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
                        <span className={`inline-flex items-center rounded-md px-3 py-1 text-[9px] font-black uppercase tracking-widest border ${
                          bike.status === 'available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          bike.status === 'repair' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {bike.status === 'available' ? 'Доступен' : bike.status === 'repair' ? 'В ремонте' : 'Продан'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Всего в базе: {total}</span>
                <div className="flex items-center gap-4">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 rounded-full border border-slate-200 bg-white shadow-sm disabled:opacity-30 transition-all hover:bg-slate-100"><ChevronLeft size={20} /></button>
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">СТРАНИЦА {page} ИЗ {totalPages}</span>
                  <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-2 rounded-full border border-slate-200 bg-white shadow-sm disabled:opacity-30 transition-all hover:bg-slate-100"><ChevronRight size={20} /></button>
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