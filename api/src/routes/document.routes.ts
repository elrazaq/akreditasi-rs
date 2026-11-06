import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import jwt from 'jsonwebtoken';
import { DocumentCategory, DocumentStatus, Role } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { authenticateToken, JWT_SECRET } from '../middleware/auth.js';
import { uploadPdf, validateMagicBytes } from '../middleware/upload.js';
import { uploadPdfBuffer, deleteCloudinaryResource } from '../lib/cloudinary.js';
import { logAudit } from '../lib/audit.js';
import { invalidatePokjaCache } from './pokja.routes.js';

export const documentRouter = Router();

// Semua rute dokumen memerlukan autentikasi
documentRouter.use(authenticateToken);

// Lazy dynamic import helper untuk sanitize-html guna cegah ERR_REQUIRE_ESM pada serverless Node.js
let _sanitizeHtml: any = null;
async function getSanitizeHtml(): Promise<any> {
  if (!_sanitizeHtml) {
    try {
      const dynamicImport = new Function('specifier', 'return import(specifier)');
      const mod = await dynamicImport('sanitize-html');
      _sanitizeHtml = mod.default || mod;
    } catch (e) {
      console.warn('sanitize-html load fallback:', e);
      _sanitizeHtml = null;
    }
  }
  return _sanitizeHtml;
}

// Helper sanitasi HTML draf dokumen resmi
async function sanitizeDocumentHtml(input: string): Promise<string> {
  const sanitizer = await getSanitizeHtml();
  if (sanitizer) {
    return sanitizer(input, {
      allowedTags: [
        'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
        'b', 'i', 'strong', 'em', 'u', 's', 'strike',
        'ul', 'ol', 'li', 'span', 'br', 'hr', 'blockquote', 'code', 'pre'
      ],
      allowedAttributes: {
        '*': ['class', 'style'],
        'th': ['colspan', 'rowspan'],
        'td': ['colspan', 'rowspan'],
      },
      allowedSchemes: ['http', 'https'],
    });
  }

  // Robust fallback regex jika sanitize-html gagal dimuat dalam container serverless
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript\s*:[^"']*/gi, '');
}

// Helper untuk mendapatkan folder penyimpanan berkas lokal
function getUploadsDirectories(): string[] {
  const dirs = [
    path.join(process.cwd(), 'uploads', 'documents'),
    path.join(process.cwd(), 'api', 'uploads', 'documents'),
  ];
  try {
    dirs.push(path.join(os.tmpdir(), 'uploads', 'documents'));
  } catch {
    // ignore
  }
  return dirs;
}

function findLocalDocumentFile(documentId: string, versionNumber: number): { fullPath: string; ext: string } | null {
  const dirs = getUploadsDirectories();
  for (const dir of dirs) {
    const canonicalDir = path.resolve(dir);
    if (fs.existsSync(canonicalDir)) {
      const files = fs.readdirSync(canonicalDir).filter((f) => f.startsWith(`${documentId}_v${versionNumber}_`));
      if (files.length > 0) {
        const fullPath = path.resolve(canonicalDir, files[0]);
        // Validasi kanonikal path traversal
        if (!fullPath.startsWith(canonicalDir)) continue;
        return {
          fullPath,
          ext: path.extname(files[0]).toLowerCase(),
        };
      }
    }
  }
  return null;
}

// Helper untuk memeriksa kepemilikan Pokja bagi user POKJA
async function checkPokjaOwnership(user: Express.Request['user'], epId?: string, documentId?: string): Promise<{ authorized: boolean; pokjaKode: string; error?: string }> {
  if (!user) return { authorized: false, pokjaKode: '', error: 'Tidak terautentikasi.' };
  if (user.role === Role.SUPERADMIN || user.role === Role.VERIFIKATOR) {
    // Superadmin dan Verifikator memiliki akses lintas pokja
    return { authorized: true, pokjaKode: 'RS' };
  }

  // Jika role POKJA
  if (!user.assignedPokjaId) {
    return { authorized: false, pokjaKode: '', error: 'Akun Anda belum ditugaskan ke Pokja manapun.' };
  }

  if (documentId) {
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        elemenPenilaian: {
          include: {
            standar: {
              include: { pokja: true },
            },
          },
        },
      },
    });

    if (!doc) return { authorized: false, pokjaKode: '', error: 'Dokumen tidak ditemukan.' };
    const docPokjaId = doc.elemenPenilaian.standar.pokjaId;
    if (docPokjaId !== user.assignedPokjaId) {
      return { authorized: false, pokjaKode: '', error: 'Anda hanya dapat mengakses atau memodifikasi dokumen di bawah Pokja Anda.' };
    }
    return { authorized: true, pokjaKode: doc.elemenPenilaian.standar.pokja.kode };
  }

  if (epId) {
    const ep = await prisma.elemenPenilaian.findUnique({
      where: { id: epId },
      include: {
        standar: {
          include: { pokja: true },
        },
      },
    });

    if (!ep) return { authorized: false, pokjaKode: '', error: 'Elemen Penilaian tidak ditemukan.' };
    if (ep.standar.pokjaId !== user.assignedPokjaId) {
      return { authorized: false, pokjaKode: '', error: 'Anda hanya dapat menambahkan dokumen ke Elemen Penilaian di bawah Pokja Anda.' };
    }
    return { authorized: true, pokjaKode: ep.standar.pokja.kode };
  }

  return { authorized: true, pokjaKode: 'POKJA' };
}

