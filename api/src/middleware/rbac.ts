import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Akses ditolak. Pengguna belum terautentikasi.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Akses dilarang. Peran '${req.user.role}' tidak memiliki izin untuk aksi ini.`,
      });
      return;
    }

    next();
  };
}

