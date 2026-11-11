import React from 'react';
import { PokjaSummary, PokjaGroup } from '../../types';
import {
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
  Clock,
  ChevronRight,
  Layers,
  ArrowRight,
  FileCheck,
  AlertCircle,
} from 'lucide-react';

interface ExecutiveDashboardProps {
  pokjas: PokjaSummary[];
  onSelectPokja: (id: string) => void;
  onGoToVerification: () => void;
}

const GROUP_CONFIG: Record<
  PokjaGroup,
  { title: string; color: string; badgeBg: string; badgeBorder: string; badgeText: string; barBg: string }
> = {
  TATA_KELOLA: {
    title: 'Tata Kelola RS',
    color: 'from-violet-500 to-purple-600',
    badgeBg: 'bg-violet-50',
    badgeBorder: 'border-violet-200',
    badgeText: 'text-violet-700',
    barBg: 'bg-violet-600',
  },
  PELAYANAN: {
    title: 'Pelayanan Pasien',
    color: 'from-cyan-500 to-sky-600',
    badgeBg: 'bg-cyan-50',
    badgeBorder: 'border-cyan-200',
    badgeText: 'text-cyan-700',
    barBg: 'bg-cyan-600',
  },
  MANAJEMEN: {
    title: 'Manajemen Fasilitas & SDM',
    color: 'from-teal-500 to-emerald-600',
    badgeBg: 'bg-teal-50',
    badgeBorder: 'border-teal-200',
    badgeText: 'text-teal-700',
    barBg: 'bg-teal-600',
  },
  PROGNAS: {
    title: 'Program Nasional Kemenkes',
    color: 'from-amber-500 to-rose-500',
    badgeBg: 'bg-amber-50',
    badgeBorder: 'border-amber-200',
    badgeText: 'text-amber-700',
    barBg: 'bg-amber-500',
  },
};

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  pokjas,
  onSelectPokja,
  onGoToVerification,
}) => {
  const totalEp = pokjas.reduce((sum, p) => sum + p.totalEp, 0);
  const totalApproved = pokjas.reduce((sum, p) => sum + p.stats.approved, 0);
  const totalSubmitted = pokjas.reduce((sum, p) => sum + p.stats.submitted, 0);
  const totalRevised = pokjas.reduce((sum, p) => sum + p.stats.revised, 0);
  const totalDocs = pokjas.reduce((sum, p) => sum + p.stats.totalDocuments, 0);

  // STARKES Paripurna Scoring calculation
  const totalScorePoints = totalApproved * 10 + totalSubmitted * 5;
  const maxPoints = totalEp * 10;
  const overallRate = maxPoints > 0 ? Math.round((totalScorePoints / maxPoints) * 100) : 0;
  const isParipurna = overallRate >= 80;

  // Group summary calculations
  const groups: PokjaGroup[] = ['TATA_KELOLA', 'PELAYANAN', 'MANAJEMEN', 'PROGNAS'];
  const groupStats = groups.map((grp) => {
    const list = pokjas.filter((p) => p.kelompok === grp);
    const grpEp = list.reduce((s, p) => s + p.totalEp, 0);
    const grpAppr = list.reduce((s, p) => s + p.stats.approved, 0);
    const grpSubm = list.reduce((s, p) => s + p.stats.submitted, 0);
    const rate = grpEp > 0 ? Math.round(((grpAppr * 10 + grpSubm * 5) / (grpEp * 10)) * 100) : 0;
    return {
      group: grp,
      ...GROUP_CONFIG[grp],
      pokjaCount: list.length,
      epCount: grpEp,
      rate,
    };
  });

  return (
    <div className="space-y-6">
      {/* Hospital Executive Banner (Nordic Clinical Vibrant Hero) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 rounded-3xl p-6 md:p-8 text-white border border-slate-700/60 shadow-diffuse relative overflow-hidden">
        {/* Soft Background Glow Effects */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-teal-500/15 border border-teal-500/30 text-[11px] font-mono font-medium text-teal-300">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>STARKES KEMENKES 2024 / Kepdirjen Yankes 2024</span>
            </div>
            <div className="flex items-center gap-3.5 pt-1">
              <img
                src="/logo.png"
                alt="Logo RSUD Bintan Sehati"
                className="w-12 h-12 rounded-full object-contain bg-white/10 p-1 shadow-lg ring-2 ring-white/20 flex-shrink-0"
              />
              <div>
                <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-white">
                  E-Sehati · Kesiapan Akreditasi RSUD Bintan
                </h1>
                <p className="text-teal-300 text-[11px] font-mono font-medium mt-0.5">
                  E-Sehati (Senyum, Empati, Hati Nurani, Aktual, Teknologi, Ibadah)
                </p>
              </div>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed font-normal">
              Pemantauan terpusat pemenuhan instrumen akreditasi 16 Pokja, berkas regulasi (R), dokumentasi bukti (D), observasi fasilitas (O), materi wawancara (W), dan simulasi peragaan klinis (S).
            </p>
          </div>

          {/* Paripurna Score Gauge Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5 flex items-center gap-5 flex-shrink-0 shadow-diffuse">
            <div className="text-right">
              <div className="text-[11px] font-mono text-slate-300 uppercase tracking-wider">Indeks Kesiapan</div>
              <div className="text-3xl font-semibold font-mono text-white tracking-tight">{overallRate}%</div>
              <div className="text-[11px] font-medium mt-1">
                {isParipurna ? (
                  <span className="text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-lg inline-flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> Memenuhi Paripurna
                  </span>
                ) : (
                  <span className="text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-lg inline-flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-amber-300" /> Target Min. 80%
                  </span>
                )}
              </div>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shadow-glow-teal">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* 4 Metrics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-700/60 text-xs">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 hover:bg-white/10 transition">
            <div className="text-slate-400 text-[11px] font-normal">Total Berkas Terdaftar</div>
            <div className="text-base font-semibold font-mono text-white mt-0.5">{totalDocs} Dokumen</div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 hover:bg-white/10 transition">
            <div className="text-slate-400 text-[11px] font-normal">Berkas Disetujui (Approved)</div>
            <div className="text-base font-semibold font-mono text-emerald-300 mt-0.5 flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5" />
              <span>{totalApproved} Dokumen</span>
            </div>
          </div>

          <div
            onClick={onGoToVerification}
            className="bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/25 transition rounded-2xl p-3.5 cursor-pointer group shadow-xs"
          >
            <div className="text-teal-300 text-[11px] flex items-center justify-between font-medium">
              <span>Menunggu Verifikasi</span>
              <ArrowRight className="w-3.5 h-3.5 text-teal-300 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="text-base font-semibold font-mono text-white mt-0.5">{totalSubmitted} Berkas</div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 hover:bg-white/10 transition">
            <div className="text-slate-400 text-[11px] font-normal">Perlu Perbaikan / Revisi</div>
            <div className="text-base font-semibold font-mono text-rose-300 mt-0.5 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{totalRevised} Berkas</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Group Summary Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-600" />
            <span>Kelompok Standar Akreditasi Kemenkes RI</span>
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">
            4 Kelompok / 16 Pokja Akreditasi
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {groupStats.map((st) => (
            <div
              key={st.group}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-diffuse hover:shadow-diffuse-lg hover:border-slate-300 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-medium border ${st.badgeBg} ${st.badgeBorder} ${st.badgeText}`}>
                    {st.group.replace('_', ' ')}
                  </span>
                  <span className="text-lg font-semibold font-mono text-slate-900">{st.rate}%</span>
                </div>
                <h4 className="text-sm font-semibold text-slate-800 mt-2.5">{st.title}</h4>
                <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                  {st.pokjaCount} Pokja, {st.epCount} Elemen Penilaian
                </div>
              </div>

              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-4">
                <div
                  className={`h-full ${st.barBg} rounded-full transition-all duration-500`}
                  style={{ width: `${Math.max(st.rate, 3)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 16 Pokja Quick Selector Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
            16 Pokja Akreditasi RSUD Bintan (STARKES 2024)
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">
            Klik kartu Pokja untuk membuka lembar kerja instrumen
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {pokjas.map((pokja) => {
            const rate = pokja.stats.complianceRate;

            return (
              <div
                key={pokja.id}
                onClick={() => onSelectPokja(pokja.id)}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-diffuse hover:shadow-diffuse-lg hover:border-teal-300 transition-all duration-200 cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200">
                      {pokja.kode}
                    </span>
                    <span className="text-xs font-mono font-semibold text-slate-700">
                      {rate}%
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-900 group-hover:text-teal-700 transition truncate" title={pokja.nama}>
                    {pokja.nama}
                  </h4>
                  <div className="text-[11px] text-slate-500 mt-1 font-mono">
                    {pokja.totalStandar} Standar, {pokja.totalEp} EP
                  </div>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span className="text-teal-700 font-medium">{pokja.stats.approved} Terpenuhi</span>
                  <div className="w-6 h-6 rounded-lg bg-slate-50 group-hover:bg-teal-50 group-hover:text-teal-600 flex items-center justify-center transition-colors">
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
