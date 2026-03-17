import { useEffect, useState } from 'react'
import { getBikes } from './api'
import { Bike } from 'lucide-react' // Иконка байка

function App() {
  const [bikes, setBikes] = useState<any[]>([])

  useEffect(() => {
    // Загружаем данные при старте страницы
    getBikes().then(data => setBikes(data))
  }, [])

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Bike size={32} /> Эндуро Парк (QA-Стенд)
      </h1>
      
      <table border={1} cellPadding={10} style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ background: '#f4f4f4' }}>
            <th>Бренд</th>
            <th>Модель</th>
            <th>Год</th>
            <th>VIN (Уникальный ID)</th>
            <th>Пробег</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(bikes) && bikes.map(bike => (
            <tr key={bike.id} data-testid={`bike-row-${bike.vin}`}>
              <td>{bike.brand}</td>
              <td>{bike.model}</td>
              <td>{bike.year}</td>
              <td style={{ fontWeight: 'bold' }}>{bike.vin}</td>
              <td>{bike.mileage} км</td>
            </tr>
          ))}
        </tbody>
      </table>

      
      {bikes.length === 0 && <p>Загрузка байков из базы...</p>}
    </div>
  )
}

export default App