// GET /api/documents - Daftar dokumen dengan filter status, pokja, dan pencarian
documentRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, pokjaId, search, limit = '100', offset = '0' } = req.query;
    const where: any = {};

    if (status && Object.values(DocumentStatus).includes(status as DocumentStatus)) {
      where.status = status as DocumentStatus;
    }

    if (pokjaId && typeof pokjaId === 'string') {
      where.elemenPenilaian = {
        standar: {
          pokjaId: pokjaId,
        },
      };
    }

    if (search && typeof search === 'string') {
      where.judul = { contains: search, mode: 'insensitive' };
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        take: Number(limit) || 100,
        skip: Number(offset) || 0,
        orderBy: { updatedAt: 'desc' },
        include: {
          createdBy: { select: { id: true, nama: true, email: true, role: true } },
          elemenPenilaian: {
            include: {
              standar: {
                include: {
                  pokja: { select: { id: true, kode: true, nama: true } },
                },
              },
            },
          },
          versions: {
            orderBy: { versionNumber: 'desc' },
            take: 1,
            include: {
              uploadedBy: { select: { id: true, nama: true } },
            },
          },
        },
      }),
      prisma.document.count({ where }),
    ]);

    res.status(200).json({ total, documents });
  } catch (err: any) {
    console.error('Fetch documents error:', err);
    res.status(500).json({ error: 'Gagal memuat dokumen.' });
  }
});

// POST /api/documents - Buat dokumen baru pada EP
documentRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { epId, judul, kategori } = req.body;

    if (!epId || !judul || !kategori) {
      res.status(400).json({ error: 'Field epId, judul, dan kategori wajib diisi.' });
      return;
    }

    if (!Object.values(DocumentCategory).includes(kategori)) {
      res.status(400).json({ error: `Kategori tidak valid. Pilihan: ${Object.values(DocumentCategory).join(', ')}` });
      return;
    }

    const check = await checkPokjaOwnership(req.user, epId);
    if (!check.authorized) {
      res.status(403).json({ error: check.error });
      return;
    }

    const document = await prisma.document.create({
      data: {
        epId,
        judul: String(judul).trim(),
        kategori,
        status: DocumentStatus.DRAFT,
        createdById: req.user!.id,
      },
      include: {
        elemenPenilaian: {
          select: { kode: true, deskripsi: true },
        },
      },
    });

    await logAudit({
      userId: req.user!.id,
      aksi: 'CREATE_DOCUMENT',
      targetType: 'DOCUMENT',
      targetId: document.id,
      metadata: { judul: document.judul, kategori: document.kategori, epId },
      ipAddress: req.ip,
    });

    invalidatePokjaCache();

    res.status(201).json({ message: 'Dokumen berhasil dibuat.', document });
  } catch (err: any) {
    console.error('Create document error:', err);
    res.status(500).json({ error: 'Gagal membuat dokumen.' });
  }
});

