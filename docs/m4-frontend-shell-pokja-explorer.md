# M4: Frontend Shell, Desain Sistem & Pokja Explorer

## Tujuan

Membangun antarmuka pengguna frontend (React 19 + TypeScript + Tailwind CSS) berstandar institusional medis (_medical-grade_ Deep Navy & Clean Slate) untuk sistem dokumentasi akreditasi STARKES 2024:

1. **Autentikasi & Sesi Frontend**: Login page/modal, Auth Context, manajemen token JWT di `localStorage`, dan proteksi rute berbasis peran (_Role-Based UI_).
2. **Medical-Grade Shell & Layout**: Sidebar navigasi terstruktur untuk 16 Pokja, Topbar dengan status pengguna/peran dan identitas rumah sakit, serta breadcrumb navigasi.
3. **Pokja Explorer Dashboard**: Tampilan visual 16 Pokja terbagi dalam 4 kelompok resmi, lengkap dengan kartu metrik progres kepatuhan (_compliance rate_).
4. **Penjelajah Hierarkis Interaktif**: Navigasi mendalam dari Pokja -> Standar -> Elemen Penilaian (EP) dengan pencarian cepat dan filter.
5. **EP Document Workspace**: Tampilan detail EP, tag kebutuhan dokumen (Regulasi, Bukti, Observasi, Wawancara, Simulasi), daftar dokumen dengan badge status alur akreditasi, dan modal upload berkas PDF ke Cloudinary.

---

## Arsitektur Modul Frontend (`client/src/`)

```
client/src/
├── api/
│   └── client.ts             # Fetch client terpusat dengan Bearer token interceptor
├── context/
│   └── AuthContext.tsx       # Auth provider, user state, login/logout handlers
├── components/
│   ├── layout/
│   │   ├── Shell.tsx         # Layout wrapper (Sidebar + Topbar + Main Content)
│   │   ├── Sidebar.tsx       # Daftar 16 Pokja terkelompok dengan indikator progres
│   │   ├── Topbar.tsx        # Info pengguna, badge role, profil RSUD Bintan, logout
│   │   └── Breadcrumb.tsx    # Navigasi jejak hierarki aktif
│   ├── auth/
│   │   └── LoginForm.tsx     # Form autentikasi email & kata sandi dengan feedback instan
│   ├── pokja/
│   │   ├── PokjaOverview.tsx # Grid kartu 16 Pokja dengan ringkasan status berkas
│   │   ├── PokjaCard.tsx     # Kartu Pokja individu dengan progress bar capaian
│   │   └── StandarList.tsx   # Accordion standar dan rincian EP
│   └── ep/
│       ├── EPWorkspace.tsx   # Tampilan kerja EP terpilih
│       ├── DocumentCard.tsx  # Berkas terunggah, status badge, riwayat versi
│       ├── UploadModal.tsx   # Dialog upload berkas PDF dengan validasi ukuran
│       └── CreateDocModal.tsx# Dialog pembuatan metadata dokumen baru
├── types/
│   └── index.ts              # TypeScript interface untuk Pokja, Standar, EP, Dokumen, User
├── App.tsx                   # Root component dengan router / tab state & auth switch
├── index.css                 # Token warna medis & utilitas tampilan
└── main.tsx                  # Vite React entry point
```

---

## Rincian Pekerjaan

### 1. Autentikasi & API Client

- **Auth Service**:
  - Menyimpan token JWT di `localStorage`.
  - Mengambil profil mutakhir via `GET /api/auth/me`.
  - Log out membersihkan token dan mengembalikan state ke layar login.
- **HTTP Interceptor**:
  - Otomatis menyertakan header `Authorization: Bearer <token>`.
  - Menangani error `401 Unauthorized` dengan pembersihan sesi otomatis.

### 2. Layout & Desain Sistem Medis

- **Palet Warna STARKES**:
  - `Primary Navy`: `#1E3A8A` (Sidebar, header brand)
  - `Hospital Blue`: `#0284C7` (Tombol aksi, status aktif)
  - `Slate Surface`: `#F8FAFC` (Latar belakang utama)
  - Status Dokumen:
    - `APPROVED`: Emerald (`#059669`)
    - `SUBMITTED`: Amber (`#D97706`)
    - `REVISED`: Red (`#DC2626`)
    - `DRAFT`: Slate (`#64748B`)
- **Indikator Pengguna**:
  - Badge role dinamis (`SUPERADMIN` Ungu/Navy, `VERIFIKATOR` Biru, `POKJA` Emerald).
  - Tanda Pokja yang ditugaskan bagi PIC Pokja.

### 3. Pokja Explorer & Hierarki Standar

- Tampilan agregat 16 Pokja terkelompok:
  - **Tata Kelola**: TKRS, PMKP
  - **Pelayanan**: PP, AKP, PAP, PAB, PKPO, KE, HPK, SKP
  - **Manajemen**: KPS, MFK, MRMIK, PPI, KPS-Tambahan
  - **Program Nasional**: PROGNAS
- Setiap kartu Pokja menampilkan:
  - Jumlah Standar dan total EP.
  - Jumlah dokumen yang telah disetujui (`APPROVED`) vs target total.
  - Bilah persentase kepatuhan akreditasi.

### 4. Workspace Elemen Penilaian (EP) & Manajemen Berkas

- Pemilihan EP membuka tampilan kerja fokus:
  - Kode dan teks lengkap Elemen Penilaian STARKES.
  - Tag kategori bukti yang dipersyaratkan (`REGULASI`, `BUKTI`, `OBSERVASI`, dsb).
  - Tombol **"Tambah Dokumen"** & **"Unggah Berkas PDF"** (aktif jika pengguna memiliki wewenang pada Pokja terkait).
  - Daftar dokumen terlampir lengkap dengan versi terkini, tanggal unggah, uploader, dan badge status alur.

---

## Kriteria Selesai (Acceptance Criteria)

- [x] Autentikasi frontend terhubung ke backend: Login berhasil menyimpan JWT dan user state.
- [x] Dashboard 16 Pokja memuat data riil dari API `/api/pokja` beserta kalkulasi persentase kepatuhan.
- [x] Navigasi hierarki Pokja -> Standar -> EP berjalan mulus dengan pencarian dan filter cepat.
- [x] Modal pembuatan dokumen dan pengunggahan berkas PDF terhubung langsung ke backend API & Cloudinary.
- [x] Pembatasan aksi di UI sesuai peran (PIC Pokja hanya dapat mengunggah di Pokja miliknya; Verifikator memiliki aksi review).
- [x] Desain sistem berstandar _medical-grade_ dengan badge status warna baku sesuai master plan M0.
- [x] Seluruh komponen lolos uji kompilasi TypeScript dan build produksi (`npm run build:client`).
