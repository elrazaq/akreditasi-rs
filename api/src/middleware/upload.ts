import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

const storage = multer.memoryStorage();

// Pemetaan ketat MIME type resmi dengan ekstensi yang diizinkan
const MIME_EXTENSION_MAP: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'video/mp4': ['.mp4'],
  'video/webm': ['.webm'],
  'video/quicktime': ['.mov'],
  'video/x-msvideo': ['.avi'],
};

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const mime = file.mimetype.toLowerCase();
  const name = file.originalname.toLowerCase();

  const allowedExts = MIME_EXTENSION_MAP[mime];

  // Wajib lolos KEDUA validasi (MIME valid DAN ekstensi sesuai dengan MIME)
  if (allowedExts && allowedExts.some((ext) => name.endsWith(ext))) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Format berkas tidak sah. Hanya dokumen PDF (.pdf) dan video MP4/WebM (.mp4/.webm) yang diperbolehkan.'
      )
    );
  }
};

/**
 * Validasi Magic Bytes (file signature) di level biner
 * Mencegah file berbahaya bertopeng ekstensi .pdf / .mp4
 */
export function validateMagicBytes(buffer: Buffer, mimetype: string): boolean {
  if (buffer.length < 4) return false;

  if (mimetype === 'application/pdf') {
    // Magic bytes %PDF- (0x25, 0x50, 0x44, 0x46)
    return (
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46
    );
  }

  if (mimetype === 'video/mp4' || mimetype === 'video/quicktime') {
    // MP4/MOV memiliki atom 'ftyp' pada offset 4-7
    if (buffer.length >= 8) {
      const atom = buffer.toString('ascii', 4, 8);
      return atom === 'ftyp' || atom === 'moov';
    }
  }

  if (mimetype === 'video/webm') {
    // WebM EBML header (0x1A, 0x45, 0xDF, 0xA3)
    return (
      buffer[0] === 0x1a &&
      buffer[1] === 0x45 &&
      buffer[2] === 0xdf &&
      buffer[3] === 0xa3
    );
  }

  return true;
}

export const uploadEvidence = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // Dibatasi 50 MB untuk menjaga kestabilan memori heap server
    files: 1,
  },
  fileFilter,
});

// Alias for backwards compatibility
export const uploadPdf = uploadEvidence;