// GET /api/documents/:id - Detail dokumen lengkap
documentRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, nama: true, email: true, role: true },
        },
        elemenPenilaian: {
          include: {
            standar: {
              include: {
                pokja: {
                  select: { id: true, kode: true, nama: true },
                },
              },
            },
          },
        },
        versions: {
          orderBy: { versionNumber: 'desc' },
          include: {
            uploadedBy: {
              select: { id: true, nama: true, role: true },
            },
            annotations: {
              orderBy: { createdAt: 'desc' },
              include: {
                createdBy: {
                  select: { id: true, nama: true, role: true },
                },
              },
            },
          },
        },
        draft: true,
      },
    });

    if (!document) {
      res.status(404).json({ error: 'Dokumen tidak ditemukan.' });
      return;
    }

    res.status(200).json({ document });
  } catch (err: any) {
    console.error('Fetch document detail error:', err);
    res.status(500).json({ error: 'Gagal memuat detail dokumen.' });
  }
});

// POST /api/documents/:id/upload - Upload berkas PDF versi baru
documentRouter.post('/:id/upload', uploadPdf.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { catatan } = req.body;

    if (!req.file) {
      res.status(400).json({ error: 'Berkas PDF wajib diunggah (form-data: file).' });
      return;
    }

    // Validasi Integritas Biner (Magic Bytes)
    if (!validateMagicBytes(req.file.buffer, req.file.mimetype)) {
      res.status(400).json({
        error: 'Integritas berkas gagal diverifikasi. Header biner berkas tidak cocok dengan format yang dinyatakan.',
      });
      return;
    }

    const check = await checkPokjaOwnership(req.user, undefined, id);
    if (!check.authorized) {
      res.status(403).json({ error: check.error });
      return;
    }

    // Hitung nomor versi selanjutnya
    const lastVersion = await prisma.documentVersion.findFirst({
      where: { documentId: id },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });
    const nextVersion = (lastVersion?.versionNumber || 0) + 1;

    // Unggah ke Cloudinary
    const isVideo = /\.(mp4|webm|mov|avi)$/i.test(req.file.originalname);
    const uploadResult = await uploadPdfBuffer(
      req.file.buffer,
      check.pokjaKode.toLowerCase(),
      req.file.originalname
    );

    // Simpan salinan lokal di server jika filesystem writable (aman dari read-only fs pada Vercel/Lambda)
    const targetDirs = getUploadsDirectories();
    targetDirs.forEach((dir) => {
      try {
        const canonicalDir = path.resolve(dir);
        if (!fs.existsSync(canonicalDir)) {
          fs.mkdirSync(canonicalDir, { recursive: true });
        }
        const safeBaseName = path.basename(req.file!.originalname).replace(/[^a-zA-Z0-9.-]/g, '_');
        const localFilename = `${id}_v${nextVersion}_${safeBaseName}`;
        const targetPath = path.resolve(canonicalDir, localFilename);
        if (targetPath.startsWith(canonicalDir)) {
          fs.writeFileSync(targetPath, req.file!.buffer);
        }
      } catch (err) {
        // Read-only filesystem pada serverless environment
        console.warn(`Penyimpanan berkas lokal dilewati (${dir}):`, (err as any)?.message);
      }
    });

    // Simpan DocumentVersion
    const version = await prisma.documentVersion.create({
      data: {
        documentId: id,
        versionNumber: nextVersion,
        fileUrl: uploadResult.secure_url,
        cloudinaryPublicId: uploadResult.public_id,
        fileSize: uploadResult.bytes,
        fileType: isVideo ? 'video' : 'pdf',
        catatan: catatan ? String(catatan).trim() : null,
        uploadedById: req.user!.id,
      },
    });

    // Update timestamp dokumen
    await prisma.document.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    await logAudit({
      userId: req.user!.id,
      aksi: 'UPLOAD_VERSION',
      targetType: 'DOCUMENT_VERSION',
      targetId: version.id,
      metadata: {
        documentId: id,
        versionNumber: nextVersion,
        fileSize: uploadResult.bytes,
        url: uploadResult.secure_url,
      },
      ipAddress: req.ip,
    });

    invalidatePokjaCache();

    res.status(201).json({ message: `Versi ${nextVersion} berhasil diunggah.`, version });
  } catch (err: any) {
    console.error('Upload version error:', err);
    res.status(500).json({ error: err.message || 'Gagal mengunggah berkas PDF.' });
  }
});

