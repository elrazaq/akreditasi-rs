import React, { useState, useEffect } from 'react';
import { DocumentItem, DocumentVersion } from '../../types';
import { api } from '../../api/client';
import { PDFViewerModal } from '../documents/PDFViewerModal';
import {
  CheckSquare,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Clock,
  Loader2,
} from 'lucide-react';

interface VerificationQueueProps {
  onDocumentReviewed: () => void;
}

export const VerificationQueue: React.FC<VerificationQueueProps> = ({ onDocumentReviewed }) => {
  const [queue, setQueue] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [activeViewerDoc, setActiveViewerDoc] = useState<{
    doc: DocumentItem;
    version: DocumentVersion;
  } | null>(null);

  const loadQueue = () => {
    setLoading(true);
    api
      .getDocuments({ status: 'SUBMITTED' })
      .then((res) => setQueue(res.documents))
      .catch((err) => console.error('Fetch queue error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleDecision = async (docId: string, status: 'APPROVED' | 'REVISED') => {
    try {
      setActionLoading(docId);
      const note = reviewNotes[docId] || undefined;
      await api.updateDocumentStatus(docId, status, note);
      onDocumentReviewed();
      loadQueue();
    } catch (err: any) {
      alert(err.message || 'Gagal memproses verifikasi.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-diffuse flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1.5">
            <CheckSquare className="w-4 h-4 text-amber-600" />
            <span>Panel Verifikator Medis & Surveyor</span>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Antrean Verifikasi Berkas STARKES</h2>
          <p className="text-xs text-slate-500 mt-1 font-normal">
            Daftar berkas yang diajukan oleh PIC Pokja dan menunggu validasi kelengkapan
          </p>
        </div>

        <div className="flex items-center gap-3 bg-amber-50/80 p-4 rounded-2xl border border-amber-200 shadow-diffuse flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] text-amber-800 font-mono uppercase tracking-wider">Menunggu Keputusan</div>
            <div className="text-xl font-semibold font-mono text-amber-950 mt-0.5">{queue.length} Berkas</div>
          </div>
        </div>
      </div>

      {/* Queue List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-diffuse">
            <Loader2 className="w-7 h-7 text-teal-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Memeriksa antrean verifikasi...</p>
          </div>
        ) : queue.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-diffuse">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2.5" />
            <h3 className="text-sm font-semibold text-slate-900">Antrean Bersih!</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 font-normal">
              Tidak ada dokumen akreditasi yang sedang menunggu verifikasi saat ini.
            </p>
          </div>
        ) : (
          queue.map((doc) => {
            const latestVersion = doc.versions[0];
            const isProcessing = actionLoading === doc.id;
            const pokjaInfo = doc.elemenPenilaian?.standar?.pokja;
            const isVideo =
              latestVersion?.fileType === 'video' ||
              /\.(mp4|webm|mov|avi)$/i.test(latestVersion?.fileUrl || '');

            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-diffuse hover:shadow-diffuse-lg transition-all duration-200"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                  {/* Document Detail */}
                  <div className="space-y-2.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-cyan-50 text-cyan-800 border border-cyan-200">
                        Menunggu Review
                      </span>
                      {pokjaInfo && (
                        <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200">
                          Pokja {pokjaInfo.kode}
                        </span>
                      )}
                      <span className="font-mono text-xs font-medium px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700">
                        {doc.elemenPenilaian?.kode}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">({doc.kategori})</span>
                    </div>

                    <h4 className="font-semibold text-slate-900 text-sm leading-snug">{doc.judul}</h4>

                    <div className="flex items-center gap-2 text-xs text-slate-500 font-normal">
                      <span>Diajukan oleh {doc.createdBy?.nama || 'Staf RS'}</span>
                      <span className="text-slate-300">/</span>
                      <span className="font-mono">{new Date(doc.updatedAt).toLocaleDateString('id-ID')}</span>
                      {latestVersion && (
                        <>
                          <span className="text-slate-300">/</span>
                          <span className="font-mono font-medium text-slate-700">
                            v{latestVersion.versionNumber} ({(latestVersion.fileSize! / (1024 * 1024)).toFixed(2)} MB)
                          </span>
                        </>
                      )}
                    </div>

                    {latestVersion?.catatan && (
                      <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-slate-700 font-normal">
                        <span className="font-semibold text-slate-900">Catatan Pengaju: </span>
                        {latestVersion.catatan}
                      </div>
                    )}

                    {/* Review Note Input */}
                    <div className="pt-2">
                      <input
                        type="text"
                        placeholder="Catatan evaluasi verifikator (opsional jika menyetujui, wajib jika meminta revisi)..."
                        value={reviewNotes[doc.id] || ''}
                        onChange={(e) =>
                          setReviewNotes({ ...reviewNotes, [doc.id]: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  {/* Actions Decision Panel */}
                  <div className="flex flex-col gap-2.5 flex-shrink-0 self-end lg:self-start w-full lg:w-48">
                    {latestVersion && (
                      <button
                        type="button"
                        onClick={() => setActiveViewerDoc({ doc, version: latestVersion })}
                        className="w-full py-2.5 px-3.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-teal-600" />
                        <span>Buka {isVideo ? 'Video' : 'Pratinjau Berkas'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleDecision(doc.id, 'APPROVED')}
                      className="w-full py-2.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition shadow-diffuse hover:shadow-diffuse-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Setujui (APPROVED)</span>
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleDecision(doc.id, 'REVISED')}
                      className="w-full py-2.5 px-3.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition shadow-diffuse hover:shadow-diffuse-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Minta Revisi (REVISE)</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* In-App PDF Viewer & Annotation Editor Modal */}
      {activeViewerDoc && (
        <PDFViewerModal
          document={activeViewerDoc.doc}
          version={activeViewerDoc.version}
          onClose={() => setActiveViewerDoc(null)}
          onRefresh={() => {
            loadQueue();
            onDocumentReviewed();
          }}
        />
      )}
    </div>
  );
};
