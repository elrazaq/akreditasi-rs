import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  FileText,
  Video,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { DocumentItem, DocumentVersion, DocumentStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { PDFCanvasViewer } from './PDFCanvasViewer';

interface PDFViewerModalProps {
  document: DocumentItem;
  version: DocumentVersion;
  onClose: () => void;
  onRefresh: () => void;
}

const STATUS_BADGES: Record<
  DocumentStatus,
  { label: string; bg: string; text: string; border: string; icon: any }
> = {
  APPROVED: {
    label: 'Disetujui',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    icon: CheckCircle2,
  },
  SUBMITTED: {
    label: 'Menunggu Verifikasi',
    bg: 'bg-cyan-50',
    text: 'text-cyan-800',
    border: 'border-cyan-200',
    icon: ShieldCheck,
  },
  REVISED: {
    label: 'Perlu Revisi',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
    icon: AlertTriangle,
  },
  DRAFT: {
    label: 'Draf',
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
    icon: FileText,
  },
};

export const PDFViewerModal: React.FC<PDFViewerModalProps> = ({
  document: doc,
  version,
  onClose,
  onRefresh,
}) => {
  const { user } = useAuth();
  const token = localStorage.getItem('token') || '';

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Sync dengan browser Fullscreen API
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch {
      setIsFullscreen((prev) => !prev);
    }
  };

  const [activeVersion, setActiveVersion] = useState<DocumentVersion>(version);

  // Review Note State
  const [catatanReviewInput, setCatatanReviewInput] = useState<string>(doc.catatanReview || '');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isVideo =
    activeVersion.fileType === 'video' ||
    /\.(mp4|webm|mov|avi)$/i.test(activeVersion.fileUrl || '');

  const [streamTicket, setStreamTicket] = useState<string>('');

  useEffect(() => {
    if (isVideo && activeVersion?.id) {
      api.getStreamTicket(activeVersion.id)
        .then((ticket) => setStreamTicket(ticket))
        .catch((err) => console.error('Failed to get stream ticket:', err));
    }
  }, [activeVersion?.id, isVideo]);

  const fileStreamUrl = isVideo && streamTicket
    ? `/api/documents/version/${activeVersion.id}/file?ticket=${encodeURIComponent(streamTicket)}`
    : `/api/documents/version/${activeVersion.id}/file`;
  const downloadUrl = `/api/documents/version/${activeVersion.id}/download`;

  const canReview = user?.role === 'SUPERADMIN' || user?.role === 'VERIFIKATOR';

  const handleUpdateStatus = async (status: DocumentStatus) => {
    try {
      setActionLoading(status);
      await api.updateDocumentStatus(doc.id, status, catatanReviewInput.trim() || undefined);
      onRefresh();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status dokumen.');
    } finally {
      setActionLoading(null);
    }
  };

  const statusMeta = STATUS_BADGES[doc.status] || STATUS_BADGES.DRAFT;
  const StatusIcon = statusMeta.icon;

  return createPortal(
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-[99999] w-screen h-screen m-0 p-0 bg-slate-950 flex flex-col overflow-hidden'
          : 'fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-3 md:p-5 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200'
      }
      style={
        isFullscreen
          ? { margin: 0, padding: 0 }
          : { backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }
      }
      onClick={(e) => {
        if (!isFullscreen && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={
          isFullscreen
            ? 'w-screen h-screen max-w-none max-h-none m-0 p-0 rounded-none border-none shadow-none bg-white flex flex-col overflow-hidden'
            : 'bg-white rounded-none sm:rounded-3xl max-w-7xl w-full h-full sm:h-[94vh] flex flex-col shadow-modal border-0 sm:border border-slate-200/90 overflow-hidden relative transition-all duration-200'
        }
      >
        {/* Top Header */}
        <div className="px-5 py-3 border-b border-slate-200/80 flex items-center justify-between gap-4 bg-slate-50/70 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0 border border-teal-100 shadow-xs">
              {isVideo ? <Video className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {doc.versions && doc.versions.length > 1 ? (
                  <select
                    value={activeVersion.id}
                    onChange={(e) => {
                      const found = doc.versions.find((v) => v.id === e.target.value);
                      if (found) setActiveVersion(found);
                    }}
                    className="font-mono text-xs font-semibold px-2 py-0.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer shadow-xs"
                    title="Pilih versi berkas untuk ditinjau atau diunduh"
                  >
                    {doc.versions.map((v) => (
                      <option key={v.id} value={v.id}>
                        v{v.versionNumber} {v.versionNumber === doc.versions[0]?.versionNumber ? '(Aktif)' : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200">
                    v{activeVersion.versionNumber}
                  </span>
                )}
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700">
                  {doc.kategori}
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
                >
                  <StatusIcon className="w-3 h-3" />
                  <span>{statusMeta.label}</span>
                </span>
              </div>
              <h3 className="text-sm font-semibold text-slate-900 truncate mt-0.5" title={doc.judul}>
                {doc.judul}
              </h3>
            </div>
          </div>

          {/* Top Actions: Fullscreen & Close */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={toggleFullscreen}
              className={`p-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                isFullscreen
                  ? 'bg-teal-50 text-teal-700 border border-teal-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title={isFullscreen ? 'Keluar dari Layar Penuh' : 'Layar Penuh Tanpa Celah'}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Keluar Fullscreen</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Layar Penuh</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: PDF Canvas Viewer + Verification Panel */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          {/* Left: Real PDF.js Canvas Viewer with True Scaling or Video */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-900">
            {isVideo ? (
              <div className="w-full h-full flex items-center justify-center bg-slate-950 p-4">
                <video
                  controls
                  autoPlay
                  src={fileStreamUrl}
                  className="max-w-full max-h-full rounded-2xl shadow-2xl"
                />
              </div>
            ) : (
              <PDFCanvasViewer
                url={fileStreamUrl}
                downloadUrl={downloadUrl}
                documentTitle={doc.judul}
                token={token}
              />
            )}
          </div>

          {/* Right: Focused Verification Review Panel */}
          <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-200/80 bg-white flex flex-col h-full overflow-hidden flex-shrink-0">
            {/* Header info */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Status & Evaluasi Verifikator</span>
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
              >
                <StatusIcon className="w-3 h-3" />
                <span>{statusMeta.label}</span>
              </span>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Existing Reviewer Note Callout if any */}
              {doc.status === 'APPROVED' ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5 shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-emerald-950">Dokumen Telah Disetujui</div>
                    <p className="text-emerald-800 text-[11px] mt-0.5">
                      Berkas telah divalidasi dan memenuhi standar STARKES. Tidak ada revisi aktif.
                    </p>
                  </div>
                </div>
              ) : doc.status === 'REVISED' && doc.catatanReview ? (
                <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-900 text-xs leading-relaxed space-y-2 shadow-xs">
                  <div className="font-semibold flex items-center gap-1.5 text-xs text-rose-700">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Catatan Evaluasi / Arahan Revisi:</span>
                  </div>
                  <p className="whitespace-pre-wrap font-normal text-slate-800">{doc.catatanReview}</p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-center text-xs text-slate-400">
                  Belum ada catatan evaluasi atau revisi tertulis untuk berkas ini.
                </div>
              )}

              {/* Version & Submission info */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1.5 text-xs">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Informasi Berkas
                </div>
                <div className="text-slate-700">
                  <span className="font-medium text-slate-900">Versi Ditinjau:</span> v{activeVersion.versionNumber} ({activeVersion.fileType?.toUpperCase() || 'PDF'})
                </div>
                {activeVersion.catatan && (
                  <div className="text-slate-700 pt-1">
                    <span className="font-medium text-slate-900">Catatan PIC Pokja:</span> {activeVersion.catatan}
                  </div>
                )}
                {activeVersion.uploadedBy && (
                  <div className="text-[11px] text-slate-400 pt-1">
                    Diunggah oleh: {activeVersion.uploadedBy.nama}
                  </div>
                )}
              </div>
            </div>

            {/* Verifikator Action Section */}
            {canReview && (
              <div className="p-4 border-t border-slate-200/80 bg-slate-50/80 space-y-3 flex-shrink-0">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tulis Catatan Evaluasi / Alasan Revisi:
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Wajib diisi jika meminta revisi agar PIC Pokja mengetahui perbaikan yang diperlukan..."
                    value={catatanReviewInput}
                    onChange={(e) => setCatatanReviewInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 placeholder-slate-400 transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={actionLoading !== null}
                    onClick={() => handleUpdateStatus('APPROVED')}
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-diffuse disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{actionLoading === 'APPROVED' ? 'Memproses...' : 'Setujui'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading !== null || !catatanReviewInput.trim()}
                    onClick={() => handleUpdateStatus('REVISED')}
                    title={!catatanReviewInput.trim() ? 'Isi catatan evaluasi terlebih dahulu untuk meminta revisi' : ''}
                    className="py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-diffuse disabled:opacity-50"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{actionLoading === 'REVISED' ? 'Memproses...' : 'Minta Revisi'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