// POST /api/documents/version/:versionId/ticket - Buat tiket sementara (60 detik) untuk stream media / unduh
documentRouter.post('/version/:versionId/ticket', async (req: Request, res: Response): Promise<void> => {
  try {
    const { versionId } = req.params;
    const ticket = jwt.sign(
      {
        id: req.user!.id,
        email: req.user!.email,
        role: req.user!.role,
        versionId,
        scope: 'FILE_STREAM',
      },
      JWT_SECRET,
      { expiresIn: '60s' }
    );
    res.status(200).json({ ticket });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal membuat tiket berkas.' });
  }
});

// GET /api/documents/version/:versionId/file - Stream file secara aman tanpa 401 ACL error
documentRouter.get('/version/:versionId/file', async (req: Request, res: Response): Promise<void> => {
  try {
    const { versionId } = req.params;
    const version = await prisma.documentVersion.findUnique({
      where: { id: versionId },
      include: {
        document: {
          select: { id: true, judul: true },
        },
      },
    });

    if (!version) {
      res.status(404).json({ error: 'Versi dokumen tidak ditemukan.' });
      return;
    }

    const localFile = findLocalDocumentFile(version.documentId, version.versionNumber);
    const isVideo = version.fileType === 'video';

    if (localFile) {
      let contentType = 'application/pdf';
      if (localFile.ext === '.html') contentType = 'text/html; charset=utf-8';
      else if (localFile.ext === '.png') contentType = 'image/png';
      else if (localFile.ext === '.mp4' || isVideo) contentType = 'video/mp4';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(version.document.judul)}${localFile.ext}"`);
      // Sandbox Content-Security-Policy & anti-sniffing
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'none'; style-src 'self' 'unsafe-inline'; object-src 'none'; frame-ancestors 'self'"
      );
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.sendFile(localFile.fullPath);
      return;
    }

    // Jika belum tersimpan di lokal (misal file lama dari Cloudinary)
    if (version.fileUrl) {
      if (isVideo) {
        res.redirect(version.fileUrl);
        return;
      }
      if (version.cloudinaryPublicId) {
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'surgflvc';
        const pngUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${version.cloudinaryPublicId}.png`;
        res.redirect(pngUrl);
        return;
      }
      res.redirect(version.fileUrl);
      return;
    }

    res.status(404).json({ error: 'Berkas fisik tidak ditemukan.' });
  } catch (err: any) {
    console.error('File stream error:', err);
    res.status(500).json({ error: 'Gagal memuat berkas dokumen.' });
  }
});

// GET /api/documents/version/:versionId/download - Download file langsung
documentRouter.get('/version/:versionId/download', async (req: Request, res: Response): Promise<void> => {
  try {
    const { versionId } = req.params;
    const version = await prisma.documentVersion.findUnique({
      where: { id: versionId },
      include: {
        document: {
          select: { id: true, judul: true },
        },
      },
    });

    if (!version) {
      res.status(404).json({ error: 'Versi dokumen tidak ditemukan.' });
      return;
    }

    const localFile = findLocalDocumentFile(version.documentId, version.versionNumber);
    const isVideo = version.fileType === 'video';

    if (localFile) {
      res.download(localFile.fullPath, `${version.document.judul}${localFile.ext}`);
      return;
    }

    // Jika belum tersimpan di lokal (misal file lama)
    if (version.fileUrl) {
      if (isVideo) {
        res.redirect(version.fileUrl);
        return;
      }
      if (version.cloudinaryPublicId) {
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'surgflvc';
        const pngUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${version.cloudinaryPublicId}.png`;
        res.redirect(pngUrl);
        return;
      }
      res.redirect(version.fileUrl);
      return;
    }

    res.status(404).json({ error: 'Berkas fisik tidak ditemukan.' });
  } catch (err: any) {
    console.error('Download error:', err);
    res.status(500).json({ error: 'Gagal mengunduh berkas dokumen.' });
  }
});

