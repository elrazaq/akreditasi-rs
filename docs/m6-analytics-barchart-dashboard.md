# M6: Grafik Batang Capaian Akreditasi (Dashboard Analytics)

## Tujuan
Menghadirkan modul analitik visual interaktif berupa grafik batang (*Bar Chart*) berbasis `Chart.js` & `react-chartjs-2` pada Dashboard Utama (E-Sehati), menampilkan capaian 16 Pokja secara keseluruhan maupun rincian drill-down per Standar dalam setiap Pokja terpilih, dengan format *Stacked Bar* transparan status dokumen (Disetujui, Menunggu Verifikasi, Perlu Revisi, Belum Terisi) serta garis rujukan target Paripurna 80%.

---

## Rincian Desain & Fitur

### 1. Komponen Analitik (`PokjaAnalyticsChart.tsx`)
- Ditempatkan tepat di bawah Hero Banner RSUD Bintan pada `ExecutiveDashboard.tsx`.
- Mode Tampilan Interaktif:
  1. **Keseluruhan (16 Pokja)**: Perbandingan stacked bar seluruh 16 Pokja STARKES 2024.
  2. **Per Kelompok Standar**: Perbandingan 4 Kelompok (Tata Kelola, Pelayanan, Manajemen, Prognas).
  3. **Rincian Per Standar**: Pemilihan Pokja tertentu via dropdown untuk melihat distribusi kelengkapan per Standar (misal TKRS 1 s/d TKRS 13).
- Toggle Mode Metrik:
  - **Stacked Status Dokumen**: Menampilkan proporsi riil dokumen disetujui (hijau), menunggu verifikasi (amber), revisi (merah), dan sisa EP belum terisi (slate).
  - **Persentase Capaian (%)**: Menampilkan tingkat kepatuhan murni per Pokja terhadap standar 80% Paripurna.
- Interaktivitas:
  - Klik batang Pokja untuk drill-down atau langsung membuka Pokja terkait.
  - Tooltip detail dengan informasi jumlah dokumen, rasio, dan status Paripurna.
  - Kartu insight: Pokja capaian tertinggi, Pokja butuh akselerasi (< 80%), dan rata-rata skor kesiapan.

### 2. Standar Desain Hallmark
- Palet resmi E-Sehati: Emerald (`#10B981`), Amber (`#F59E0B`), Rose (`#EF4444`), Teal (`#0D9488`), Navy & Slate (`#0F172A`, `#E2E8F0`).
- Tipografi tajam: Plus Jakarta Sans & JetBrains Mono untuk angka dan kode Pokja.
- Kontras tinggi, responsif, zero data tiruan (semua metrik bersumber langsung dari database riil).

---

## Kriteria Selesai (Acceptance Criteria)
- [x] Instalasi `chart.js` dan `react-chartjs-2` terpasang tanpa error dan kompatibel dengan React 19.
- [x] Komponen `PokjaAnalyticsChart.tsx` terintegrasi di `ExecutiveDashboard.tsx`.
- [x] Grafik batang mendukung mode 16 Pokja, 4 Kelompok Standar, dan mode drill-down per Standar.
- [x] Format Stacked Bar transparan (Approved, Submitted, Revised, Belum Terisi) dan garis ambang batas 80% Paripurna tampil presisi.
- [x] Build monorepo (`npm run build`) sukses tanpa warning/error kompilasi.
- [x] Perubahan di-commit dan di-push ke branch `main` GitHub.

### Status: SELESAI (COMPLETED)
- Chart.js & react-chartjs-2 terintegrasi secara mulus.
- Desain mengikuti prinsip Hallmark: data riil otentik, palet warna klinis konsisten, kontras tinggi.
