import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { authRouter } from './routes/auth.routes.js';
import { pokjaRouter } from './routes/pokja.routes.js';
import { documentRouter } from './routes/document.routes.js';
import { auditRouter } from './routes/audit.routes.js';
import { userRouter } from './routes/user.routes.js';

export const app = express();

// Trust reverse proxy (Vercel, AWS, Nginx)
app.set('trust proxy', 1);

// Security Headers via Helmet
app.use(helmet());

// Strict CORS: Explicit origin whitelist + Vercel deployment domains
const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      Boolean(process.env.VERCEL)
    ) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
}));

// Request body size limit
app.use(express.json({ limit: '2mb' }));

// Rate Limiter: Global API (300 req / 15 menit)
const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  message: { error: 'Terlalu banyak permintaan ke API. Harap tunggu sejenak.' },
});

// Rate Limiter: Auth endpoints (30 attempts / 15 menit untuk cegah brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  message: { error: 'Terlalu banyak percobaan autentikasi dari IP ini. Silakan coba lagi setelah 15 menit.' },
});

app.use('/api', globalApiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/auth/login', authLimiter);
app.use('/api/auth/change-password', authLimiter);
app.use('/auth/change-password', authLimiter);

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'e-sehati-api',
    standards: 'STARKES 2024',
    timestamp: new Date().toISOString(),
  });
});
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'e-sehati-api',
    standards: 'STARKES 2024',
    timestamp: new Date().toISOString(),
  });
});

// Root API info
app.get(['/api', '/'], (_req: Request, res: Response) => {
  res.status(200).json({
    name: 'E-Sehati - Sistem Informasi Dokumentasi Akreditasi Rumah Sakit (STARKES 2024) API',
    version: '1.0.0',
    status: 'running',
  });
});

// Register feature routes (dukung path dengan /api/ maupun tanpa prefix)
app.use('/api/auth', authRouter);
app.use('/auth', authRouter);

app.use('/api/pokja', pokjaRouter);
app.use('/pokja', pokjaRouter);

app.use('/api/documents', documentRouter);
app.use('/documents', documentRouter);

app.use('/api/audit-logs', auditRouter);
app.use('/audit-logs', auditRouter);

app.use('/api/users', userRouter);
app.use('/users', userRouter);

// 404 handler for API routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint API tidak ditemukan.' });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('API Error:', err);
  res.status(500).json({
    error: 'Terjadi kesalahan pada server.',
    message: err.message,
  });
});

export default app;
