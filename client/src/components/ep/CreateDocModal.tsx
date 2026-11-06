import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, AlertCircle, FileText, Loader2 } from 'lucide-react';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim()) {
      setError('Judul dokumen resmi wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await api.createDocument(epId, judul.trim(), kategori);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Gagal membuat dokumen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
      style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-modal border border-slate-200/90 overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-600" />
              <span>Tambah Dokumen Bukti Baru</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Elemen Penilaian <span className="font-mono font-medium text-teal-700">{epKode}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1.5">
              Judul Dokumen Resmi
            </label>
            <input
              type="text"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Contoh: SK Direktur tentang Pembentukan Komite Etik RSUD Bintan"
              required
              className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wide mb-2">
              Kategori Bukti Akreditasi
            </label>
            <div className="space-y-2">
              {CATEGORY_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    kategori === opt.value
                      ? 'border-teal-500 bg-teal-50/40 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="kategori"
                    value={opt.value}
                    checked={kategori === opt.value}
                    onChange={() => setKategori(opt.value)}
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

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-glow-teal transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Dokumen'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
