import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { History, User, Loader2 } from 'lucide-react';

export const AuditTrailView: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const loadLogs = () => {
    setLoading(true);
    api
      .getAuditLogs({ limit: 50 })
      .then((res) => {
        setLogs(res.logs);
        setTotal(res.total);
      })
      .catch((err) => console.error('Fetch audit error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const formatAksi = (aksi: string) => {
    switch (aksi) {
      case 'USER_LOGIN':
        return { label: 'Login Pengguna', bg: 'bg-slate-100 text-slate-800' };
      case 'CREATE_DOCUMENT':
        return { label: 'Buat Dokumen', bg: 'bg-sky-50 text-sky-800' };
      case 'UPLOAD_VERSION':
        return { label: 'Unggah Versi PDF', bg: 'bg-indigo-50 text-indigo-800' };
      case 'UPDATE_STATUS':
        return { label: 'Perubahan Status', bg: 'bg-emerald-50 text-emerald-800' };
      case 'ADD_ANNOTATION':
        return { label: 'Anotasi Evaluasi', bg: 'bg-amber-50 text-amber-800' };
      case 'SAVE_DRAFT':
        return { label: 'Simpan Draf TipTap', bg: 'bg-purple-50 text-purple-800' };
      default:
        return { label: aksi, bg: 'bg-slate-100 text-slate-700' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            <History className="w-4 h-4 text-hospital-600" />
            <span>Transparansi & Jejak Rekam Sistem</span>
          </div>
          <h2 className="text-xl font-bold text-navy-900">Jejak Audit Aktivitas (Audit Trail)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log mutasi data, pengunggahan berkas, dan verifikasi dokumen akreditasi STARKES
          </p>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-right">
          <div className="text-xs text-slate-500 font-medium">Total Aktivitas Tercatat</div>
          <div className="text-xl font-bold text-navy-900">{total} Aktivitas</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-hospital-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Memuat log aktivitas...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Belum ada aktivitas yang tercatat dalam log audit.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Waktu</th>
                  <th className="py-3.5 px-4">Pengguna</th>
                  <th className="py-3.5 px-4">Jenis Aksi</th>
                  <th className="py-3.5 px-4">Target Entitas</th>
                  <th className="py-3.5 px-4">Detail / Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const aksiMeta = formatAksi(log.aksi);
                  const meta = log.metadataJson ? JSON.parse(log.metadataJson) : null;

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 font-semibold text-navy-900">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{log.user?.nama || 'Sistem'}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {log.user?.email || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] border border-slate-200 ${aksiMeta.bg}`}
                        >
                          {aksiMeta.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        {log.targetType}
                      </td>
                      <td className="py-3 px-4 text-slate-700 text-xs max-w-md">
                        {meta ? (
                          <div className="truncate font-mono text-[11px] text-slate-500" title={JSON.stringify(meta)}>
                            {meta.judul ? `"${meta.judul}"` : ''}
                            {meta.newStatus ? ` Status: ${meta.newStatus}` : ''}
                            {meta.versionNumber ? ` Versi #${meta.versionNumber}` : ''}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
