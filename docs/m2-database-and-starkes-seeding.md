# M2: Database, Prisma ORM & Seeding STARKES 2024

## Tujuan
Mengonfigurasi Prisma ORM dengan PostgreSQL (kompatibel Neon PostgreSQL), mendefinisikan skema relasi lengkap untuk akreditasi rumah sakit (Users, RBAC, Pokja, Standar, Elemen Penilaian, Dokumen, Versi, Anotasi, Audit Log), dan membuat skrip seeder lengkap untuk 16 Pokja STARKES Kemenkes 2024 beserta Standar dan Elemen Penilaian intinya.

---

## Rincian Pekerjaan

### 1. Dependensi Database & Prisma
- Instalasi `@prisma/client` dan `prisma` CLI di workspace `api`.
- Konfigurasi `prisma/schema.prisma` dengan provider PostgreSQL (support direct connection & pooled connection Neon).

### 2. Definisi Skema Prisma
- `enum Role`: `SUPERADMIN`, `POKJA`, `VERIFIKATOR`.
- `enum DocumentStatus`: `DRAFT`, `SUBMITTED`, `APPROVED`, `REVISED`.
- `enum DocumentCategory`: `REGULASI`, `BUKTI`, `OBSERVASI`, `WAWANCARA`, `SIMULASI`.
- `enum PokjaGroup`: `TATA_KELOLA`, `PELAYANAN`, `MANAJEMEN`, `PROGNAS`.
- Tabel: `User`, `Pokja`, `Standar`, `ElemenPenilaian`, `Document`, `DocumentVersion`, `DocumentAnnotation`, `DocumentDraft`, `AuditLog`.

### 3. Master Data Seeder STARKES 2024 (16 Pokja)
- Memasukkan 16 Pokja resmi:
  1. TKRS (Tata Kelola Rumah Sakit)
  2. KPS (Kualifikasi dan Pendidikan Staf)
  3. MFK (Manajemen Fasilitas dan Keselamatan)
  4. PMKP (Peningkatan Mutu dan Keselamatan Pasien)
  5. MRMIK (Manajemen Rekam Medis dan Informasi Kesehatan)
  6. PPI (Pencegahan dan Pengendalian Infeksi)
  7. PP (Pelayanan Pasien)
  8. AKP (Akses ke Rumah Sakit dan Kontinuitas Pelayanan)
  9. PAP (Pelayanan dan Asuhan Pasien)
  10. PAB (Pelayanan Anestesi dan Bedah)
  11. PKPO (Pelayanan Kefarmasian dan Penggunaan Obat)
  12. KE (Komunikasi dan Edukasi)
  13. HPK (Hak Pasien dan Keluarga)
  14. SKP (Sasaran Keselamatan Pasien)
  15. PROGNAS (Program Nasional)
  16. KPS-Tambahan (Standar Pendidikan Kedokteran/Kesehatan bila RS Pendidikan)
- Menyertakan data Standar dan Elemen Penilaian (EP) rujukan.
- Seed pengguna bawaan awal (1 Superadmin, 1 Verifikator, PIC Pokja percontohan).

### 4. Kriteria Selesai (Acceptance Criteria)
- [x] Skema Prisma `prisma/schema.prisma` tervalidasi (`npx prisma validate`).
- [x] Prisma Client ter-generate dengan TypeScript types.
- [x] Skrip `prisma/seed.ts` siap dijalankan dengan data komprehensif.
- [x] File `.env.example` terdokumentasi rapi untuk konfigurasi `DATABASE_URL` Neon.
