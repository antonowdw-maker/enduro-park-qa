import { useEffect, useState } from 'react'
import { getBikes, createBike } from './api'
import { Bike, PlusCircle, Calendar, Hash, Gauge, Tag, Package } from 'lucide-react'

function App() {
  // Состояние для списка байков
  const [bikes, setBikes] = useState<any[]>([])
  
  // Состояние формы со всеми необходимыми полями
  const [form, setForm] = useState({ 
    brand: '', 
    model: '', 
    year: 2024, 
    vin: '', 
    mileage: 0, 
    status: 'available' 
  })

  // Загрузка данных с сервера
  const loadData = () => getBikes().then(data => setBikes(data))

  // Инициализация при первом запуске
  useEffect(() => { loadData() }, [])

  // Обработка отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createBike(form)
      loadData() // Обновляем таблицу после успеха
      alert('Успех: Байк добавлен в систему!')
    } catch (err: any) {
      // Выводим ошибку валидации от бэкенда (например, про 1990 год или 17 символов VIN)
      alert('Ошибка: ' + (err.response?.data?.error || 'Произошла ошибка при сохранении'));
    }
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', color: '#333' }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
        <Bike size={40} color="#2563eb" /> Enduro Park (QA-Stand)
      </h1>

      {/* ФОРМА ДОБАВЛЕНИЯ — Твой основной объект для UI-автотестов */}
      <form onSubmit={handleSubmit} style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '20px', 
        padding: '25px', 
        background: '#ffffff', 
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        marginBottom: '40px' 
      }}>
        
        {/* БРЕНД */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label htmlFor="brand" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600' }}>
            <Tag size={16} /> Марка
          </label>
          <input 
            id="brand" 
            data-testid="input-brand" 
            placeholder="Напр. KTM" 
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            onChange={e => setForm({...form, brand: e.target.value})} 
            required 
          />
        </div>

        {/* МОДЕЛЬ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label htmlFor="model" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600' }}>
            <Package size={16} /> Модель
          </label>
          <input 
            id="model" 
            data-testid="input-model" 
            placeholder="Напр. 300 EXC" 
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            onChange={e => setForm({...form, model: e.target.value})} 
            required 
          />
        </div>

        {/* ГОД ВЫПУСКА (Кликабельный лейбл с иконкой) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label htmlFor="year" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
            <Calendar size={16} /> Год выпуска (с 1990)
          </label>
          <input 
            id="year"
            data-testid="input-year" 
            type="number" 
            min="1990" 
            max="2026"
            value={form.year}
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            onChange={e => setForm({...form, year: Number(e.target.value)})} 
            required 
          />
        </div>

        {/* VIN НОМЕР */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label htmlFor="vin" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600' }}>
            <Hash size={16} /> VIN (17 символов)
          </label>
          <input 
            id="vin" 
            data-testid="input-vin" 
            placeholder="Уникальный код" 
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            onChange={e => setForm({...form, vin: e.target.value})} 
            required 
          />
        </div>

        {/* ПРОБЕГ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label htmlFor="mileage" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600' }}>
            <Gauge size={16} /> Пробег (км)
          </label>
          <input 
            id="mileage" 
            data-testid="input-mileage" 
            type="number" 
            min="0" 
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            onChange={e => setForm({...form, mileage: Number(e.target.value)})} 
            required 
          />
        </div>

        {/* КНОПКА ОТПРАВКИ */}
        <button 
          data-testid="btn-submit" 
          type="submit" 
          style={{ 
            gridColumn: 'span 2', 
            padding: '14px', 
            background: '#10b981', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#059669'}
          onMouseOut={(e) => e.currentTarget.style.background = '#10b981'}
        >
          <PlusCircle size={20} /> Добавить мотоцикл в базу
        </button>
      </form>

      {/* ТАБЛИЦА СПИСКА — Проверяй наличие строк по data-testid */}
      <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '15px', textAlign: 'left' }}>Бренд</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Модель</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Год</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>VIN</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Пробег</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(bikes) && bikes.map((bike, index) => (
              <tr 
                key={bike.id} 
                data-testid={`bike-row-${bike.vin}`}
                style={{ borderBottom: '1px solid #e2e8f0', background: index % 2 === 0 ? '#fff' : '#fcfcfc' }}
              >
                <td style={{ padding: '15px' }}>{bike.brand}</td>
                <td style={{ padding: '15px' }}>{bike.model}</td>
                <td style={{ padding: '15px' }}>{bike.year}</td>
                <td style={{ padding: '15px', fontFamily: 'monospace', fontWeight: 'bold', color: '#64748b' }}>{bike.vin}</td>
                <td style={{ padding: '15px' }}>{bike.mileage.toLocaleString()} км</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {bikes.length === 0 && (
        <p style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Байков пока нет. Добавьте первый!</p>
      )}
    </div>
  )
}

export default App
