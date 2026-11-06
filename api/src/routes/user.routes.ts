import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { logAudit } from '../lib/audit.js';

export const userRouter = Router();

// Semua endpoint user memerlukan token dan hak SUPERADMIN
userRouter.use(authenticateToken);
userRouter.use(requireRole([Role.SUPERADMIN]));

// GET /api/users - Daftar seluruh pengguna
userRouter.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
        assignedPokjaId: true,
        assignedPokja: {
          select: {
            id: true,
            kode: true,
            nama: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ users });
  } catch (err: any) {
    console.error('Fetch users error:', err);
    res.status(500).json({ error: 'Gagal mengambil data pengguna.' });
  }
});

// POST /api/users - Tambah pengguna baru
userRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { nama, email, password, role, assignedPokjaId } = req.body;

    if (!nama || !email || !password || !role) {
      res.status(400).json({ error: 'Nama, email, kata sandi, dan peran (role) wajib diisi.' });
      return;
    }

    if (!Object.values(Role).includes(role)) {
      res.status(400).json({ error: `Peran tidak valid. Pilihan: ${Object.values(Role).join(', ')}` });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: String(email).trim().toLowerCase() },
    });

    if (existingUser) {
      res.status(409).json({ error: 'Email sudah terdaftar dalam sistem.' });
      return;
    }

    if (role === Role.POKJA && !assignedPokjaId) {
      res.status(400).json({ error: 'Pengguna dengan peran POKJA wajib memilih Pokja penugasan.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        nama: String(nama).trim(),
        email: String(email).trim().toLowerCase(),
        passwordHash,
        role,
        assignedPokjaId: role === Role.POKJA ? assignedPokjaId : null,
      },
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
        assignedPokjaId: true,
        assignedPokja: {
          select: { id: true, kode: true, nama: true },
        },
        createdAt: true,
      },
    });

    await logAudit({
      userId: req.user!.id,
      aksi: 'CREATE_USER',
      targetType: 'USER',
      targetId: newUser.id,
      metadata: { nama: newUser.nama, email: newUser.email, role: newUser.role },
      ipAddress: req.ip,
    });

    res.status(201).json({ message: 'Pengguna berhasil dibuat.', user: newUser });
  } catch (err: any) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Gagal membuat pengguna baru.' });
  }
});

// PATCH /api/users/:id - Ubah profil, peran, penugasan pokja, atau reset kata sandi
userRouter.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nama, email, password, role, assignedPokjaId } = req.body;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
      return;
    }

    const updateData: Record<string, any> = {};

    if (nama) updateData.nama = String(nama).trim();
    if (email) {
      const emailLower = String(email).trim().toLowerCase();
      if (emailLower !== targetUser.email) {
        const emailCheck = await prisma.user.findUnique({ where: { email: emailLower } });
        if (emailCheck) {
          res.status(409).json({ error: 'Email sudah digunakan pengguna lain.' });
          return;
        }
        updateData.email = emailLower;
      }
    }

    if (role) {
      if (!Object.values(Role).includes(role)) {
        res.status(400).json({ error: 'Peran pengguna tidak valid.' });
        return;
      }
      updateData.role = role;
      if (role !== Role.POKJA) {
        updateData.assignedPokjaId = null;
      } else if (assignedPokjaId) {
        updateData.assignedPokjaId = assignedPokjaId;
      }
    } else if (assignedPokjaId !== undefined) {
      updateData.assignedPokjaId = assignedPokjaId || null;
    }

    if (password && String(password).trim().length > 0) {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(String(password).trim(), salt);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
        assignedPokjaId: true,
        assignedPokja: {
          select: { id: true, kode: true, nama: true },
        },
        updatedAt: true,
      },
    });

    await logAudit({
      userId: req.user!.id,
      aksi: 'UPDATE_USER',
      targetType: 'USER',
      targetId: id,
      metadata: { fields: Object.keys(updateData) },
      ipAddress: req.ip,
    });

    res.status(200).json({ message: 'Data pengguna berhasil diperbarui.', user: updatedUser });
  } catch (err: any) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Gagal memperbarui pengguna.' });
  }
});

// DELETE /api/users/:id - Hapus akun pengguna
userRouter.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (req.user!.id === id) {
      res.status(400).json({ error: 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.' });
      return;
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            createdDocuments: true,
            uploadedVersions: true,
          },
        },
      },
    });

    if (!targetUser) {
      res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
      return;
    }

    // Jika pengguna memiliki dokumen aktif yang dibuat, cegah penghapusan atau beri penjelasan
    if (targetUser._count.createdDocuments > 0) {
      res.status(400).json({
        error: `Pengguna ini tidak dapat dihapus karena telah membuat ${targetUser._count.createdDocuments} dokumen akreditasi. Anda dapat mengubah kata sandi atau menonaktifkannya dengan mengganti peran.`,
      });
      return;
    }

    await prisma.user.delete({ where: { id } });

    await logAudit({
      userId: req.user!.id,
      aksi: 'DELETE_USER',
      targetType: 'USER',
      targetId: id,
      metadata: { email: targetUser.email, nama: targetUser.nama },
      ipAddress: req.ip,
    });

    res.status(200).json({ message: 'Pengguna berhasil dihapus.' });
  } catch (err: any) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Gagal menghapus pengguna.' });
  }
});

