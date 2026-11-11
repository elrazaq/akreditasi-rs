import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Plus,
  AlertCircle,
  FileText,
  Upload,
  Video,
  Loader2,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { DocumentCategory } from '../../types';
import { api } from '../../api/client';

interface CreateDocModalProps {
  epId: string;
  epKode: string;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORY_OPTIONS: {
  value: DocumentCategory;
  label: string;
  desc: string;
  badge: string;
  color: string;
}[] = [
  {
    value: 'REGULASI',
    label: 'Regulasi (R)',
    desc: 'SK Direktur, Kebijakan Rumah Sakit, Pedoman, Panduan, SPO',
    badge: 'R',
    color: 'border-violet-300 text-violet-700 bg-violet-50',
  },
  {
    value: 'BUKTI',
    label: 'Dokumen / Bukti Pelaksanaan (D)',
    desc: 'Laporan kerja, notula rapat komite, sertifikat pelatihan staf, rekam medis',
    badge: 'D',
    color: 'border-teal-300 text-teal-700 bg-teal-50',
  },
  {
    value: 'OBSERVASI',
    label: 'Observasi / Bukti Fisik Fasilitas (O)',
    desc: 'Dokumentasi sarana prasarana, kelayakan ruangan, jalur evakuasi',
    badge: 'O',
    color: 'border-cyan-300 text-cyan-700 bg-cyan-50',
  },
  {
    value: 'WAWANCARA',
    label: 'Materi Wawancara (W)',
    desc: 'Daftar pertanyaan dan lembar verifikasi wawancara PPA atau pasien',
    badge: 'W',
    color: 'border-amber-300 text-amber-700 bg-amber-50',
  },
  {
    value: 'SIMULASI',
    label: 'Simulasi Peragaan Klinis (S)',
    desc: 'Rekaman video atau bukti peragaan BHD, Code Blue, simulasi kebakaran',
    badge: 'S',
    color: 'border-rose-300 text-rose-700 bg-rose-50',
  },
];

export const CreateDocModal: React.FC<CreateDocModalProps> = ({
  epId,
  epKode,
  onClose,
  onSuccess,
}) => {
  const [judul, setJudul] = useState('');
  const [kategori, setKategori] = useState<DocumentCategory>('REGULASI');
  const [file, setFile] = useState<File | null>(null);
  const [catatan, setCatatan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const name = selected.name.toLowerCase();
    const isPdf = selected.type === 'application/pdf' || name.endsWith('.pdf');
    const isVideo =
      selected.type.startsWith('video/') ||
      name.endsWith('.mp4') ||
      name.endsWith('.webm') ||
      name.endsWith('.mov') ||
      name.endsWith('.avi');

    if (!isPdf && !isVideo) {
      setError('Hanya format dokumen PDF atau video (MP4/WebM) yang didukung.');
      setFile(null);
      return;
    }

    if (selected.size > 100 * 1024 * 1024) {
      setError('Ukuran berkas melebihi batas maksimal 100 MB.');
      setFile(null);
      return;
    }

    setError(null);
    setFile(selected);

    // Auto-populate judul jika masih kosong
    if (!judul.trim()) {
      const cleanTitle = selected.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]+/g, ' ')
        .trim();
      setJudul(cleanTitle);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim()) {
      setError('Judul dokumen resmi wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setUploadPercent(0);

      await api.createDocument(
        epId,
        judul.trim(),
        kategori,
        file,
        catatan,
        (percent) => {
          setUploadPercent(percent);
        }
      );

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Gagal membuat dokumen.');
      setIsSubmitting(false);
    }
  };

