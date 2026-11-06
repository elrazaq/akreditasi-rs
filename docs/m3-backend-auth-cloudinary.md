# M3: Core Backend API, Autentikasi JWT & Integrasi Cloudinary

## Tujuan
Membangun fondasi layanan backend Express.js lengkap untuk akreditasi STARKES 2024:
1. Autentikasi berbasis JWT dan middleware RBAC 3-tingkat (`SUPERADMIN`, `VERIFIKATOR`, `POKJA`).
2. Isolasi akses Pokja (*Pokja scoping*): PIC Pokja hanya dapat mengunggah dan mengedit dokumen milik Pokja yang ditugaskan.
3. Integrasi upload berkas PDF ke Cloudinary dengan validasi ketat (MIME type khusus PDF, batasan ukuran berkas).
4. Endpoint RESTful untuk Pokja, Standar, Elemen Penilaian (EP), Dokumen, Versi Berkas, dan Anotasi.
5. Pencatatan otomatis jejak audit (*Audit Log Trail*) pada setiap aksi mutasi data.

---

## Arsitektur Modul Backend (`api/src/`)

```
api/src/
├── app.ts                 # Express configuration, global middleware & route registration
├── lib/
│   ├── prisma.ts          # Prisma Client singleton
│   ├── cloudinary.ts      # Cloudinary uploader service (PDF storage)
│   └── audit.ts           # Audit log helper utility
├── middleware/
│   ├── auth.ts            # JWT verification & req.user injector
│   ├── rbac.ts            # Role checker (SUPERADMIN, VERIFIKATOR, POKJA)
│   ├── pokjaScope.ts      # Validasi batas akses Pokja PIC
│   └── upload.ts          # Multer memory storage & PDF-only validator
└── routes/
    ├── auth.routes.ts     # POST /login, GET /me
    ├── pokja.routes.ts    # GET /pokja, GET /pokja/:id, GET /ep/:id
    ├── document.routes.ts # CRUD Document, Version upload, Status transition
    └── audit.routes.ts    # GET /audit-logs
```

---

## Rincian Pekerjaan

### 1. Autentikasi & RBAC Middleware
- **Kredensial**: Login via `POST /api/auth/login` memvalidasi email dan password hash bcrypt.
- **JWT Payload**: Menyimpan `{ id, email, role, nama, assignedPokjaId }`.
- **Token Middleware**:
  - `authenticateToken`: Memeriksa header `Authorization: Bearer <token>`, memvalidasi signature & expiration.
  - `requireRole(...roles)`: Memastikan hanya role berwenang yang dapat mengakses endpoint tertentu.
  - `requirePokjaScope`: Memastikan PIC Pokja hanya mengunggah/mengubah dokumen di bawah Pokja miliknya (Superadmin dapat mengakses semua).

### 2. Layanan Penyimpanan Cloudinary (Khusus PDF)
- Integrasi SDK `cloudinary` resmi.
- Upload menggunakan `multer` memory storage (tanpa menulis ke disk lokal serverless Vercel).
- Validasi ketat:
  - Magic byte / MIME type: `application/pdf`.
  - Ukuran berkas maksimum: 15 MB per dokumen.
  - Direktori Cloudinary: `akreditasi-rs/<kode_pokja>/`.
  - Menyimpan `fileUrl`, `cloudinaryPublicId`, dan `fileSize` pada tabel `DocumentVersion`.

### 3. Matriks Hak Akses & Alur Status Dokumen
- **DRAFT**: Dibuat oleh PIC Pokja atau Superadmin.
- **SUBMITTED**: Diajukan oleh PIC Pokja setelah berkas PDF/versi diunggah.
- **APPROVED / REVISED**: Diputuskan oleh Verifikator atau Superadmin dengan catatan evaluasi.

| Endpoint | Method | Role Akses | Keterangan |
| :--- | :---: | :--- | :--- |
| `/api/auth/login` | POST | Publik | Autentikasi email & password |
| `/api/auth/me` | GET | Authenticated | Profil user aktif & Pokja assignment |
| `/api/pokja` | GET | Authenticated | Daftar 16 Pokja + ringkasan statistik |
| `/api/pokja/:id` | GET | Authenticated | Detail Pokja beserta Standar & EP |
| `/api/ep/:id` | GET | Authenticated | Detail EP beserta daftar berkas terkait |
| `/api/documents` | POST | POKJA, SUPERADMIN | Buat dokumen baru pada EP |
| `/api/documents/:id` | GET | Authenticated | Detail dokumen, riwayat versi & anotasi |
| `/api/documents/:id/upload` | POST | POKJA, SUPERADMIN | Upload PDF versi baru ke Cloudinary |
| `/api/documents/:id/status` | PATCH | VERIFIKATOR, SUPERADMIN, POKJA | Transisi status (Submit / Approve / Revise) |
| `/api/audit-logs` | GET | SUPERADMIN, POKJA | Riwayat aktivitas sistem |

### 4. Audit Trail Otomatis
- Helper `logAudit(prisma, { userId, aksi, targetType, targetId, metadata, ipAddress })`.
- Mencatat aksi penting: `USER_LOGIN`, `DOCUMENT_CREATED`, `VERSION_UPLOADED`, `STATUS_CHANGED`, `ANNOTATION_ADDED`.

---

## Kriteria Selesai (Acceptance Criteria)

- [x] Modul autentikasi JWT (`/login`, `/me`) berfungsi dengan enkripsi password bcrypt.
- [x] Middleware RBAC dan Pokja Scoping memblokir akses tidak sah (HTTP 401 dan 403).
- [x] Layanan Cloudinary terkonfigurasi dengan validasi khusus PDF dan penanganan error yang andal.
- [x] Endpoint CRUD Pokja, Standar, EP, Dokumen, dan Versi beroperasi penuh.
- [x] Alur transisi status dokumen (DRAFT -> SUBMITTED -> APPROVED / REVISED) tervalidasi sesuai RBAC.
- [x] Seluruh mutasi dokumen tercatat dalam tabel `AuditLog`.
- [x] Seluruh endpoint lolos uji kompilasi TypeScript (`npm run build:api`).

