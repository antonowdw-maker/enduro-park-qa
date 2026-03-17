import { useEffect, useState } from 'react'
import { getBikes, createBike } from './api'
import { Bike, PlusCircle, Calendar } from 'lucide-react'

function App() {
  const [bikes, setBikes] = useState<any[]>([])
  
  // Состояние формы (добавили year по умолчанию 2024)
  const [form, setForm] = useState({ 
    brand: '', model: '', year: 2024, vin: '', mileage: 0, status: 'available' 
  })

  const loadData = () => getBikes().then(data => setBikes(data))
  useEffect(() => { loadData() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createBike(form)
      loadData()
      alert('Успех: Байк добавлен!')
    } catch (err: any) {
      // QA-Кейс: выводим ошибку, которую нам прислал Бэкенд (напр. про 1990 год)
      alert('Ошибка: ' + (err.response?.data?.error || 'Что-то пошло не так'));
    }
  }

  return (
    <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Arial' }}>
      <h1><Bike /> Enduro Park (QA-Stand)</h1>

      {/* ФОРМА С ДОБАВЛЕННЫМ ПОЛЕМ "ГОД" */}
      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '20px', background: '#f9f9f9', marginBottom: '20px' }}>
        <input data-testid="input-brand" placeholder="Бренд" onChange={e => setForm({...form, brand: e.target.value})} required />
        <input data-testid="input-model" placeholder="Модель" onChange={e => setForm({...form, model: e.target.value})} required />
        
        {/* НОВОЕ ПОЛЕ: ГОД ВЫПУСКА */}
        <input 
          data-testid="input-year" 
          type="number" 
          placeholder="Год выпуска (с 1990)" 
          value={form.year}
          onChange={e => setForm({...form, year: Number(e.target.value)})} 
          required 
        />
        
        <input data-testid="input-vin" placeholder="VIN (17 символов)" onChange={e => setForm({...form, vin: e.target.value})} required />
        <input data-testid="input-mileage" type="number" placeholder="Пробег" onChange={e => setForm({...form, mileage: Number(e.target.value)})} required />
        
        <button data-testid="btn-submit" type="submit" style={{ gridColumn: 'span 2', padding: '10px', background: 'green', color: 'white', border: 'none', cursor: 'pointer' }}>
          <PlusCircle size={16} /> Добавить байк в базу
        </button>
      </form>

      {/* ТАБЛИЦА С КОЛОНКОЙ "ГОД" */}
      <table border={1} cellPadding={10} style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#eee' }}>
            <th>Бренд</th><th>Модель</th><th>Год</th><th>VIN</th><th>Пробег</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(bikes) && bikes.map(bike => (
            <tr key={bike.id} data-testid={`bike-row-${bike.vin}`}>
              <td>{bike.brand}</td>
              <td>{bike.model}</td>
              <td>{bike.year}</td> {/* ВЫВОДИМ ГОД */}
              <td>{bike.vin}</td>
              <td>{bike.mileage} км</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default App
