import React, { useState } from 'react';
import { PokjaSummary } from '../../types';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

interface PokjaOverviewProps {
  pokjas: PokjaSummary[];
  onSelectPokja: (id: string) => void;
  searchQuery: string;
}

export const PokjaOverview: React.FC<PokjaOverviewProps> = ({
  pokjas,
  onSelectPokja,
  searchQuery,
}) => {
  const [activeGroup, setActiveGroup] = useState<string>('ALL');

  // Filter based on tab and search
  const filtered = pokjas.filter((p) => {
    const matchesGroup = activeGroup === 'ALL' || p.kelompok === activeGroup;
    const matchesSearch =
      p.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nama.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  // Aggregate stats across all 16 Pokja
  const totalEp = pokjas.reduce((sum, p) => sum + p.totalEp, 0);
  const totalApproved = pokjas.reduce((sum, p) => sum + p.stats.approved, 0);
  const totalSubmitted = pokjas.reduce((sum, p) => sum + p.stats.submitted, 0);
  const totalRevised = pokjas.reduce((sum, p) => sum + p.stats.revised, 0);
  const totalDraft = pokjas.reduce((sum, p) => sum + p.stats.draft, 0);
  const overallRate = totalEp > 0 ? Math.round((totalApproved / totalEp) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Header Metrics Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-hospital-600 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>STARKES Kemenkes RI 2024</span>
            </div>
            <h2 className="text-xl font-bold text-navy-900 mt-1">
              Status Kesiapan Akreditasi RSUD Bintan
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Monitoring pemenuhan bukti dan dokumen kepatuhan untuk 16 Pokja
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="text-right">
              <div className="text-xs text-slate-500 font-medium">Tingkat Kelengkapan</div>
              <div className="text-2xl font-black text-navy-900">{overallRate}%</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-hospital-600 text-white flex items-center justify-center shadow-md">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* 4 Metrics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-5">
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 flex-shrink-0" />
            <div>
              <div className="text-xs text-emerald-800 font-medium">Disetujui (Approved)</div>
              <div className="text-xl font-bold text-emerald-900">{totalApproved} Dokumen</div>
            </div>
          </div>

          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 flex items-center gap-3">
            <Clock className="w-8 h-8 text-amber-600 flex-shrink-0" />
            <div>
              <div className="text-xs text-amber-800 font-medium">Menunggu Verifikasi</div>
              <div className="text-xl font-bold text-amber-900">{totalSubmitted} Dokumen</div>
            </div>
          </div>

          <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5 flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-rose-600 flex-shrink-0" />
            <div>
              <div className="text-xs text-rose-800 font-medium">Perlu Perbaikan</div>
              <div className="text-xl font-bold text-rose-900">{totalRevised} Dokumen</div>
            </div>
          </div>

          <div className="bg-slate-100 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3">
            <FileText className="w-8 h-8 text-slate-600 flex-shrink-0" />
            <div>
              <div className="text-xs text-slate-700 font-medium">Draf Disiapkan</div>
              <div className="text-xl font-bold text-slate-900">{totalDraft} Dokumen</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { key: 'ALL', label: 'Semua Pokja', count: pokjas.length },
          { key: 'TATA_KELOLA', label: 'Tata Kelola', count: pokjas.filter((p) => p.kelompok === 'TATA_KELOLA').length },
          { key: 'PELAYANAN', label: 'Pelayanan Pasien', count: pokjas.filter((p) => p.kelompok === 'PELAYANAN').length },
          { key: 'MANAJEMEN', label: 'Manajemen RS', count: pokjas.filter((p) => p.kelompok === 'MANAJEMEN').length },
          { key: 'PROGNAS', label: 'Program Nasional', count: pokjas.filter((p) => p.kelompok === 'PROGNAS').length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveGroup(tab.key)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
              activeGroup === tab.key
                ? 'bg-navy-700 text-white shadow-sm'
                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeGroup === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* 16 Pokja Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((pokja) => {
          const rate = pokja.stats.complianceRate;
          return (
            <div
              key={pokja.id}
              onClick={() => onSelectPokja(pokja.id)}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:border-hospital-500 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-sky-50 text-hospital-700 border border-sky-200">
                    {pokja.kode}
                  </span>
                  <span className="text-[10px] font-semibold uppercase text-slate-400">
                    {pokja.kelompok.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="font-bold text-navy-900 text-sm group-hover:text-hospital-600 transition leading-snug">
                  {pokja.nama}
                </h3>

                <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                  <span>{pokja.totalStandar} Standar,</span>
                  <span>{pokja.totalEp} Elemen Penilaian</span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100">
                {/* Progress bar */}
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-500 text-[11px]">Kepatuhan Dokumen</span>
                  <span
                    className={`font-bold ${
                      rate >= 80 ? 'text-emerald-600' : rate >= 40 ? 'text-amber-600' : 'text-slate-600'
                    }`}
                  >
                    {rate}%
                  </span>
                </div>

                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      rate >= 80 ? 'bg-emerald-500' : rate >= 40 ? 'bg-amber-500' : 'bg-hospital-600'
                    }`}
                    style={{ width: `${Math.max(rate, 4)}%` }}
                  />
                </div>

                {/* Status Badges Mini */}
                <div className="flex items-center justify-between mt-3 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1 text-emerald-700 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{pokja.stats.approved} Selesai</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-600">
                    <span>{pokja.stats.totalDocuments} total berkas</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
