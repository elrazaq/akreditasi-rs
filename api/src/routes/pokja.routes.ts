import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { authenticateToken } from '../middleware/auth.js';

export const pokjaRouter = Router();

// Fast in-memory cache for master data (TTL: 60s)
let pokjaCache: { data: any; expiry: number } | null = null;
const detailCache = new Map<string, { data: any; expiry: number }>();
const epCache = new Map<string, { data: any; expiry: number }>();

export function invalidatePokjaCache() {
  pokjaCache = null;
  detailCache.clear();
  epCache.clear();
}

// Semua rute Pokja memerlukan autentikasi
pokjaRouter.use(authenticateToken);

// GET /api/pokja - Daftar 16 Pokja dengan ringkasan progres
pokjaRouter.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const now = Date.now();
    if (pokjaCache && pokjaCache.expiry > now) {
      res.status(200).json({ pokjas: pokjaCache.data });
      return;
    }
    const pokjas = await prisma.pokja.findMany({
      orderBy: { urutan: 'asc' },
      include: {
        _count: {
          select: {
            standars: true,
          },
        },
        standars: {
          select: {
            id: true,
            _count: {
              select: {
                elemenPenilaian: true,
              },
            },
            elemenPenilaian: {
              select: {
                id: true,
                documents: {
                  select: {
                    id: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const formatted = pokjas.map((p) => {
      let totalEp = 0;
      let totalDocuments = 0;
      let approvedCount = 0;
      let submittedCount = 0;
      let revisedCount = 0;
      let draftCount = 0;

      for (const s of p.standars) {
        totalEp += s._count.elemenPenilaian;
        for (const ep of s.elemenPenilaian) {
          totalDocuments += ep.documents.length;
          for (const doc of ep.documents) {
            if (doc.status === 'APPROVED') approvedCount++;
            else if (doc.status === 'SUBMITTED') submittedCount++;
            else if (doc.status === 'REVISED') revisedCount++;
            else if (doc.status === 'DRAFT') draftCount++;
          }
        }
      }

      return {
        id: p.id,
        kode: p.kode,
        nama: p.nama,
        kelompok: p.kelompok,
        urutan: p.urutan,
        totalStandar: p._count.standars,
        totalEp,
        stats: {
          totalDocuments,
          approved: approvedCount,
          submitted: submittedCount,
          revised: revisedCount,
          draft: draftCount,
          complianceRate: totalEp > 0 ? Math.round((approvedCount / totalEp) * 100) : 0,
        },
      };
    });

    pokjaCache = { data: formatted, expiry: Date.now() + 60000 };
    res.status(200).json({ pokjas: formatted });
  } catch (err: any) {
    console.error('Fetch pokjas error:', err);
    res.status(500).json({ error: 'Gagal memuat daftar Pokja.' });
  }
});

// GET /api/pokja/search - Pencarian cepat Pokja dan Elemen Penilaian
pokjaRouter.get('/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const q = (req.query.q as string || '').trim();
    if (!q || q.length < 2) {
      res.status(200).json({ results: { pokjas: [], eps: [] } });
      return;
    }

    const [pokjas, eps] = await Promise.all([
      prisma.pokja.findMany({
        where: {
          OR: [
            { kode: { contains: q, mode: 'insensitive' } },
            { nama: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, kode: true, nama: true },
      }),
      prisma.elemenPenilaian.findMany({
        where: {
          OR: [
            { kode: { contains: q, mode: 'insensitive' } },
            { deskripsi: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 8,
        select: {
          id: true,
          kode: true,
          deskripsi: true,
          standar: {
            select: {
              id: true,
              kode: true,
              pokja: {
                select: { id: true, kode: true, nama: true },
              },
            },
          },
        },
      }),
    ]);

    res.status(200).json({ results: { pokjas, eps } });
  } catch (err: any) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Gagal melakukan pencarian.' });
  }
});

// GET /api/pokja/:id - Detail Pokja dengan Standar dan EP
pokjaRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const now = Date.now();
    const cached = detailCache.get(id);
    if (cached && cached.expiry > now) {
      res.status(200).json({ pokja: cached.data });
      return;
    }

    const pokja = await prisma.pokja.findFirst({
      where: {
        OR: [{ id }, { kode: id.toUpperCase() }],
      },
      include: {
        standars: {
          orderBy: { urutan: 'asc' },
          include: {
            elemenPenilaian: {
              orderBy: { urutan: 'asc' },
              include: {
                documents: {
                  select: {
                    id: true,
                    judul: true,
                    kategori: true,
                    status: true,
                    updatedAt: true,
                    versions: {
                      orderBy: { versionNumber: 'desc' },
                      take: 1,
                      select: {
                        id: true,
                        versionNumber: true,
                        fileUrl: true,
                        fileSize: true,
                        fileType: true,
                        createdAt: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!pokja) {
      res.status(404).json({ error: 'Pokja tidak ditemukan.' });
      return;
    }

    detailCache.set(id, { data: pokja, expiry: Date.now() + 60000 });
    res.status(200).json({ pokja });
  } catch (err: any) {
    console.error('Fetch pokja detail error:', err);
    res.status(500).json({ error: 'Gagal memuat detail Pokja.' });
  }
});

// GET /api/pokja/ep/:epId - Detail Elemen Penilaian beserta berkas lengkap
pokjaRouter.get('/ep/:epId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { epId } = req.params;
    const ep = await prisma.elemenPenilaian.findUnique({
      where: { id: epId },
      include: {
        standar: {
          include: {
            pokja: {
              select: { id: true, kode: true, nama: true },
            },
          },
        },
        documents: {
          orderBy: { updatedAt: 'desc' },
          include: {
            createdBy: {
              select: { id: true, nama: true, email: true, role: true },
            },
            versions: {
              orderBy: { versionNumber: 'desc' },
              include: {
                uploadedBy: {
                  select: { id: true, nama: true },
                },
                _count: {
                  select: { annotations: true },
                },
              },
            },
            draft: {
              select: { id: true, updatedAt: true },
            },
          },
        },
      },
    });

    if (!ep) {
      res.status(404).json({ error: 'Elemen Penilaian tidak ditemukan.' });
      return;
    }

    res.status(200).json({ ep });
  } catch (err: any) {
    console.error('Fetch EP error:', err);
    res.status(500).json({ error: 'Gagal memuat detail Elemen Penilaian.' });
  }
});

