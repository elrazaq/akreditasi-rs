import { Router, Request, Response } from 'express';
import { Role } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { authenticateToken } from '../middleware/auth.js';

export const auditRouter = Router();

auditRouter.use(authenticateToken);

// GET /api/audit-logs - Daftar jejak audit sistem
auditRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = '50', offset = '0', aksi, targetType } = req.query;
    const take = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const skip = Math.max(Number(offset) || 0, 0);

    const where: any = {};

    // Filter RBAC: Pokja hanya melihat aktivitas terkait dirinya, Superadmin melihat seluruhnya
    if (req.user!.role === Role.POKJA) {
      where.userId = req.user!.id;
    }

    if (aksi && typeof aksi === 'string') {
      where.aksi = aksi;
    }

    if (targetType && typeof targetType === 'string') {
      where.targetType = targetType;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, nama: true, email: true, role: true },
        },
      },
    });

    const total = await prisma.auditLog.count({ where });

    res.status(200).json({
      total,
      limit: take,
      offset: skip,
      logs,
    });
  } catch (err: any) {
    console.error('Fetch audit logs error:', err);
    res.status(500).json({ error: 'Gagal memuat log audit.' });
  }
});

