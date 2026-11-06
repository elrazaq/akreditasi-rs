import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DocumentItem, DocumentStatus, PokjaSummary, DocumentVersion } from '../../types';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { PDFViewerModal } from './PDFViewerModal';
import {
  FolderArchive,
  Search,
  ExternalLink,
  FileText,
  Video,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  Filter,
  Trash2,
} from 'lucide-react';

interface DocumentRepositoryProps {
  pokjas: PokjaSummary[];
  onSelectDocumentEP: (pokjaId: string, epId: string) => void;
}

const STATUS_BADGES: Record<
  DocumentStatus,
  { label: string; bg: string; text: string; border: string; icon: any }
> = {
  APPROVED: {
    label: 'Disetujui',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200 font-semibold',
    icon: CheckCircle2,
  },
  SUBMITTED: {
    label: 'Menunggu Verifikasi',
    bg: 'bg-cyan-50',
    text: 'text-cyan-800',
    border: 'border-cyan-200 font-medium',
    icon: Clock,
  },
  REVISED: {
    label: 'Perlu Revisi',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200 font-medium',
    icon: AlertTriangle,
  },
  DRAFT: {
    label: 'Draf',
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200 font-medium',
    icon: FileText,
  },
};

export const DocumentRepository: React.FC<DocumentRepositoryProps> = ({
  pokjas,
  onSelectDocumentEP,
}) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [pokjaFilter, setPokjaFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [deleteConfirmDoc, setDeleteConfirmDoc] = useState<DocumentItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeViewerDoc, setActiveViewerDoc] = useState<{
    doc: DocumentItem;
    version: DocumentVersion;
  } | null>(null);

  const loadDocs = () => {
    setLoading(true);
    api
      .getDocuments({
        status: statusFilter === 'ALL' ? undefined : (statusFilter as DocumentStatus),
        pokjaId: pokjaFilter === 'ALL' ? undefined : pokjaFilter,
        search: search.trim() || undefined,
      })
      .then((res) => setDocuments(res.documents))
      .catch((err) => console.error('Fetch docs error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDocs();
  }, [statusFilter, pokjaFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDocs();
  };

  const handleDelete = async () => {
    if (!deleteConfirmDoc) return;
    try {
      setDeleting(true);
      await api.deleteDocument(deleteConfirmDoc.id);
      setDeleteConfirmDoc(null);
      loadDocs();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus berkas dokumen.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-diffuse flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 uppercase tracking-wider mb-1.5">
            <FolderArchive className="w-4 h-4 text-teal-600" />
            <span>Pusat Arsip Dokumen & Bukti</span>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Repositori Berkas Akreditasi RS</h2>
          <p className="text-xs text-slate-500 mt-1 font-normal">
            Daftar seluruh berkas regulasi (PDF) dan rekaman bukti (Video/PDF) yang tersimpan di cloud storage terverifikasi
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex-shrink-0 shadow-diffuse">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-mono uppercase tracking-wider">Total Berkas Terdaftar</div>
            <div className="text-xl font-semibold text-slate-900 font-mono mt-0.5">{documents.length} Dokumen</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-diffuse flex flex-col lg:flex-row items-center justify-between gap-3.5">
        <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul dokumen..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="APPROVED">Disetujui</option>
              <option value="SUBMITTED">Menunggu Verifikasi</option>
              <option value="REVISED">Perlu Revisi</option>
              <option value="DRAFT">Draf</option>
            </select>
          </div>

          {/* Pokja Filter */}
          <select
            value={pokjaFilter}
            onChange={(e) => setPokjaFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition cursor-pointer"
          >
            <option value="ALL">Semua Pokja (16 Pokja)</option>
            {pokjas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.kode} - {p.nama}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-diffuse">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-6 h-6 text-teal-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Memuat berkas repositori...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-semibold text-slate-700">Tidak ada dokumen ditemukan</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Sesuaikan filter atau unggah dokumen baru melalui instrumen Pokja.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/70 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Judul Berkas & Pengunggah</th>
                  <th className="py-3 px-4">Elemen Penilaian</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Versi & Format</th>
                  <th className="py-3 px-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map((doc) => {
                  const statusMeta = STATUS_BADGES[doc.status];
                  const StatusIcon = statusMeta.icon;
                  const latestVersion = doc.versions[0];
                  const pokjaInfo = doc.elemenPenilaian?.standar?.pokja;
                  const isVideo =
                    latestVersion?.fileType === 'video' ||
                    /\.(mp4|webm|mov|avi)$/i.test(latestVersion?.fileUrl || '');

                  const canDelete =
                    user?.role === 'SUPERADMIN' ||
                    (user?.assignedPokjaId === pokjaInfo?.id && doc.status !== 'APPROVED');

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{doc.judul}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 font-normal">
                          {doc.createdBy && <span>Oleh {doc.createdBy.nama}</span>}
                          <span className="text-slate-300">/</span>
                          <span className="font-mono">{new Date(doc.updatedAt).toLocaleDateString('id-ID')}</span>
                        </div>
                        {doc.status === 'REVISED' && doc.catatanReview && (
                          <div
                            className="mt-1 text-[11px] px-2 py-0.5 rounded-md inline-flex items-center gap-1 border bg-rose-50 text-rose-700 border-rose-200"
                          >
                            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate max-w-xs" title={doc.catatanReview}>
                              Catatan: {doc.catatanReview}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {pokjaInfo ? (
                          <button
                            type="button"
                            onClick={() => onSelectDocumentEP(pokjaInfo.id, doc.epId)}
                            className="text-left group cursor-pointer"
                          >
                            <span className="font-mono font-semibold text-teal-700 group-hover:underline">
                              {pokjaInfo.kode}
                            </span>
                            <span className="text-slate-400 mx-1">/</span>
                            <span className="font-mono text-slate-600 text-[11px]">
                              {doc.elemenPenilaian?.kode}
                            </span>
                          </button>
                        ) : (
                          <span className="font-mono text-slate-500">{doc.epId}</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-medium text-[10px] border border-slate-200 font-mono">
                          {doc.kategori}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-0.5 rounded-lg border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          <span>{statusMeta.label}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {latestVersion ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">
                              v{latestVersion.versionNumber}
                            </span>
                            {isVideo ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-lg font-mono font-medium">
                                <Video className="w-3 h-3" /> Video
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-lg font-mono font-medium">
                                <FileText className="w-3 h-3" /> PDF
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Belum ada berkas</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {latestVersion ? (
                            <button
                              type="button"
                              onClick={() => setActiveViewerDoc({ doc, version: latestVersion })}
                              className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-semibold rounded-xl transition inline-flex items-center gap-1 text-[11px] cursor-pointer"
                            >
                              <ExternalLink className="w-3 h-3 text-teal-600" />
                              <span>{isVideo ? 'Video' : 'Buka PDF'}</span>
                            </button>
                          ) : null}

                          {pokjaInfo && (
                            <button
                              type="button"
                              onClick={() => onSelectDocumentEP(pokjaInfo.id, doc.epId)}
                              className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-600 hover:text-white text-teal-700 font-semibold rounded-xl transition text-[11px] cursor-pointer"
                            >
                              Kelola
                            </button>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmDoc(doc)}
                              title="Hapus Dokumen"
                              className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal - True Fullscreen Viewport Overlay */}
      {deleteConfirmDoc &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
            style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setDeleteConfirmDoc(null);
            }}
          >
            <div className="bg-white rounded-2xl shadow-modal border border-slate-200/90 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150 relative">
              <div className="px-6 py-4 bg-rose-50 border-b border-rose-100 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3 className="text-sm font-semibold text-rose-900">Konfirmasi Hapus Dokumen</h3>
              </div>
              <div className="p-6 space-y-3.5">
                <p className="text-xs text-slate-800 leading-relaxed font-normal">
                  Apakah Anda yakin ingin menghapus berkas dokumen <strong className="text-slate-900 font-semibold">"{deleteConfirmDoc.judul}"</strong>?
                </p>
                <p className="text-[11px] text-slate-500 font-normal">
                  Dokumen dan semua versinya di Cloudinary akan dihapus permanen dari sistem.
                </p>
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmDoc(null)}
                    disabled={deleting}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-diffuse transition cursor-pointer disabled:opacity-50"
                  >
                    {deleting ? 'Menghapus...' : 'Ya, Hapus'}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* In-App PDF Viewer & Annotation Editor Modal */}
      {activeViewerDoc && (
        <PDFViewerModal
          document={activeViewerDoc.doc}
          version={activeViewerDoc.version}
          onClose={() => setActiveViewerDoc(null)}
          onRefresh={loadDocs}
        />
      )}
    </div>
  );
};
