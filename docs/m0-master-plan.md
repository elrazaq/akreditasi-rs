# M0: Master Plan - Modern Hospital Accreditation Document System (STARKES 2024)

Sistem dokumentasi akreditasi rumah sakit terpusat berbasis standar **STARKES Kemenkes 2024**. Dirancang untuk 20-30 pengguna aktif dengan tingkat keamanan bertingkat (RBAC), peninjauan dokumen terverifikasi, editor dokumen *in-app* (Rich Text to PDF), serta *built-in* PDF viewer dengan fitur anotasi.

---

## 1. Spesifikasi Arsitektur & Teknologi

- **Arsitektur**: Monorepo terpadu (1 GitHub Repo & 1 Vercel Project).
- **Frontend**: React 19 / Vite + TypeScript + Tailwind CSS + Lucide Icons.
- **Backend**: Express.js (TypeScript) dikonfigurasi sebagai Vercel Serverless Function (`/api`).
- **Database**: Neon PostgreSQL dengan Prisma ORM (koneksi pooled & direct).
- **Penyimpanan Berkas**: Cloudinary (Free tier 25 GB khusus berkas PDF).
- **Deployment**: Vercel terhubung ke GitHub (CI/CD otomatis).

### Palet Warna (Coolors Medical Institutional Grade)
- **Primary Navy**: `#1E3A8A` (Elegan, kredibel, formal)
- **Accent Hospital Blue**: `#0284C7` / `#0EA5E9` (Tombol aksi & indikator aktif)
- **Neutral Dark / Text**: `#0F172A` (Slate 900 kontras tinggi)
- **Neutral Surface**: `#FFFFFF` (Surface) & `#F8FAFC` (Latar belakang)
- **Border**: `#E2E8F0` / `#CBD5E1` (Batas tegas minimalis)
- **Status Indicators**:
  - `APPROVED`: `#059669` (Emerald 600)
  - `REVISED` / Butuh Perbaikan: `#DC2626` (Red 600)
  - `SUBMITTED` / Menunggu Verifikasi: `#D97706` (Amber 600)
  - `DRAFT`: `#64748B` (Slate 500)

---

## 2. Model Data & Standar STARKES 2024 (Prisma Schema)

### 16 Pokja STARKES Kemenkes 2024
1. **TKRS** (Tata Kelola Rumah Sakit)
2. **KPS** (Kualifikasi dan Pendidikan Staf)
3. **MFK** (Manajemen Fasilitas dan Keselamatan)
4. **PMKP** (Peningkatan Mutu dan Keselamatan Pasien)
5. **MRMIK** (Manajemen Rekam Medis dan Informasi Kesehatan)
6. **PPI** (Pencegahan dan Pengendalian Infeksi)
7. **PP** (Pelayanan Pasien)
8. **AKP** (Akses ke Rumah Sakit dan Kontinuitas Pelayanan)
9. **PAP** (Pelayanan dan Asuhan Pasien)
10. **PAB** (Pelayanan Anestesi dan Bedah)
11. **PKPO** (Pelayanan Kefarmasian dan Penggunaan Obat)
12. **KE** (Komunikasi dan Edukasi)
13. **HPK** (Hak Pasien dan Keluarga)
14. **SKP** (Sasaran Keselamatan Pasien)
15. **PROGNAS** (Program Nasional)
16. **KPS-Tambahan / Khusus RS Pendidikan**

