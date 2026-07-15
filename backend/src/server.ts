import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/authRoutes';
import bikeRoutes from './routes/bikeRoutes';
import { CORS_ORIGIN, validateAppConfig } from './config';

validateAppConfig();

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const prisma = new PrismaClient();

/** Лимит JSON-тела (волна G) — явный контракт, не «магия» дефолта Express */
export const JSON_BODY_LIMIT = '100kb';

app.use(helmet({
  // API отдаёт JSON, не HTML-страницы
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
}));

app.use(express.json({ limit: JSON_BODY_LIMIT }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/bikes', bikeRoutes);

/** Liveness — процесс жив (CI / probe) */
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

/** Readiness — БД отвечает */
app.get('/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ready' });
  } catch {
    res.status(503).json({ status: 'not ready' });
  }
});

app.get('/', (_req, res) => {
  res.send('Backend Enduro Park (QA-Benchmark) работает и защищен!');
});

// Обработчик слишком большого тела (express.json limit)
app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err?.type === 'entity.too.large' || err?.status === 413) {
    return res.status(413).json({ error: 'Тело запроса слишком большое' });
  }
  return next(err);
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
});
