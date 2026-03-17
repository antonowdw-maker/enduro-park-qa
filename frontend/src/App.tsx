import { useEffect, useState } from 'react'
import { getBikes, createBike } from './api'
import { 
  Bike, PlusCircle, Calendar, Hash, Gauge, Tag, Package, 
  Filter, CheckCircle, Wrench, XCircle, RefreshCcw 
} from 'lucide-react'

function App() {
  // Состояние для списка байков
  const [bikes, setBikes] = useState<any[]>([])
  
  // Состояние активного фильтра (по умолчанию '' - все)
  const [activeStatus, setActiveStatus] = useState('')

  // Состояние формы
  const [form, setForm] = useState({ 
    brand: '', model: '', year: 2024, vin: '', mileage: 0, status: 'available' 
  })

  // Функция загрузки данных с учетом фильтра
  const loadData = (status: string = '') => {
    getBikes(status).then(data => setBikes(data))
  }

  // Загружаем данные при старте и при смене фильтра
  useEffect(() => {
    loadData(activeStatus)
  }, [activeStatus])

  // Обработка отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createBike(form)
      loadData(activeStatus) // Обновляем список
      alert('Успех: Байк добавлен в систему!')
    } catch (err: any) {
      alert('Ошибка: ' + (err.response?.data?.error || 'Ошибка при сохранении'));
    }
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'system-ui, sans-serif', color: '#1e293b' }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
        <Bike size={40} color="#2563eb" /> Enduro Park (QA-Stand)
      </h1>

      {/* --- ПАНЕЛЬ ФИЛЬТРОВ (Объект для тестов фильтрации) --- */}
      <div style={{ 
        display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px', 
        padding: '15px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' 
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: '#64748b' }}>
          <Filter size={18} /> Фильтр по статусу:
        </span>
        
        {/* Кнопка "Все" */}
        <button 
          data-testid="filter-all"
          onClick={() => setActiveStatus('')}
          style={{ 
            padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer',
            background: activeStatus === '' ? '#2563eb' : '#fff',
            color: activeStatus === '' ? '#fff' : '#64748b',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '5px'
          }}
        >
          <RefreshCcw size={14} /> Все
        </button>

        {/* Кнопка "Доступен" */}
        <button 
          data-testid="filter-available"
          onClick={() => setActiveStatus('available')}
          style={{ 
            padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer',
            background: activeStatus === 'available' ? '#10b981' : '#fff',
            color: activeStatus === 'available' ? '#fff' : '#64748b',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '5px'
          }}
        >
          <CheckCircle size={14} /> Доступен
        </button>

        {/* Кнопка "В ремонте" */}
        <button 
          data-testid="filter-repair"
          onClick={() => setActiveStatus('repair')}
          style={{ 
            padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer',
            background: activeStatus === 'repair' ? '#f59e0b' : '#fff',
            color: activeStatus === 'repair' ? '#fff' : '#64748b',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '5px'
          }}
        >
          <Wrench size={14} /> В ремонте
        </button>

        {/* Кнопка "Продан" */}
        <button 
          data-testid="filter-sold"
          onClick={() => setActiveStatus('sold')}
          style={{ 
            padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer',
            background: activeStatus === 'sold' ? '#ef4444' : '#fff',
            color: activeStatus === 'sold' ? '#fff' : '#64748b',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '5px'
          }}
        >
          <XCircle size={14} /> Продан
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '30px', alignItems: 'start' }}>
        
        {/* --- ФОРМА ДОБАВЛЕНИЯ --- */}
        <form onSubmit={handleSubmit} style={{ 
          display: 'flex', flexDirection: 'column', gap: '15px', padding: '20px', 
          background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Новый байк</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}><Tag size={12}/> Марка</label>
            <input data-testid="input-brand" placeholder="KTM" style={{ padding: '8px' }} onChange={e => setForm({...form, brand: e.target.value})} required />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}><Package size={12}/> Модель</label>
            <input data-testid="input-model" placeholder="300 EXC" style={{ padding: '8px' }} onChange={e => setForm({...form, model: e.target.value})} required />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}><Calendar size={12}/> Год</label>
            <input data-testid="input-year" type="number" value={form.year} style={{ padding: '8px' }} onChange={e => setForm({...form, year: Number(e.target.value)})} required />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}><Hash size={12}/> VIN (17 симв.)</label>
            <input data-testid="input-vin" placeholder="VIN..." style={{ padding: '8px' }} onChange={e => setForm({...form, vin: e.target.value})} required />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}><Gauge size={12}/> Пробег</label>
            <input data-testid="input-mileage" type="number" style={{ padding: '8px' }} onChange={e => setForm({...form, mileage: Number(e.target.value)})} required />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Статус</label>
            <select data-testid="select-status" style={{ padding: '8px' }} onChange={e => setForm({...form, status: e.target.value})}>
              <option value="available">Доступен</option>
              <option value="repair">В ремонте</option>
              <option value="sold">Продан</option>
            </select>
          </div>

          <button data-testid="btn-submit" type="submit" style={{ 
            padding: '12px', background: '#10b981', color: 'white', border: 'none', 
            borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px'
          }}>
            <PlusCircle size={16} /> Добавить байк
          </button>
        </form>

        {/* --- ТАБЛИЦА --- */}
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Бренд</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Модель</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>VIN</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Статус</th>
              </tr>
            </thead>
            <tbody>
              {bikes.map((bike) => (
                <tr key={bike.id} data-testid={`bike-row-${bike.vin}`} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px' }}>{bike.brand}</td>
                  <td style={{ padding: '12px' }}>{bike.model}</td>
                  <td style={{ padding: '12px', fontFamily: 'monospace', color: '#64748b' }}>{bike.vin}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold',
                      background: bike.status === 'available' ? '#dcfce7' : bike.status === 'repair' ? '#fef3c7' : '#fee2e2',
                      color: bike.status === 'available' ? '#166534' : bike.status === 'repair' ? '#92400e' : '#991b1b'
                    }}>
                      {bike.status === 'available' ? 'Доступен' : bike.status === 'repair' ? 'Ремонт' : 'Продан'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default App