### Hirarki Entitas
- `User` (id, nama, email, passwordHash, role: SUPERADMIN/POKJA/VERIFIKATOR, assignedPokjaId)
- `Pokja` (id, kode, nama, kelompok, urutan)
- `Standar` (id, pokjaId, kode, judul, urutan)
- `ElemenPenilaian` (id, standarId, kode, deskripsi, jenisDokumen)
- `Document` (id, epId, judul, kategori: REGULASI/BUKTI/OBSERVASI/WAWANCARA/SIMULASI, status, createdById)
- `DocumentVersion` (id, documentId, versionNumber, fileUrl, cloudinaryPublicId, fileSize, uploadedById, catatan)
- `DocumentAnnotation` (id, documentVersionId, pageNumber, tipe, koordinatJson, catatanRevisi, createdById)
- `DocumentDraft` (id, documentId, contentHtml, contentJson, lastSavedById)
- `AuditLog` (id, userId, aksi, targetType, targetId, metadataJson, ipAddress, createdAt)

---

## 3. Matriks Peran Pengguna (RBAC Multi-Level)

| Hak Akses / Aksi | Superadmin | Pokja (PIC) | Verifikator |
| :--- | :---: | :---: | :---: |
| Manajemen Pengguna & Penugasan Pokja | Ya | Tidak | Tidak |
| Master Data STARKES 2024 | Ya | Tidak | Tidak |
| Upload Dokumen Baru | Ya | Ya (Hanya Pokja miliknya) | Tidak |
| Buat Draf Dokumen (Rich Text Editor) | Ya | Ya (Hanya Pokja miliknya) | Tidak |
| Edit & Hapus Dokumen Draf | Ya | Ya (Hanya Pokja miliknya) | Tidak |
| Anotasi / Catatan Revisi PDF | Ya | Baca & Balas | Ya |
| Putusan Status: APPROVE / REVISI | Ya (Override) | Tidak | Ya (Penentu Utama) |
| Read-only Dokumen Berstatus Approved | Ya | Ya | Ya |
| Audit Trail / Log Aktivitas | Penuh | Terbatas aktivitas sendiri | Tidak |

---

## 4. Rencana Roadmap Milestone (M1 - M7)

- [x] **M1: Fondasi Proyek & Konfigurasi Monorepo**
  - Setup package.json root, `/client` (Vite React), `/api` (Express.js Vercel handler).
  - Setup TypeScript, Tailwind CSS, konfigurasi Vercel & scripts build.
- [x] **M2: Database, Prisma ORM & Seeding STARKES 2024**
  - Konfigurasi koneksi Neon PostgreSQL.
  - Penulisan skema Prisma komprehensif.
  - Skrip seeder 16 Pokja, Standar, dan EP STARKES 2024 resmi.
- [x] **M3: Core Backend API, Autentikasi JWT & Integrasi Cloudinary**
  - Endpoint auth (Login, Profil) & middleware RBAC multi-level.
  - Service upload aman Cloudinary (validasi khusus PDF).
  - Endpoint CRUD Dokumen, Versi, dan Audit Log.
- [x] **M4: Frontend Shell, Desain Sistem & Pokja Explorer**
  - Layout dashboard medical-grade (Deep Navy + Slate).
  - Navigasi hirarkis: Pokja -> Standar -> EP dengan progress bar capaian kelengkapan.
  - Daftar berkas terstruktur per EP beserta badge status alur.
- [ ] **M5: PDF Viewer Terintegrasi & Engine Anotasi Verifikator**
  - Viewer PDF tanpa unduh berkas.
  - Fitur anotasi verifikator (catatan revisi per halaman, highlight, stempel status).
  - Riwayat log perubahan versi dokumen.
- [ ] **M6: Rich Text Editor In-App & Generator PDF Resmi**
  - Editor TipTap dengan format baku dokumen akreditasi (Kop surat, identitas dokumen).
  - Konversi & ekspor instan draf ke PDF terunggah ke Cloudinary.
- [ ] **M7: Pengujian, Keamanan Akhir, CI/CD GitHub & Panduan Deployment Vercel**
  - Audit keamanan (IDOR, rate limit, sanitasi input).
  - Uji alur end-to-end 3 role (Pokja -> Verifikator -> Superadmin).
  - Panduan penyambungan Neon, Cloudinary, GitHub repo, dan Vercel.
