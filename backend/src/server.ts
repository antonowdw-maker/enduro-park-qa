import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser'; // Импортируем парсер кук (паспортов)
import authRoutes from './routes/authRoutes'; // Новые двери для входа
import bikeRoutes from './routes/bikeRoutes';

const app = express();
const PORT = 5000;

// Настройка CORS: Разрешаем фронтенду (5173) общаться с бэкендом (5000)
// ВАЖНО ДЛЯ QA: credentials: true позволяет передавать куки между портами!
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(cookieParser()); // ВКЛЮЧАЕМ ЧТЕНИЕ КУК (обязательно до маршрутов)

// 1. Подключаем маршруты авторизации
app.use('/api/auth', authRoutes);

// 2. Подключаем маршруты байков (в них уже стоит наш "Охранник")
app.use('/api/bikes', bikeRoutes);

app.get('/', (req, res) => {
  res.send('Backend Enduro Park (QA-Benchmark) работает и защищен!');
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер безопасности запущен на http://localhost:${PORT}`);
});