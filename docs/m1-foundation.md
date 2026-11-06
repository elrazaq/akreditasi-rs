# M1: Fondasi Proyek & Konfigurasi Monorepo

## Tujuan
Membangun fondasi monorepo untuk frontend (React + Vite + Tailwind CSS) dan backend (Express.js pada Vercel Serverless Function), terhubung dengan konfigurasi build dan scripts terpadu.

---

## Rincian Pekerjaan

### 1. Struktur Direktori Monorepo
```
d:\akreditasi\
├── api/                  # Express.js backend (Vercel Serverless Function)
│   ├── src/
│   │   ├── index.ts      # Entrypoint Express app
│   │   ├── routes/       # Rute API dasar (/health, /api/...)
│   │   └── middleware/   # CORS, error handler dasar
│   ├── tsconfig.json
│   └── package.json
├── client/               # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css     # Tailwind CSS + palette tokens
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
├── docs/                 # Dokumentasi milestone
│   ├── m0-master-plan.md
│   └── m1-foundation.md
├── package.json          # Root workspace package.json
├── vercel.json           # Konfigurasi routing & serverless build Vercel
├── .gitignore
└── README.md
```

### 2. Standar Desain Token & Palet
- Konfigurasi Tailwind CSS di `client/` dengan token warna yang disepakati:
  - `navy-primary`: `#1E3A8A`
  - `hospital-blue`: `#0284C7`
  - `slate-dark`: `#0F172A`
  - `slate-surface`: `#F8FAFC`
  - `border-subtle`: `#E2E8F0`

### 3. Kriteria Selesai (Acceptance Criteria)
- [x] Root package.json dan workspace npm terkonfigurasi rapi.
- [x] `client/` dapat di-build (`npm run build`) tanpa error (Vite + React + Tailwind).
- [x] `api/` dapat dikompilasi TypeScript dan memiliki endpoint `/api/health` yang berfungsi.
- [x] `vercel.json` siap untuk routing Vercel: frontend static build & backend `/api` handler.
- [x] Verifikasi lokal berhasil dijalankan.

### Status: SELESAI (COMPLETED)
- Build TypeScript & Vite berhasil (100% clean).
- Health test endpoint berjalan: `{"status":"ok","service":"akreditasi-rs-api","standards":"STARKES 2024"}`.
