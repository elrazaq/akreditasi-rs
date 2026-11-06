import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ElemenPenilaian, DocumentItem, DocumentStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { UploadModal } from './UploadModal';
import { CreateDocModal } from './CreateDocModal';
import { PDFViewerModal } from '../documents/PDFViewerModal';
import { DocumentVersion } from '../../types';
import {
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  User,
  ArrowLeft,
  Trash2,
  Video,
  BookOpen,
  Award,
  Layers,
  History,
  ChevronDown,
  Download,
} from 'lucide-react';

interface EPWorkspaceProps {
  ep: ElemenPenilaian;
  onBack: () => void;
  onRefresh: () => void;
}

const STATUS_BADGES: Record<
  DocumentStatus,
  { label: string; bg: string; text: string; border: string; icon: any }
> = {
  APPROVED: {
    label: 'Disetujui',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: CheckCircle2,
  },
  SUBMITTED: {
    label: 'Menunggu Verifikasi',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: Clock,
  },
  REVISED: {
    label: 'Perlu Revisi',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    icon: AlertTriangle,
  },
  DRAFT: {
    label: 'Draf',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    icon: FileText,
  },
};

export const EPWorkspace: React.FC<EPWorkspaceProps> = ({ ep, onBack, onRefresh }) => {
  const { user } = useAuth();
  const [currentEP, setCurrentEP] = useState<ElemenPenilaian>(ep);
  const [activeUploadDoc, setActiveUploadDoc] = useState<DocumentItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirmDoc, setDeleteConfirmDoc] = useState<DocumentItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedVersions, setExpandedVersions] = useState<Record<string, boolean>>({});
  const token = localStorage.getItem('token') || '';

  const toggleVersions = (docId: string) => {
    setExpandedVersions((prev) => ({ ...prev, [docId]: !prev[docId] }));
  };
  const [activeViewerDoc, setActiveViewerDoc] = useState<{
    doc: DocumentItem;
    version: DocumentVersion;
  } | null>(null);

  React.useEffect(() => {
    setCurrentEP(ep);
    reloadEPData();
  }, [ep.id]);

  const reloadEPData = async () => {
    try {
      const res = await api.getEPDetail(ep.id);
      if (res.ep) {
        setCurrentEP(res.ep);
      }
    } catch (e) {
      console.error('Failed to reload EP:', e);
    }
  };

  const canEdit =
    user?.role === 'SUPERADMIN' ||
    (user?.role === 'POKJA' && user.assignedPokjaId === currentEP.standar?.pokja.id);

  const canReview = user?.role === 'VERIFIKATOR' || user?.role === 'SUPERADMIN';

  const handleStatusChange = async (docId: string, status: DocumentStatus) => {
    try {
      setActionLoading(docId);
      await api.updateDocumentStatus(docId, status);
      await reloadEPData();
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status dokumen.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteDocument = async () => {
    if (!deleteConfirmDoc) return;
    try {
      setDeleting(true);
      await api.deleteDocument(deleteConfirmDoc.id);
      setDeleteConfirmDoc(null);
      await reloadEPData();
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus dokumen.');
    } finally {
      setDeleting(false);
    }
  };

  const docs = currentEP.documents || [];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Return Action */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-teal-700 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Instrumen {currentEP.standar?.pokja.kode}</span>
        </button>

        <div className="text-[11px] text-slate-500 font-mono">
          STANDAR: <span className="font-semibold text-slate-800">{currentEP.standar?.kode}</span>
        </div>
      </div>

      {/* Official Instrument Card (Nordic Clinical Vibrant) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-diffuse hover:shadow-diffuse-lg transition-all space-y-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
          <div className="space-y-2.5 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-xl bg-teal-600 text-white shadow-sm shadow-teal-600/25">
                {currentEP.kode}
              </span>
              <span className="text-xs font-semibold text-slate-600">
                {currentEP.standar?.judul}
              </span>
              {currentEP.halamanPdf && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                  Hal. {currentEP.halamanPdf}
                </span>
              )}
              {currentEP.skoring && (
                <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-teal-600" />
                  Skoring: {currentEP.skoring}
                </span>
              )}
            </div>

            <h2 className="text-sm font-semibold text-slate-900 leading-relaxed">
              {currentEP.deskripsi}
            </h2>
          </div>

          {canEdit && (
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-glow-teal hover:shadow-lg transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Dokumen / Bukti</span>
            </button>
          )}
        </div>

        {/* RDOWS & Kelengkapan Bukti Official Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
          {/* RDOWS Checklist Badges */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-teal-600" />
              <span>Metode Penilaian Instrumen (RDOWS)</span>
            </div>
            <div className="flex items-center gap-2 pt-1 flex-wrap font-mono text-[11px]">
              <span
                className={`px-2.5 py-1 rounded-xl border transition-all ${
                  currentEP.kodeR
                    ? 'bg-violet-600 text-white border-violet-700 shadow-xs'
                    : 'bg-white text-slate-300 border-slate-200 line-through opacity-50'
                }`}
                title="R: Regulasi (Kebijakan, Pedoman, Panduan, SPO)"
              >
                R (Regulasi)
              </span>
              <span
                className={`px-2.5 py-1 rounded-xl border transition-all ${
                  currentEP.kodeD
                    ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                    : 'bg-white text-slate-300 border-slate-200 line-through opacity-50'
                }`}
                title="D: Dokumen / Bukti Pelaksanaan"
              >
                D (Dokumen)
              </span>
              <span
                className={`px-2.5 py-1 rounded-xl border transition-all ${
                  currentEP.kodeO
                    ? 'bg-cyan-600 text-white border-cyan-700 shadow-xs'
                    : 'bg-white text-slate-300 border-slate-200 line-through opacity-50'
                }`}
                title="O: Observasi Lapangan / Fisik"
              >
                O (Observasi)
              </span>
              <span
                className={`px-2.5 py-1 rounded-xl border transition-all ${
                  currentEP.kodeW
                    ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                    : 'bg-white text-slate-300 border-slate-200 line-through opacity-50'
                }`}
                title="W: Wawancara Pimpinan / Staf / Pasien"
              >
                W (Wawancara)
              </span>
              <span
                className={`px-2.5 py-1 rounded-xl border transition-all ${
                  currentEP.kodeS
                    ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                    : 'bg-white text-slate-300 border-slate-200 line-through opacity-50'
                }`}
                title="S: Simulasi Peragaan Klinis"
              >
                S (Simulasi)
              </span>
            </div>
          </div>

          {/* Kelengkapan Bukti Guidance */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-1">
            <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Pedoman Kelengkapan Bukti Resmi Kemenkes
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              {currentEP.kelengkapanBukti || 'Bukti dokumen disesuaikan dengan uraian instrumen penilaian STARKES.'}
            </p>
          </div>
        </div>
      </div>

      {/* Documents List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-1">
          <h3 className="text-sm font-semibold text-slate-800 tracking-tight flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-600" />
            <span>Berkas Dokumen Terlampir ({docs.length})</span>
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">
            Format: Dokumen PDF / Video Observasi/Simulasi (MP4/WebM)
          </span>
        </div>

        {docs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center shadow-xs">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2.5" />
            <h4 className="text-sm font-semibold text-slate-800">Belum Ada Dokumen Terunggah</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4 leading-relaxed">
              Elemen Penilaian ini belum memiliki berkas dokumen bukti atau regulasi terlampir.
            </p>
            {canEdit && (
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-xl shadow-glow-teal hover:shadow-lg transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Dokumen Sekarang</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {docs.map((doc) => {
              const statusMeta = STATUS_BADGES[doc.status];
              const StatusIcon = statusMeta.icon;
              const latestVersion = doc.versions[0];
              const isVideo =
                latestVersion?.fileType === 'video' ||
                /\.(mp4|webm|mov|avi)$/i.test(latestVersion?.fileUrl || '');
              const isLoadingThis = actionLoading === doc.id;

              const canDeleteThisDoc =
                user?.role === 'SUPERADMIN' ||
                (canEdit && doc.status !== 'APPROVED');

              return (
                <div
                  key={doc.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-diffuse hover:shadow-diffuse-lg transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Title & Metadata */}
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-xl border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          <span>{statusMeta.label}</span>
                        </span>

                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
                          {doc.kategori}
                        </span>

                        {latestVersion && (
                          <span className="font-mono text-[11px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200">
                            v{latestVersion.versionNumber}
                          </span>
                        )}

                        {latestVersion && (
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-lg border ${
                              isVideo
                                ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            {isVideo ? (
                              <>
                                <Video className="w-3.5 h-3.5 text-cyan-600" />
                                <span>Video Bukti</span>
                              </>
                            ) : (
                              <>
                                <FileText className="w-3.5 h-3.5 text-slate-600" />
                                <span>PDF Dokumen</span>
                              </>
                            )}
                          </span>
                        )}
                      </div>

                      <h4 className="font-semibold text-slate-900 text-sm leading-snug">
                        {doc.judul}
                      </h4>

                      <div className="flex items-center gap-3 text-xs text-slate-500 pt-0.5 flex-wrap">
                        {doc.createdBy && (
                          <span className="flex items-center gap-1.5 font-medium text-slate-600">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {doc.createdBy.nama}
                          </span>
                        )}
                        <span className="text-slate-300">/</span>
                        <span>Diperbarui {new Date(doc.updatedAt).toLocaleDateString('id-ID')}</span>
                        {latestVersion?.fileSize && (
                          <>
                            <span className="text-slate-300">/</span>
                            <span className="font-mono">
                              {(latestVersion.fileSize / (1024 * 1024)).toFixed(2)} MB
                            </span>
                          </>
                        )}
                      </div>

                      {latestVersion?.catatan && (
                        <div className="mt-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-slate-700">
                          <span className="font-semibold text-slate-900">Catatan Versi: </span>
                          {latestVersion.catatan}
                        </div>
                      )}

                      {doc.status === 'REVISED' && doc.catatanReview && (
                        <div className="mt-2 p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-900 shadow-xs text-xs leading-relaxed space-y-1">
                          <div className="font-semibold flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-rose-700">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Catatan Revisi dari Verifikator:</span>
                          </div>
                          <p className="whitespace-pre-wrap font-normal text-slate-800">
                            {doc.catatanReview}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions Panel */}
                    <div className="flex flex-wrap items-center gap-2.5 border-t lg:border-t-0 pt-3 lg:pt-0">
                      {/* View File & Annotation Button */}
                      {latestVersion && (
                        <button
                          type="button"
                          onClick={() => setActiveViewerDoc({ doc, version: latestVersion })}
                          className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          {isVideo ? (
                            <Video className="w-3.5 h-3.5 text-teal-600" />
                          ) : (
                            <FileText className="w-3.5 h-3.5 text-teal-600" />
                          )}
                          <span>{isVideo ? 'Buka Video' : 'Pratinjau Dokumen'}</span>
                        </button>
                      )}

                      {/* Upload Version (PDF/Video) */}
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => setActiveUploadDoc(doc)}
                          className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Upload className="w-3.5 h-3.5 text-teal-600" />
                          <span>Unggah Versi</span>
                        </button>
                      )}

                      {/* Submit to Verifikator */}
                      {canEdit && (doc.status === 'DRAFT' || doc.status === 'REVISED') && latestVersion && (
                        <button
                          type="button"
                          disabled={isLoadingThis}
                          onClick={() => handleStatusChange(doc.id, 'SUBMITTED')}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl transition shadow-glow-amber hover:shadow-lg cursor-pointer disabled:opacity-50"
                        >
                          {doc.status === 'REVISED' ? 'Ajukan Verifikasi Ulang' : 'Ajukan Verifikasi'}
                        </button>
                      )}

                      {/* Verifikator/Superadmin Decisions */}
                      {canReview && doc.status === 'SUBMITTED' && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={isLoadingThis}
                            onClick={() => handleStatusChange(doc.id, 'APPROVED')}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Setujui</span>
                          </button>
                          <button
                            type="button"
                            disabled={isLoadingThis}
                            onClick={() => handleStatusChange(doc.id, 'REVISED')}
                            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Revisi</span>
                          </button>
                        </div>
                      )}

                      {/* Delete Document Button */}
                      {canDeleteThisDoc && (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmDoc(doc)}
                          title="Hapus Dokumen dan Seluruh Versi"
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Version History Accordion */}
                  {doc.versions.length > 1 && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => toggleVersions(doc.id)}
                        className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1.5 cursor-pointer py-1"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>Riwayat Versi Berkas ({doc.versions.length} Versi Tersimpan)</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform ${
                            expandedVersions[doc.id] ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {expandedVersions[doc.id] && (
                        <div className="mt-2.5 space-y-2 pl-3 border-l-2 border-teal-200">
                          {doc.versions.map((v) => {
                            const isLatest = v.versionNumber === doc.versions[0].versionNumber;

                            return (
                              <div
                                key={v.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs"
                              >
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    className={`font-mono font-semibold px-2 py-0.5 rounded-md text-[11px] ${
                                      isLatest
                                        ? 'bg-teal-600 text-white'
                                        : 'bg-slate-200 text-slate-800'
                                    }`}
                                  >
                                    v{v.versionNumber} {isLatest ? '(Aktif)' : ''}
                                  </span>
                                  <span className="text-slate-500 font-mono text-[11px]">
                                    {new Date(v.createdAt).toLocaleDateString('id-ID')}
                                  </span>
                                  {v.fileSize && (
                                    <span className="text-slate-400 font-mono text-[11px]">
                                      ({(v.fileSize / (1024 * 1024)).toFixed(2)} MB)
                                    </span>
                                  )}
                                  {v.catatan && (
                                    <span className="text-slate-700 italic text-[11px]">
                                      "{v.catatan}"
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => setActiveViewerDoc({ doc, version: v })}
                                    className="px-3 py-1.5 font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg transition text-[11px] cursor-pointer"
                                  >
                                    Buka
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      try {
                                        const res = await fetch(`/api/documents/version/${v.id}/download`, {
                                          headers: token ? { Authorization: `Bearer ${token}` } : {},
                                        });
                                        if (!res.ok) throw new Error('Gagal mengunduh');
                                        const blob = await res.blob();
                                        const blobUrl = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = blobUrl;
                                        a.download = `${doc.judul}_v${v.versionNumber}`;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        URL.revokeObjectURL(blobUrl);
                                      } catch (err) {
                                        alert('Gagal mengunduh berkas.');
                                      }
                                    }}
                                    className="px-3 py-1.5 font-semibold bg-teal-50 border border-teal-200 hover:bg-teal-100 text-teal-800 rounded-lg transition text-[11px] flex items-center gap-1 cursor-pointer"
                                    title={`Unduh Versi ${v.versionNumber}`}
                                  >
                                    <Download className="w-3 h-3" />
                                    <span>Unduh File</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal (Full Viewport Overlay with Soft Blur) */}
      {deleteConfirmDoc &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
            style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setDeleteConfirmDoc(null);
            }}
          >
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-modal border border-slate-200/90 overflow-hidden relative">
              <div className="flex items-center justify-between pb-3 border-b border-rose-100">
                <h3 className="text-sm font-semibold text-rose-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Konfirmasi Hapus Dokumen</span>
                </h3>
              </div>
              <div className="mt-4 space-y-3">
                <p className="text-xs text-slate-700 leading-relaxed">
                  Apakah Anda yakin ingin menghapus berkas dokumen <strong className="text-slate-900">"{deleteConfirmDoc.judul}"</strong>?
                </p>
                <p className="text-[11px] text-slate-500">
                  Semua versi dokumen dan video terkait di Cloudinary akan dihapus permanen.
                </p>
                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmDoc(null)}
                    disabled={deleting}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteDocument}
                    disabled={deleting}
                    className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-md shadow-rose-600/20 transition cursor-pointer disabled:opacity-50"
                  >
                    {deleting ? 'Menghapus...' : 'Ya, Hapus Dokumen'}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Upload PDF/Video Modal */}
      {activeUploadDoc && (
        <UploadModal
          documentId={activeUploadDoc.id}
          documentTitle={activeUploadDoc.judul}
          onClose={() => setActiveUploadDoc(null)}
          onSuccess={async () => {
            setActiveUploadDoc(null);
            await reloadEPData();
            onRefresh();
          }}
        />
      )}

      {/* Create Document Modal */}
      {isCreateOpen && (
        <CreateDocModal
          epId={currentEP.id}
          epKode={currentEP.kode}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={async () => {
            setIsCreateOpen(false);
            await reloadEPData();
            onRefresh();
          }}
        />
      )}

      {/* PDF Viewer & Annotation Editor Modal */}
      {activeViewerDoc && (
        <PDFViewerModal
          document={activeViewerDoc.doc}
          version={activeViewerDoc.version}
          onClose={() => setActiveViewerDoc(null)}
          onRefresh={async () => {
            await reloadEPData();
            onRefresh();
          }}
        />
      )}
    </div>
  );
};
