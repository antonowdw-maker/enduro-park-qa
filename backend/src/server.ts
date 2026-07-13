import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes';
import bikeRoutes from './routes/bikeRoutes';
import { CORS_ORIGIN, validateAppConfig } from './config';

validateAppConfig();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/bikes', bikeRoutes);

app.get('/', (_req, res) => {
  res.send('Backend Enduro Park (QA-Benchmark) работает и защищен!');
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
});
