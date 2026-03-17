import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import bikeRoutes from './routes/bikeRoutes';


const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json()); // Чтобы сервер понимал JSON в запросах

// Подключаем наши маршруты
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Backend Enduro Park запущен!');
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер работает на http://localhost:${PORT}`);
});

app.use('/api/bikes', bikeRoutes);