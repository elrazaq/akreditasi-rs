import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Upload, X, FileText, Video, AlertCircle } from 'lucide-react';
import { api } from '../../api/client';

interface UploadModalProps {
  documentId: string;
  documentTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  documentId,
  documentTitle,
  onClose,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [catatan, setCatatan] = useState('');
  const [isUploading, setIsUploading] = useState(false);
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
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Pilih berkas dokumen atau rekaman video terlebih dahulu.');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      await api.uploadVersion(documentId, file, catatan);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Gagal mengunggah berkas.');
    } finally {
      setIsUploading(false);
    }
  };

  const isSelectedVideo = file && /\.(mp4|webm|mov|avi)$/i.test(file.name);

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
              <Upload className="w-4 h-4 text-teal-600" />
              <span>Unggah Berkas Bukti Akreditasi</span>
            </h3>
            <p className="text-xs text-slate-500 truncate max-w-sm mt-0.5" title={documentTitle}>
              {documentTitle}
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

        <form onSubmit={handleUpload} className="mt-4 space-y-4">
          {/* File Picker Zone */}
          <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-2xl p-6 text-center transition-all bg-slate-50/60 hover:bg-teal-50/20 group">
            <input
              type="file"
              accept=".pdf,application/pdf,video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
              onChange={handleFileChange}
              id="file-upload"
              className="hidden"
            />
            <label htmlFor="file-upload" className="cursor-pointer block">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-2.5 group-hover:scale-105 transition-transform">
                <Upload className="w-6 h-6" />
              </div>

              {file ? (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-slate-900 flex items-center justify-center gap-1.5">
                    {isSelectedVideo ? (
                      <Video className="w-4 h-4 text-cyan-600" />
                    ) : (
                      <FileText className="w-4 h-4 text-teal-600" />
                    )}
                    <span className="truncate max-w-xs">{file.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    <span className="font-semibold text-teal-700 uppercase mr-1">
                      {isSelectedVideo ? 'Berkas Video' : 'Dokumen PDF'}
                    </span>
                    [{(file.size / (1024 * 1024)).toFixed(2)} MB] (Klik untuk mengganti)
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-xs font-semibold text-slate-800">
                    Pilih Berkas PDF Dokumen atau Video Bukti
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Dokumen PDF / Rekaman Video MP4 / WebM (Maksimal 100 MB)
                  </div>
                </>
              )}
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1.5">
              Catatan Revisi / Keterangan Berkas (Opsional)
            </label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: Berkas regulasi pembaruan 2024 telah ditandatangani Direktur..."
              rows={3}
              className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isUploading || !file}
              className="px-5 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-glow-teal transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>{isUploading ? 'Mengunggah ke Cloud...' : 'Unggah Berkas'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
