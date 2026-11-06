import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { authenticateToken, JWT_SECRET } from '../middleware/auth.js';
import { logAudit } from '../lib/audit.js';

export const authRouter = Router();

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email dan kata sandi wajib diisi.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).trim().toLowerCase() },
      include: {
        assignedPokja: {
          select: { id: true, kode: true, nama: true, kelompok: true },
        },
      },
    });

    if (!user) {
      res.status(401).json({ error: 'Email atau kata sandi tidak valid.' });
      return;
    }

    const isMatch = await bcrypt.compare(String(password), user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Email atau kata sandi tidak valid.' });
      return;
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      nama: user.nama,
      assignedPokjaId: user.assignedPokjaId,
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as any,
    });

    // Audit log
    await logAudit({
      userId: user.id,
      aksi: 'USER_LOGIN',
      targetType: 'USER',
      targetId: user.id,
      metadata: { email: user.email, role: user.role },
      ipAddress: req.ip,
    });

    res.status(200).json({
      message: 'Login berhasil.',
      token,
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role,
        assignedPokjaId: user.assignedPokjaId,
        assignedPokja: user.assignedPokja,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message || 'Terjadi kesalahan internal saat autentikasi.' });
  }
});

// GET /api/auth/me
authRouter.get('/me', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Pengguna belum terautentikasi.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
        assignedPokjaId: true,
        createdAt: true,
        assignedPokja: {
          select: { id: true, kode: true, nama: true, kelompok: true, urutan: true },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'Data profil pengguna tidak ditemukan.' });
      return;
    }

    res.status(200).json({ user });
  } catch (err: any) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ error: 'Gagal mengambil profil pengguna.' });
  }
});

// PUT /api/auth/change-password - Ubah kata sandi mandiri pengguna yang login
authRouter.put('/change-password', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      res.status(400).json({ error: 'Kata sandi saat ini dan kata sandi baru wajib diisi.' });
      return;
    }

    if (String(newPassword).length < 6) {
      res.status(400).json({ error: 'Kata sandi baru minimal 6 karakter.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user) {
      res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
      return;
    }

    const isMatch = await bcrypt.compare(String(oldPassword), user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ error: 'Kata sandi saat ini salah / tidak cocok.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(String(newPassword), salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    await logAudit({
      userId: user.id,
      aksi: 'CHANGE_PASSWORD',
      targetType: 'USER',
      targetId: user.id,
      metadata: { email: user.email },
      ipAddress: req.ip,
    });

    res.status(200).json({ message: 'Kata sandi berhasil diperbarui.' });
  } catch (err: any) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Gagal mengubah kata sandi.' });
  }
});
