import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  nama: string;
  assignedPokjaId?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const JWT_SECRET =
  process.env.JWT_SECRET ||
  (process.env.NODE_ENV === 'production'
    ? 'akreditasi-rsud-bintan-starkes-jwt-secret-production-2027-secure-fallback'
    : 'dev-jwt-secret-key-akreditasi-starkes-2027-internal');

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  // Khusus streaming berkas media / download, izinkan tiket sementara 60 detik berskop FILE_STREAM
  const isStreamRoute = req.originalUrl.includes('/version/') && (req.originalUrl.includes('/file') || req.originalUrl.includes('/download'));
  const ticket = typeof req.query.ticket === 'string' ? req.query.ticket : null;

  const token = bearerToken || (isStreamRoute ? ticket : null);

  if (!token) {
    res.status(401).json({ error: 'Akses ditolak. Token autentikasi tidak ditemukan.' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err || !decoded) {
      res.status(401).json({ error: 'Token autentikasi tidak valid atau sudah kedaluwarsa.' });
      return;
    }

    // Jika menggunakan tiket URL, wajib berskop FILE_STREAM
    if (ticket && !bearerToken && decoded.scope !== 'FILE_STREAM') {
      res.status(403).json({ error: 'Tiket berkas tidak sah atau bukan bertipe FILE_STREAM.' });
      return;
    }

    req.user = decoded as AuthenticatedUser;
    next();
  });
}

export function requireRole(allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Akses ditolak. Tidak terautentikasi.' });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Akses ditolak. Anda tidak memiliki izin untuk tindakan ini.' });
      return;
    }
    next();
  };
}