// PATCH /api/documents/:id/status - Transisi status dokumen
documentRouter.patch('/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, catatan } = req.body;

    if (!status || !Object.values(DocumentStatus).includes(status)) {
      res.status(400).json({ error: `Status tidak valid. Pilihan: ${Object.values(DocumentStatus).join(', ')}` });
      return;
    }

    const doc = await prisma.document.findUnique({
      where: { id },
      include: {
        elemenPenilaian: {
          include: { standar: true },
        },
      },
    });

    if (!doc) {
      res.status(404).json({ error: 'Dokumen tidak ditemukan.' });
      return;
    }

    const userRole = req.user!.role;

    // Aturan Alur Transisi Berbasis Role (RBAC)
    if (status === DocumentStatus.SUBMITTED) {
      // POKJA atau SUPERADMIN boleh submit
      if (userRole === Role.POKJA && req.user!.assignedPokjaId !== doc.elemenPenilaian.standar.pokjaId) {
        res.status(403).json({ error: 'Hanya PIC Pokja pemilik dokumen yang dapat mengajukan verifikasi.' });
        return;
      }
    } else if (status === DocumentStatus.APPROVED || status === DocumentStatus.REVISED) {
      // Hanya VERIFIKATOR atau SUPERADMIN yang berwenang memutuskan status
      if (userRole !== Role.VERIFIKATOR && userRole !== Role.SUPERADMIN) {
        res.status(403).json({ error: 'Hanya Verifikator atau Superadmin yang berwenang menyetujui atau meminta revisi dokumen.' });
        return;
      }
    }

    // Jika disetujui (APPROVED), otomatis bersihkan catatan revisi sebelumnya
    const newCatatanReview =
      status === DocumentStatus.APPROVED
        ? null
        : (catatan !== undefined ? (catatan ? String(catatan).trim() : null) : doc.catatanReview);

    const updated = await prisma.document.update({
      where: { id },
      data: {
        status,
        catatanReview: newCatatanReview,
      },
    });

    await logAudit({
      userId: req.user!.id,
      aksi: 'UPDATE_STATUS',
      targetType: 'DOCUMENT',
      targetId: id,
      metadata: { previousStatus: doc.status, newStatus: status, catatan: catatan || null },
      ipAddress: req.ip,
    });

    invalidatePokjaCache();

    res.status(200).json({ message: `Status dokumen berhasil diubah menjadi ${status}.`, document: updated });
  } catch (err: any) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Gagal memperbarui status dokumen.' });
  }
});

// POST /api/documents/:id/annotations - Tambah anotasi / catatan revisi pada versi berkas
documentRouter.post('/:id/annotations', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { documentVersionId, pageNumber, tipe, koordinatJson, catatanRevisi } = req.body;

    if (!documentVersionId || pageNumber === undefined || !tipe || !catatanRevisi) {
      res.status(400).json({ error: 'Field documentVersionId, pageNumber, tipe, dan catatanRevisi wajib diisi.' });
      return;
    }

    // Verifikator dan Superadmin diizinkan
    if (req.user!.role !== Role.VERIFIKATOR && req.user!.role !== Role.SUPERADMIN) {
      res.status(403).json({ error: 'Hanya Verifikator atau Superadmin yang dapat menambahkan anotasi peninjauan.' });
      return;
    }

    const annotation = await prisma.documentAnnotation.create({
      data: {
        documentVersionId,
        pageNumber: Number(pageNumber),
        tipe: String(tipe),
        koordinatJson: typeof koordinatJson === 'object' ? JSON.stringify(koordinatJson) : String(koordinatJson || '{}'),
        catatanRevisi: String(catatanRevisi).trim(),
        createdById: req.user!.id,
      },
    });

    await logAudit({
      userId: req.user!.id,
      aksi: 'ADD_ANNOTATION',
      targetType: 'DOCUMENT_ANNOTATION',
      targetId: annotation.id,
      metadata: { documentId: id, versionId: documentVersionId, page: pageNumber },
      ipAddress: req.ip,
    });

    res.status(201).json({ message: 'Anotasi peninjauan berhasil ditambahkan.', annotation });
  } catch (err: any) {
    console.error('Create annotation error:', err);
    res.status(500).json({ error: 'Gagal menambahkan anotasi.' });
  }
});

