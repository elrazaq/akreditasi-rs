# Milestone 5: Security Audit & Hardening Report

> **Status:** **ALL PATCHED & RESOLVED** (6 November 2026)  
> **Lingkup:** Hardening menyeluruh pada backend Express, Prisma DB, autentikasi JWT, otorisasi RBAC, upload file, sanitasi XSS, rate limiting, dan CORS.  
> **Metode:** SAST (Semgrep) & Secure Code Remediation.

---

## 1. Matriks Status Remediasi

| ID | Kerentanan | Severity | Status Remediasi | Solusi yang Diterapkan |
|---|---|---|---|---|
| **SEC-01** | Hardcoded Fallback Secret JWT | **HIGH** | **RESOLVED** | Secret statis publik dihapus. `JWT_SECRET` diganti random hex 64-karakter kriptografis dan wajib diset di production. |
| **SEC-02** | Stored XSS via HTML Document Draft & View | **HIGH** | **RESOLVED** | Pustaka `sanitize-html` dipasang; seluruh input HTML dibersihkan dari tag berbahaya `<script>` / `<iframe>` / atribut `on*`. Header CSP dan nosniff diterapkan saat streaming berkas. |
| **SEC-03** | Bypass Validasi Tipe File (Logika OR) | **MEDIUM** | **RESOLVED** | Filter diubah dari `||` menjadi `&&` ketat (MIME harus berpasangan dengan ekstensi yang sah). Ditambah verifikasi biner Magic Bytes (`%PDF`, MP4 atom `ftyp`, WebM EBML). |
| **SEC-04** | DoS Heap Memory Exhaustion (Multer MemoryStorage) | **MEDIUM** | **RESOLVED** | Batas ukuran upload diturunkan menjadi 50MB per file dengan batasan 1 file paralel untuk mencegah heap memory overflow. |
| **SEC-05** | Paparan Token JWT via URL Query Parameter (`?token=`) | **MEDIUM** | **RESOLVED** | Pengiriman session token JWT lewat query string dilarang total. Khusus pemutaran video tag / unduhan, sistem menggunakan **Tiket Aliran Sementara (Stream Ticket)** berskop `FILE_STREAM` berumur 60 detik. |
| **SEC-06** | Tidak Ada Rate Limiting pada Login & Brute-Force | **MEDIUM** | **RESOLVED** | Pasang `express-rate-limit`. Batas global API 300 req/15 mnt, batas autentikasi (`/api/auth/login`, `/api/auth/change-password`) 30 percobaan/15 mnt per IP. |
| **SEC-07** | Risiko Path Traversal Tanpa Canonical Path Verification | **LOW** | **RESOLVED** | Ditambahkan validasi kanonikal `path.resolve()` memastikan path berkas lokal selalu berada di dalam direktori penyimpanan resmi `uploads/documents`. |
| **SEC-08** | Wildcard Fallback CORS dengan `credentials: true` | **LOW** | **RESOLVED** | CORS diubah menjadi whitelist origin eksplisit (`http://localhost:3000`, `http://127.0.0.1:3000`, `CLIENT_ORIGIN`) tanpa wildcard `*`. |

---

## 2. Rincian Patch Kode yang Diterapkan

### 1. SEC-01 & SEC-05: Autentikasi JWT & Tiket Sementara 60 Detik
- **File:** `api/src/middleware/auth.ts`, `api/src/routes/auth.routes.ts`, `api/.env`
- Session JWT token tidak lagi diizinkan di URL `?token=`.
- Ditambahkan generator tiket sementara 60 detik via `POST /api/documents/version/:versionId/ticket` untuk streaming video tanpa membocorkan master JWT token.

### 2. SEC-02: Perlindungan XSS & Header CSP
- **File:** `api/src/routes/document.routes.ts`
- Sanitasi HTML dengan `sanitizeDocumentHtml()` sebelum draf disimpan atau diterbitkan.
- Header CSP ketat dipasang saat penyajian file:
  `Content-Security-Policy: default-src 'self'; script-src 'none'; style-src 'self' 'unsafe-inline'; object-src 'none'; frame-ancestors 'self'`
  `X-Content-Type-Options: nosniff`

### 3. SEC-03 & SEC-04: Pengetatan Upload File & Validasi Biner Magic Bytes
- **File:** `api/src/middleware/upload.ts`, `api/src/routes/document.routes.ts`
- Logika diubah menjadi wajib memenuhi MIME dan Ekstensi sekaligus.
- Fungsi `validateMagicBytes()` memverifikasi biner header asli `%PDF-` untuk dokumen dan `ftyp`/`EBML` untuk video.

### 4. SEC-06 & SEC-08: Rate Limiting & Whitelist CORS
- **File:** `api/src/app.ts`
- Pasang `globalApiLimiter` dan `authLimiter` berbasis IP.
- Whitelist origin eksplisit port 3000 dan 5173 dengan pemblokiran origin liar.

### 5. SEC-07: Verifikasi Path Kanonikal
- **File:** `api/src/routes/document.routes.ts`
- Sanitasi `path.basename()` dan verifikasi `fullPath.startsWith(canonicalDir)`.

---

## 3. Hasil Verifikasi Akhir
- Build backend (`tsc`): **0 Error**
- Build frontend (`tsc -b && vite build`): **0 Error**
- Server API Dev: **Berjalan Normal di port 4000**
- Seluruh 8 titik kerentanan telah ditutup dan diamankan.
