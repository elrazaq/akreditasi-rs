import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
  type ChartData,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import {
  BarChart3,
  Award,
  AlertTriangle,
  TrendingUp,
  FileCheck2,
  ChevronDown,
  ExternalLink,
  Loader2,
  SlidersHorizontal,
} from 'lucide-react';
import { PokjaSummary, PokjaDetail, PokjaGroup } from '../../types';
import { api } from '../../api/client';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface PokjaAnalyticsChartProps {
  pokjas: PokjaSummary[];
  onSelectPokja: (id: string) => void;
}

type ViewMode = 'all' | 'groups' | 'standards';
type MetricType = 'stacked' | 'percentage';

const GROUP_NAMES: Record<PokjaGroup, string> = {
  TATA_KELOLA: 'Tata Kelola RS',
  PELAYANAN: 'Pelayanan Pasien',
  MANAJEMEN: 'Manajemen Fasilitas & SDM',
  PROGNAS: 'Program Nasional',
};

export const PokjaAnalyticsChart: React.FC<PokjaAnalyticsChartProps> = ({
  pokjas,
  onSelectPokja,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [metricType, setMetricType] = useState<MetricType>('stacked');
  const [selectedPokjaId, setSelectedPokjaId] = useState<string>(pokjas[0]?.id || '');
  const [pokjaDetail, setPokjaDetail] = useState<PokjaDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  // Fetch pokja detail when user switches to 'standards' view or changes selected pokja
  useEffect(() => {
    if (viewMode === 'standards' && selectedPokjaId) {
      let isCancelled = false;
      setLoadingDetail(true);
      api
        .getPokjaDetail(selectedPokjaId)
        .then((res) => {
          if (!isCancelled) {
            setPokjaDetail(res.pokja);
            setLoadingDetail(false);
          }
        })
        .catch((err) => {
          console.error('Failed to load pokja detail for chart:', err);
          if (!isCancelled) setLoadingDetail(false);
        });
      return () => {
        isCancelled = true;
      };
    }
  }, [viewMode, selectedPokjaId]);

  // Insights calculation
  const insights = useMemo(() => {
    if (!pokjas || pokjas.length === 0) return null;
    const sorted = [...pokjas].sort(
      (a, b) => b.stats.complianceRate - a.stats.complianceRate
    );
    const topPokja = sorted[0];
    const lowCount = pokjas.filter((p) => p.stats.complianceRate < 80).length;
    const avgCompliance = Math.round(
      pokjas.reduce((s, p) => s + p.stats.complianceRate, 0) / pokjas.length
    );
    return { topPokja, lowCount, avgCompliance };
  }, [pokjas]);

  // Group aggregate data
  const groupData = useMemo(() => {
    const groups: PokjaGroup[] = ['TATA_KELOLA', 'PELAYANAN', 'MANAJEMEN', 'PROGNAS'];
    return groups.map((grp) => {
      const list = pokjas.filter((p) => p.kelompok === grp);
      const totalEp = list.reduce((s, p) => s + p.totalEp, 0);
      const approved = list.reduce((s, p) => s + p.stats.approved, 0);
      const submitted = list.reduce((s, p) => s + p.stats.submitted, 0);
      const revised = list.reduce((s, p) => s + p.stats.revised, 0);
      const emptyEp = Math.max(0, totalEp - (approved + submitted + revised));
      const rate =
        totalEp > 0
          ? Math.round(((approved * 10 + submitted * 5) / (totalEp * 10)) * 100)
          : 0;
      return {
        key: grp,
        label: GROUP_NAMES[grp],
        totalEp,
        approved,
        submitted,
        revised,
        emptyEp,
        rate,
      };
    });
  }, [pokjas]);

  // Standard-level data for the selected Pokja
  const standardsData = useMemo(() => {
    if (!pokjaDetail || !pokjaDetail.standars) return [];
    return pokjaDetail.standars.map((std) => {
      const epList = std.elemenPenilaian || [];
      const totalEp = epList.length;
      let approved = 0;
      let submitted = 0;
      let revised = 0;

      epList.forEach((ep) => {
        const docs = ep.documents || [];
        if (docs.some((d) => d.status === 'APPROVED')) {
          approved++;
        } else if (docs.some((d) => d.status === 'SUBMITTED')) {
          submitted++;
        } else if (docs.some((d) => d.status === 'REVISED')) {
          revised++;
        }
      });

      const emptyEp = Math.max(0, totalEp - (approved + submitted + revised));
      const rate =
        totalEp > 0
          ? Math.round(((approved * 10 + submitted * 5) / (totalEp * 10)) * 100)
          : 0;

      return {
        id: std.id,
        kode: std.kode,
        judul: std.judul,
        totalEp,
        approved,
        submitted,
        revised,
        emptyEp,
        rate,
      };
    });
  }, [pokjaDetail]);

  // Chart Data Configuration
  const chartData: ChartData<'bar'> = useMemo(() => {
    if (viewMode === 'all') {
      const labels = pokjas.map((p) => p.kode);

      if (metricType === 'stacked') {
        return {
          labels,
          datasets: [
            {
              label: 'Disetujui (Approved)',
              data: pokjas.map((p) => p.stats.approved),
              backgroundColor: '#10B981', // Emerald 500
              hoverBackgroundColor: '#059669',
              borderRadius: 4,
            },
            {
              label: 'Menunggu Verifikasi',
              data: pokjas.map((p) => p.stats.submitted),
              backgroundColor: '#F59E0B', // Amber 500
              hoverBackgroundColor: '#D97706',
              borderRadius: 4,
            },
            {
              label: 'Perlu Revisi',
              data: pokjas.map((p) => p.stats.revised),
              backgroundColor: '#EF4444', // Red 500
              hoverBackgroundColor: '#DC2626',
              borderRadius: 4,
            },
            {
              label: 'EP Belum Terisi',
              data: pokjas.map((p) =>
                Math.max(
                  0,
                  p.totalEp - (p.stats.approved + p.stats.submitted + p.stats.revised)
                )
              ),
              backgroundColor: '#E2E8F0', // Slate 200
              hoverBackgroundColor: '#CBD5E1',
              borderRadius: 4,
            },
          ],
        };
      } else {
        // Percentage Mode
        return {
          labels,
          datasets: [
            {
              label: 'Capaian Pokja (%)',
              data: pokjas.map((p) => p.stats.complianceRate),
              backgroundColor: pokjas.map((p) =>
                p.stats.complianceRate >= 80
                  ? '#10B981'
                  : p.stats.complianceRate >= 50
                  ? '#F59E0B'
                  : '#EF4444'
              ),
              borderRadius: 6,
            },
          ],
        };
      }
    } else if (viewMode === 'groups') {
      const labels = groupData.map((g) => g.label);

      if (metricType === 'stacked') {
        return {
          labels,
          datasets: [
            {
              label: 'Disetujui (Approved)',
              data: groupData.map((g) => g.approved),
              backgroundColor: '#10B981',
              borderRadius: 6,
            },
            {
              label: 'Menunggu Verifikasi',
              data: groupData.map((g) => g.submitted),
              backgroundColor: '#F59E0B',
              borderRadius: 6,
            },
            {
              label: 'Perlu Revisi',
              data: groupData.map((g) => g.revised),
              backgroundColor: '#EF4444',
              borderRadius: 6,
            },
            {
              label: 'EP Belum Terisi',
              data: groupData.map((g) => g.emptyEp),
              backgroundColor: '#E2E8F0',
              borderRadius: 6,
            },
          ],
        };
      } else {
        return {
          labels,
          datasets: [
            {
              label: 'Capaian Kelompok (%)',
              data: groupData.map((g) => g.rate),
              backgroundColor: groupData.map((g) =>
                g.rate >= 80 ? '#10B981' : g.rate >= 50 ? '#F59E0B' : '#EF4444'
              ),
              borderRadius: 6,
            },
          ],
        };
      }
    } else {
      // Standards view
      const labels = standardsData.map((s) => s.kode);

      if (metricType === 'stacked') {
        return {
          labels,
          datasets: [
            {
              label: 'Disetujui (Approved)',
              data: standardsData.map((s) => s.approved),
              backgroundColor: '#10B981',
              borderRadius: 4,
            },
            {
              label: 'Menunggu Verifikasi',
              data: standardsData.map((s) => s.submitted),
              backgroundColor: '#F59E0B',
              borderRadius: 4,
            },
            {
              label: 'Perlu Revisi',
              data: standardsData.map((s) => s.revised),
              backgroundColor: '#EF4444',
              borderRadius: 4,
            },
            {
              label: 'EP Belum Terisi',
              data: standardsData.map((s) => s.emptyEp),
              backgroundColor: '#E2E8F0',
              borderRadius: 4,
            },
          ],
        };
      } else {
        return {
          labels,
          datasets: [
            {
              label: 'Capaian Standar (%)',
              data: standardsData.map((s) => s.rate),
              backgroundColor: standardsData.map((s) =>
                s.rate >= 80 ? '#10B981' : s.rate >= 50 ? '#F59E0B' : '#EF4444'
              ),
              borderRadius: 6,
            },
          ],
        };
      }
    }
  }, [viewMode, metricType, pokjas, groupData, standardsData]);

  // Chart Options
  const chartOptions: ChartOptions<'bar'> = useMemo(() => {
    const isStacked = metricType === 'stacked';

    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            usePointStyle: true,
            boxWidth: 8,
            boxHeight: 8,
            font: {
              family: 'Plus Jakarta Sans, sans-serif',
              size: 11,
              weight: 500,
            },
            color: '#475569',
            padding: 16,
          },
        },
        tooltip: {
          backgroundColor: '#0F172A',
          titleColor: '#F8FAFC',
          bodyColor: '#E2E8F0',
          borderColor: '#334155',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 12,
          boxPadding: 4,
          usePointStyle: true,
          callbacks: {
            title(tooltipItems) {
              const idx = tooltipItems[0].dataIndex;
              if (viewMode === 'all') {
                const p = pokjas[idx];
                return `${p.kode} · ${p.nama}`;
              } else if (viewMode === 'groups') {
                return groupData[idx]?.label || '';
              } else {
                const s = standardsData[idx];
                return `${s?.kode}: ${s?.judul || ''}`;
              }
            },
            label(context) {
              const value = context.parsed.y ?? 0;
              if (metricType === 'percentage') {
                return ` Capaian: ${value}% ${value >= 80 ? '(Memenuhi Paripurna)' : '(Belum Paripurna)'}`;
              }
              return ` ${context.dataset.label}: ${value} Dokumen/EP`;
            },
            footer(tooltipItems) {
              if (metricType === 'stacked' && viewMode === 'all') {
                const idx = tooltipItems[0].dataIndex;
                const p = pokjas[idx];
                return `\nTotal Target: ${p.totalEp} Elemen Penilaian\nIndeks Capaian: ${p.stats.complianceRate}%`;
              }
              return '';
            },
          },
        },
      },
      scales: {
        x: {
          stacked: isStacked,
          grid: {
            display: false,
          },
          ticks: {
            font: {
              family: 'JetBrains Mono, monospace',
              size: 11,
              weight: 600,
            },
            color: '#334155',
            maxRotation: 0,
          },
          border: {
            color: '#CBD5E1',
          },
        },
        y: {
          stacked: isStacked,
          beginAtZero: true,
          suggestedMax: metricType === 'percentage' ? 100 : undefined,
          grid: {
            color: '#F1F5F9',
          },
          ticks: {
            font: {
              family: 'JetBrains Mono, monospace',
              size: 10,
            },
            color: '#64748B',
            callback(value) {
              return metricType === 'percentage' ? `${value}%` : `${value}`;
            },
          },
          border: {
            dash: [4, 4],
            color: '#E2E8F0',
          },
        },
      },
      onClick: (_event, elements) => {
        if (elements.length > 0 && viewMode === 'all') {
          const idx = elements[0].index;
          const p = pokjas[idx];
          if (p) {
            setSelectedPokjaId(p.id);
            setViewMode('standards');
          }
        }
      },
    };
  }, [metricType, viewMode, pokjas, groupData, standardsData]);

  const currentPokja = pokjas.find((p) => p.id === selectedPokjaId) || pokjas[0];

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-diffuse hover:shadow-diffuse-lg transition-all space-y-5">
      {/* Chart Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Grafik Capaian Pemenuhan Instrumen STARKES 2024</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-medium">
                  Interaktif
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {viewMode === 'all' && 'Membandingkan distribusi status berkas 16 Pokja RSUD Bintan'}
                {viewMode === 'groups' && 'Distribusi berkas berdasarkan 4 Kelompok Standar Kemenkes RI'}
                {viewMode === 'standards' &&
                  `Rincian capaian per Standar pada Pokja ${currentPokja?.kode} (${currentPokja?.nama})`}
              </p>
            </div>
          </div>
        </div>

        {/* View Switchers & Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Buttons */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200/80 text-xs">
            <button
              onClick={() => setViewMode('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                viewMode === 'all'
                  ? 'bg-white text-teal-800 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              16 Pokja
            </button>
            <button
              onClick={() => setViewMode('groups')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                viewMode === 'groups'
                  ? 'bg-white text-teal-800 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              4 Kelompok
            </button>
            <button
              onClick={() => setViewMode('standards')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                viewMode === 'standards'
                  ? 'bg-white text-teal-800 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Per Standar
            </button>
          </div>

          {/* Pokja Dropdown if in standards mode */}
          {viewMode === 'standards' && (
            <div className="relative">
              <select
                value={selectedPokjaId}
                onChange={(e) => setSelectedPokjaId(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 text-xs font-mono font-semibold bg-teal-50/80 border border-teal-200 text-teal-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer shadow-xs"
              >
                {pokjas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.kode} - {p.nama}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-teal-700 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          {/* Metric Type Toggle (Stacked vs Percentage) */}
          <button
            onClick={() => setMetricType((m) => (m === 'stacked' ? 'percentage' : 'stacked'))}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            title="Ubah mode tampilan antara Stacked Dokumen dan Persentase Kelulusan"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-teal-600" />
            <span className="font-medium">
              {metricType === 'stacked' ? 'Tampilkan % Nilai' : 'Tampilkan Status Berkas'}
            </span>
          </button>
        </div>
      </div>

      {/* Paripurna Reference Target Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50/80 border border-slate-200/70 rounded-2xl px-4 py-2.5">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
            <span className="w-3 h-3 rounded-md bg-emerald-500" /> Disetujui
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
            <span className="w-3 h-3 rounded-md bg-amber-500" /> Menunggu Verifikasi
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
            <span className="w-3 h-3 rounded-md bg-rose-500" /> Perlu Revisi
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
            <span className="w-3 h-3 rounded-md bg-slate-200" /> Belum Diunggah
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-teal-100/60 border border-teal-300 text-[11px] font-mono font-semibold text-teal-800">
            <TrendingUp className="w-3 h-3 text-teal-600" /> Target Paripurna: &ge; 80%
          </span>
          {viewMode === 'all' && (
            <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
              (Tips: Klik batang untuk rincian standar)
            </span>
          )}
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="relative w-full h-80 md:h-96">
        {loadingDetail ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-xs rounded-2xl z-10 gap-2">
            <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
            <span className="text-xs text-slate-600 font-medium font-mono">
              Memuat data standar Pokja {currentPokja?.kode}...
            </span>
          </div>
        ) : null}
        <Bar data={chartData} options={chartOptions} />
      </div>

      {/* Bottom Insights Strip (Hallmark Evidence-Based Details) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
        {/* Insight 1: Top Performer */}
        <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-emerald-800 font-semibold uppercase tracking-wider">
                Pokja Capaian Tertinggi
              </div>
              <div className="font-semibold text-slate-900 mt-0.5">
                {insights?.topPokja.kode} · {insights?.topPokja.nama}
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0 pl-2">
            <span className="font-mono font-bold text-emerald-700 text-sm">
              {insights?.topPokja.stats.complianceRate}%
            </span>
          </div>
        </div>

        {/* Insight 2: Acceleration Needed */}
        <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-amber-800 font-semibold uppercase tracking-wider">
                Perlu Akselerasi (&lt; 80%)
              </div>
              <div className="font-semibold text-slate-900 mt-0.5">
                {insights?.lowCount} dari 16 Pokja Akreditasi
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0 pl-2">
            <span className="font-mono font-bold text-amber-700 text-sm">
              {insights ? Math.round((insights.lowCount / 16) * 100) : 0}% RS
            </span>
          </div>
        </div>

        {/* Insight 3: Quick Action */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center flex-shrink-0">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                Lembar Kerja Pokja Terpilih
              </div>
              <div className="font-semibold text-slate-900 mt-0.5 truncate max-w-[140px]">
                {currentPokja?.kode} ({currentPokja?.totalEp} EP)
              </div>
            </div>
          </div>
          <button
            onClick={() => onSelectPokja(currentPokja.id)}
            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition cursor-pointer flex items-center gap-1 shadow-xs flex-shrink-0"
          >
            <span>Buka Pokja</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