// PUT /api/documents/:id/draft - Simpan draf Rich Text Editor (TipTap)
documentRouter.put('/:id/draft', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { contentHtml, contentJson } = req.body;

    if (!contentHtml) {
      res.status(400).json({ error: 'Konten dokumen HTML wajib disediakan.' });
      return;
    }

    const check = await checkPokjaOwnership(req.user, undefined, id);
    if (!check.authorized) {
      res.status(403).json({ error: check.error });
      return;
    }

    const cleanHtml = await sanitizeDocumentHtml(String(contentHtml));

    const draft = await prisma.documentDraft.upsert({
      where: { documentId: id },
      create: {
        documentId: id,
        contentHtml: cleanHtml,
        contentJson: contentJson ? (typeof contentJson === 'object' ? JSON.stringify(contentJson) : String(contentJson)) : null,
        lastSavedById: req.user!.id,
      },
      update: {
        contentHtml: cleanHtml,
        contentJson: contentJson ? (typeof contentJson === 'object' ? JSON.stringify(contentJson) : String(contentJson)) : null,
        lastSavedById: req.user!.id,
      },
    });

    await logAudit({
      userId: req.user!.id,
      aksi: 'SAVE_DRAFT',
      targetType: 'DOCUMENT_DRAFT',
      targetId: draft.id,
      metadata: { documentId: id },
      ipAddress: req.ip,
    });

    res.status(200).json({ message: 'Draf dokumen berhasil disimpan.', draft });
  } catch (err: any) {
    console.error('Save draft error:', err);
    res.status(500).json({ error: 'Gagal menyimpan draf dokumen.' });
  }
});