  const isSelectedVideo = file && /\.(mp4|webm|mov|avi)$/i.test(file.name);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
      style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
      onClick={(e) => {
        if (!isSubmitting && e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-modal border border-slate-200/90 overflow-hidden relative max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-600" />
              <span>Tambah Dokumen & Unggah Berkas Langsung</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Elemen Penilaian <span className="font-mono font-medium text-teal-700">{epKode}</span> (1 Langkah Selesai)
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2.5 flex-shrink-0">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Progress Alert saat Upload berlangsung */}
        {isSubmitting && file && (
          <div className="mt-4 p-4 bg-amber-50/90 border border-amber-200/90 rounded-2xl space-y-2.5 animate-in fade-in flex-shrink-0">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-amber-900 flex items-center gap-1.5">
                <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
                <span>Mengunggah Berkas ke Cloudinary:</span>
              </span>
              <span className="font-mono font-bold text-amber-800 text-sm">{uploadPercent}%</span>
            </div>

            {/* Progress Bar Track */}
            <div className="w-full bg-amber-200/60 rounded-full h-3 overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-teal-600 to-hospital-600 h-full rounded-full transition-all duration-200 relative overflow-hidden"
                style={{ width: `${Math.max(5, uploadPercent)}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-amber-800 pt-1">
              <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Harap <strong>JANGAN merefresh atau menutup halaman</strong> selama proses upload agar berkas tidak korup.</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto pr-1 flex-1">
          {/* File Picker Langsung di Form */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1.5">
              Pilih Berkas PDF / Video (Opsional, Langsung Terunggah)
            </label>
            <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-2xl p-5 text-center transition-all bg-slate-50/60 hover:bg-teal-50/20 group">
              <input
                type="file"
                accept=".pdf,application/pdf,video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                onChange={handleFileChange}
                id="create-doc-file"
                disabled={isSubmitting}
                className="hidden"
              />
              <label htmlFor="create-doc-file" className="cursor-pointer block">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>

                {file ? (
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-slate-900 flex items-center justify-center gap-1.5">
                      {isSelectedVideo ? (
                        <Video className="w-4 h-4 text-cyan-600" />
                      ) : (
                        <FileText className="w-4 h-4 text-teal-600" />
                      )}
                      <span className="truncate max-w-sm">{file.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center justify-center gap-2">
                      <span className="font-semibold text-teal-700 uppercase">
                        {isSelectedVideo ? 'Berkas Video' : 'Dokumen PDF'}
                      </span>
                      <span>[{(file.size / (1024 * 1024)).toFixed(2)} MB]</span>
                      <span className="text-teal-600 underline font-medium">Ganti berkas</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-xs font-semibold text-slate-800">
                      Klik untuk memilih berkas dokumen PDF atau video
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      PDF, MP4, WebM (Maksimal 100 MB). Jika tidak diisi sekarang, draf kosong akan dibuat.
                    </div>
                  </>
                )}
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1.5">
              Judul Dokumen Resmi <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Contoh: SK Direktur tentang Pembentukan Komite Etik RSUD Bintan"
              required
              disabled={isSubmitting}
              className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wide mb-2">
              Kategori Bukti Akreditasi <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 gap-2">
              {CATEGORY_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                    kategori === opt.value
                      ? 'border-teal-500 bg-teal-50/40 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  } ${isSubmitting ? 'pointer-events-none opacity-60' : ''}`}
                >
                  <input
                    type="radio"
                    name="kategori"
                    value={opt.value}
                    checked={kategori === opt.value}
                    onChange={() => setKategori(opt.value)}
                    disabled={isSubmitting}
                    className="mt-0.5 text-teal-600 focus:ring-teal-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-800">{opt.label}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${opt.color}`}>
                        {opt.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {file && (
            <div>
              <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1.5">
                Catatan Berkas Awal (Opsional)
              </label>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Contoh: Berkas regulasi versi final bertandatangan Direktur..."
                rows={2}
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition disabled:opacity-60"
              />
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-glow-teal transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {file ? `Mengunggah (${uploadPercent}%)...` : 'Menyimpan Dokumen...'}
                  </span>
                </>
              ) : (
                <>
                  {file ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{file ? 'Simpan & Unggah Langsung' : 'Simpan Draf Dokumen'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