// POST /api/documents/:id/publish-draft - Terbitkan draf Word sebagai versi resmi baru
documentRouter.post('/:id/publish-draft', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { contentHtml, catatan } = req.body;

    const check = await checkPokjaOwnership(req.user, undefined, id);
    if (!check.authorized) {
      res.status(403).json({ error: check.error });
      return;
    }

    const doc = await prisma.document.findUnique({
      where: { id },
      include: {
        draft: true,
        elemenPenilaian: {
          include: { standar: { include: { pokja: true } } },
        },
      },
    });

    if (!doc) {
      res.status(404).json({ error: 'Dokumen tidak ditemukan.' });
      return;
    }

    const rawHtml = contentHtml || doc.draft?.contentHtml;
    if (!rawHtml) {
      res.status(400).json({ error: 'Konten dokumen kosong. Silakan ketik dokumen sebelum menerbitkan.' });
      return;
    }

    const htmlToPublish = await sanitizeDocumentHtml(String(rawHtml));

    const lastVersion = await prisma.documentVersion.findFirst({
      where: { documentId: id },
      orderBy: { versionNumber: 'desc' },
    });
    const nextVersion = (lastVersion?.versionNumber || 0) + 1;

    let canonicalUploadsDir: string;
    try {
      const preferredDir = path.join(process.cwd(), 'uploads', 'documents');
      if (!fs.existsSync(preferredDir)) {
        fs.mkdirSync(preferredDir, { recursive: true });
      }
      canonicalUploadsDir = path.resolve(preferredDir);
    } catch {
      const fallbackDir = path.join(os.tmpdir(), 'uploads', 'documents');
      if (!fs.existsSync(fallbackDir)) {
        fs.mkdirSync(fallbackDir, { recursive: true });
      }
      canonicalUploadsDir = path.resolve(fallbackDir);
    }

    const filename = `${id}_v${nextVersion}_dokumen_resmi.html`;
    const fullPath = path.resolve(canonicalUploadsDir, filename);
    if (!fullPath.startsWith(canonicalUploadsDir)) {
      throw new Error('Akses path berkas tidak sah.');
    }

    const styledHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${doc.judul}</title>
  <style>
    @page { size: A4; margin: 25mm 20mm; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 30px;
    }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { border: 1px solid #334155; padding: 8px 12px; }
    th { background: #f8fafc; font-weight: bold; }
    h1, h2, h3 { color: #0f172a; margin-top: 18px; margin-bottom: 8px; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  ${htmlToPublish}
</body>
</html>`;

    fs.writeFileSync(fullPath, styledHtml, 'utf-8');

    const newVersion = await prisma.documentVersion.create({
      data: {
        documentId: id,
        versionNumber: nextVersion,
        fileUrl: `/api/documents/version/${id}/file`,
        fileType: 'html',
        fileSize: Buffer.byteLength(styledHtml),
        catatan: catatan || 'Diterbitkan melalui Editor Dokumen In-App (Word Mode)',
        uploadedById: req.user!.id,
      },
      include: {
        uploadedBy: {
          select: { id: true, nama: true, role: true },
        },
        annotations: true,
      },
    });

    await prisma.documentDraft.upsert({
      where: { documentId: id },
      create: {
        documentId: id,
        contentHtml: htmlToPublish,
        lastSavedById: req.user!.id,
      },
      update: {
        contentHtml: htmlToPublish,
        lastSavedById: req.user!.id,
      },
    });

    await prisma.document.update({
      where: { id },
      data: { status: DocumentStatus.SUBMITTED },
    });

    await logAudit({
      userId: req.user!.id,
      aksi: 'PUBLISH_DRAFT_VERSION',
      targetType: 'DOCUMENT_VERSION',
      targetId: newVersion.id,
      metadata: { documentId: id, versionNumber: nextVersion },
      ipAddress: req.ip,
    });

    invalidatePokjaCache();

    res.status(201).json({
      message: 'Versi dokumen berhasil diterbitkan dan siap diverifikasi.',
      version: newVersion,
    });
  } catch (err: any) {
    console.error('Publish draft error:', err);
    res.status(500).json({ error: 'Gagal menerbitkan draf dokumen.' });
  }
});

// DELETE /api/documents/:id - Hapus dokumen beserta semua versinya
documentRouter.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const doc = await prisma.document.findUnique({
      where: { id },
      include: {
        elemenPenilaian: {
          include: { standar: { include: { pokja: true } } },
        },
        versions: true,
      },
    });

    if (!doc) {
      res.status(404).json({ error: 'Dokumen tidak ditemukan.' });
      return;
    }

    const isSuperAdmin = req.user?.role === Role.SUPERADMIN;
    const isOwner = req.user?.assignedPokjaId === doc.elemenPenilaian.standar.pokjaId || req.user?.id === doc.createdById;

    if (!isSuperAdmin) {
      if (!isOwner) {
        res.status(403).json({ error: 'Anda tidak memiliki hak untuk menghapus dokumen Pokja lain.' });
        return;
      }
      if (doc.status === DocumentStatus.APPROVED) {
        res.status(403).json({ error: 'Dokumen berstatus APPROVED sudah disahkan dan tidak dapat dihapus oleh Pokja. Hubungi Super Administrator.' });
        return;
      }
    }

    // Hapus berkas di Cloudinary
    for (const v of doc.versions) {
      if (v.cloudinaryPublicId) {
        await deleteCloudinaryResource(v.cloudinaryPublicId, v.fileType === 'video' ? 'video' : 'raw');
      }
    }

    // Hapus data terkait via cascade atau filter relasi
    await prisma.documentAnnotation.deleteMany({
      where: { documentVersion: { documentId: id } }
    });
    await prisma.documentDraft.deleteMany({
      where: { documentId: id }
    });
    await prisma.documentVersion.deleteMany({
      where: { documentId: id }
    });
    await prisma.document.delete({
      where: { id },
    });

    await logAudit({
      userId: req.user!.id,
      aksi: 'DELETE_DOCUMENT',
      targetType: 'DOCUMENT',
      targetId: id,
      metadata: { judul: doc.judul, pokjaKode: doc.elemenPenilaian.standar.pokja.kode },
      ipAddress: req.ip,
    });

    invalidatePokjaCache();

    res.status(200).json({ message: 'Dokumen dan seluruh riwayat versinya berhasil dihapus.' });
  } catch (err: any) {
    console.error('Delete document error:', err);
    res.status(500).json({ error: 'Gagal menghapus dokumen.' });
  }
});

