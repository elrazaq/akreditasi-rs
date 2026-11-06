import React, { useState } from 'react';
import { PokjaDetail, ElemenPenilaian } from '../../types';
import {
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Award,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BookOpen,
  UserCheck,
  FileCheck,
  Layers,
} from 'lucide-react';

interface PokjaDetailViewProps {
  pokja: PokjaDetail;
  onSelectEP: (epId: string) => void;
  selectedEPId?: string | null;
}

export const PokjaDetailView: React.FC<PokjaDetailViewProps> = ({
  pokja,
  onSelectEP,
  selectedEPId,
}) => {
  const [filterScore, setFilterScore] = useState<string>('ALL');

  // Accordion state
  const [expandedStandars, setExpandedStandars] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    pokja.standars.forEach((s) => {
      init[s.id] = true;
    });
    return init;
  });

  const toggleStandar = (id: string) => {
    setExpandedStandars((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Calculate official STARKES scoring from dynamic database elements
  let totalEPs = 0;
  let totalPoints = 0;
  let approvedCount = 0;
  let submittedCount = 0;
  let revisedCount = 0;
  let zeroCount = 0;

  pokja.standars.forEach((s) => {
    s.elemenPenilaian.forEach((ep) => {
      totalEPs++;
      const docs = ep.documents || [];
      const hasApproved = docs.some((d) => d.status === 'APPROVED');
      const hasSubmitted = docs.some((d) => d.status === 'SUBMITTED');
      const hasRevised = docs.some((d) => d.status === 'REVISED');

      if (hasApproved) {
        totalPoints += 10;
        approvedCount++;
      } else if (hasSubmitted || hasRevised || docs.length > 0) {
        totalPoints += 5;
        if (hasSubmitted) submittedCount++;
        else revisedCount++;
      } else {
        zeroCount++;
      }
    });
  });

  const maxPoints = totalEPs * 10;
  const complianceRate = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
  const isParipurna = complianceRate >= 80;

  return (
    <div className="space-y-6">
      {/* Official Header Banner & STARKES Assessment Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-diffuse">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-xl bg-teal-600 text-white shadow-xs">
                {pokja.kode}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-2 py-0.5 rounded-lg bg-slate-100">
                Kelompok {pokja.kelompok.replace('_', ' ')}
              </span>
              <span className="text-[11px] text-slate-700 font-medium flex items-center gap-1 font-mono">
                <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                <span>Kepdirjen Yankes HK.02.02/D/47104/2027</span>
              </span>
            </div>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">{pokja.nama}</h1>
            <p className="text-xs text-slate-500 mt-1 font-normal">
              Instrumen Penilaian Akreditasi RSUD Bintan
            </p>
          </div>

          {/* Official Scoring Card */}
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex-shrink-0 shadow-diffuse">
            <div className="text-right">
              <div className="text-[11px] text-slate-500 font-mono uppercase tracking-wider">Poin Capaian</div>
              <div className="text-xl font-semibold font-mono text-slate-900">
                {totalPoints} <span className="text-xs text-slate-400 font-normal">/ {maxPoints}</span>
              </div>
              <div className="text-[11px] font-medium mt-1">
                {isParipurna ? (
                  <span className="text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2.5 py-0.5 rounded-lg inline-flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Paripurna ({complianceRate}%)
                  </span>
                ) : (
                  <span className="text-amber-800 bg-amber-100/70 border border-amber-200 px-2.5 py-0.5 rounded-lg inline-flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-amber-600" /> Target 80% (Kini {complianceRate}%)
                  </span>
                )}
              </div>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-glow-teal">
              <Award className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Breakdown Metric Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-5 text-xs">
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-slate-500 text-[11px] font-normal">Skor 10 (Lengkap)</div>
              <div className="text-base font-semibold text-slate-900 font-mono mt-0.5">{approvedCount} EP</div>
            </div>
            <span className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 font-semibold flex items-center justify-center font-mono text-xs">
              10
            </span>
          </div>

          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-slate-500 text-[11px] font-normal">Skor 5 (Sebagian)</div>
              <div className="text-base font-semibold text-slate-900 font-mono mt-0.5">{submittedCount + revisedCount} EP</div>
            </div>
            <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 font-semibold flex items-center justify-center font-mono text-xs">
              5
            </span>
          </div>

          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-slate-500 text-[11px] font-normal">Skor 0 (Perlu Berkas)</div>
              <div className="text-base font-semibold text-slate-900 font-mono mt-0.5">{zeroCount} EP</div>
            </div>
            <span className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 font-semibold flex items-center justify-center font-mono text-xs">
              0
            </span>
          </div>

          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-slate-500 text-[11px] font-normal">Cakupan Instrumen</div>
              <div className="text-base font-semibold text-slate-900 font-mono mt-0.5">
                {pokja.standars.length} Standar, {totalEPs} EP
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Legend RDOWS Nordic Vibrant */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center gap-2 flex-wrap text-[11px] text-slate-600">
          <span className="font-semibold text-slate-800">Metode Penilaian STARKES (RDOWS):</span>
          <span className="px-2 py-0.5 rounded-lg bg-violet-50 border border-violet-200 text-violet-700 font-mono font-medium">
            <strong>R</strong> Regulasi
          </span>
          <span className="px-2 py-0.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 font-mono font-medium">
            <strong>D</strong> Dokumen/Bukti
          </span>
          <span className="px-2 py-0.5 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-700 font-mono font-medium">
            <strong>O</strong> Observasi
          </span>
          <span className="px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 font-mono font-medium">
            <strong>W</strong> Wawancara
          </span>
          <span className="px-2 py-0.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-mono font-medium">
            <strong>S</strong> Simulasi
          </span>
        </div>
      </div>

      {/* Filter Tabs by Score */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-slate-600 mr-1">Filter Skor:</span>
        {[
          { key: 'ALL', label: 'Semua Elemen Penilaian' },
          { key: '10', label: 'Skor 10 (Lengkap)' },
          { key: '5', label: 'Skor 5 (Sebagian)' },
          { key: '0', label: 'Skor 0 (Perlu Berkas)' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterScore(tab.key)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs ${
              filterScore === tab.key
                ? 'bg-teal-600 text-white shadow-glow-teal'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Standar & EP Accordions with Database Data */}
      <div className="space-y-4">
        {pokja.standars.map((standar) => {
          const isExpanded = expandedStandars[standar.id] ?? true;

          const filteredEPs = standar.elemenPenilaian.filter((ep) => {
            const docs = ep.documents || [];
            const hasApproved = docs.some((d) => d.status === 'APPROVED');
            const hasSubmitted = docs.some((d) => d.status === 'SUBMITTED');
            const hasRevised = docs.some((d) => d.status === 'REVISED');

            let score = 0;
            if (hasApproved) score = 10;
            else if (hasSubmitted || hasRevised || docs.length > 0) score = 5;

            if (filterScore === '10') return score === 10;
            if (filterScore === '5') return score === 5;
            if (filterScore === '0') return score === 0;
            return true;
          });

          if (filteredEPs.length === 0 && filterScore !== 'ALL') {
            return null;
          }

          return (
            <div
              key={standar.id}
              className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-diffuse"
            >
              {/* Standar Header Bar */}
              <button
                type="button"
                onClick={() => toggleStandar(standar.id)}
                className="w-full px-5 py-3.5 bg-slate-50/80 border-b border-slate-200/70 flex items-center justify-between text-left hover:bg-slate-100/80 transition cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-xl bg-slate-800 text-white shadow-xs">
                    {standar.kode}
                  </span>
                  <span className="text-xs font-semibold text-slate-900 truncate">
                    {standar.judul}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                    ({standar.elemenPenilaian.length} Elemen Penilaian)
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 text-slate-500">
                  <span className="text-[11px] font-mono">
                    {filteredEPs.length} item
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  )}
                </div>
              </button>

              {/* Elemen Penilaian List */}
              {isExpanded && (
                <div className="divide-y divide-slate-100">
                  {filteredEPs.map((ep: ElemenPenilaian) => {
                    const isSelected = selectedEPId === ep.id;
                    const docs = ep.documents || [];
                    const approvedDoc = docs.find((d) => d.status === 'APPROVED');
                    const submittedDoc = docs.find((d) => d.status === 'SUBMITTED');
                    const revisedDoc = docs.find((d) => d.status === 'REVISED');

                    let score = 0;
                    if (approvedDoc) score = 10;
                    else if (submittedDoc || revisedDoc || docs.length > 0) score = 5;

                    return (
                      <div
                        key={ep.id}
                        onClick={() => onSelectEP(ep.id)}
                        className={`p-5 flex flex-col lg:flex-row lg:items-start justify-between gap-5 transition cursor-pointer hover:bg-slate-50/70 ${
                          isSelected ? 'bg-teal-50/40 border-l-4 border-teal-600 shadow-sm' : ''
                        }`}
                      >
                        {/* EP Details & Database Metadata */}
                        <div className="space-y-2.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg">
                              {ep.kode}
                            </span>

                            {/* Database RDOWS Indicators (Nordic Clinical Color Badges) */}
                            <div className="flex items-center gap-1 font-mono text-[10px] font-semibold">
                              <span
                                className={`px-2 py-0.5 rounded-lg border ${
                                  ep.kodeR
                                    ? 'bg-violet-50 text-violet-700 border-violet-200'
                                    : 'bg-slate-100 text-slate-400 border-slate-200 line-through opacity-40'
                                }`}
                                title="Regulasi"
                              >
                                R
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-lg border ${
                                  ep.kodeD
                                    ? 'bg-teal-50 text-teal-700 border-teal-200'
                                    : 'bg-slate-100 text-slate-400 border-slate-200 line-through opacity-40'
                                }`}
                                title="Dokumen"
                              >
                                D
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-lg border ${
                                  ep.kodeO
                                    ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                                    : 'bg-slate-100 text-slate-400 border-slate-200 line-through opacity-40'
                                }`}
                                title="Observasi"
                              >
                                O
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-lg border ${
                                  ep.kodeW
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-slate-100 text-slate-400 border-slate-200 line-through opacity-40'
                                }`}
                                title="Wawancara"
                              >
                                W
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-lg border ${
                                  ep.kodeS
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-slate-100 text-slate-400 border-slate-200 line-through opacity-40'
                                }`}
                                title="Simulasi"
                              >
                                S
                              </span>
                            </div>

                            {/* Reference PDF Page */}
                            {ep.halamanPdf && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                                Hal. {ep.halamanPdf}
                              </span>
                            )}

                            {/* Official Scoring Rule */}
                            {ep.skoring && (
                              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200">
                                Pola: {ep.skoring}
                              </span>
                            )}
                          </div>

                          {/* EP Description Text */}
                          <p className="text-xs text-slate-800 leading-relaxed font-normal">
                            {ep.deskripsi}
                          </p>

                          {/* Database Kelengkapan Bukti */}
                          {ep.kelengkapanBukti && (
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-1">
                              <div className="font-semibold text-slate-900 text-[11px] flex items-center gap-1.5">
                                <FileCheck className="w-3.5 h-3.5 text-teal-600" />
                                <span>Kelengkapan Bukti Resmi Kemenkes:</span>
                              </div>
                              <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                                {ep.kelengkapanBukti}
                              </p>
                            </div>
                          )}

                          {/* PIC Unit */}
                          {ep.picUnit && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                              <span>PIC / Unit Kerja:</span>
                              <strong className="text-slate-800 font-semibold">{ep.picUnit}</strong>
                            </div>
                          )}
                        </div>

                        {/* STARKES Scoring Pill, Status & Manage Action */}
                        <div className="flex items-center justify-between sm:justify-end gap-3.5 flex-shrink-0 w-full lg:w-auto pt-1">
                          {/* Official Score Badge */}
                          <div className="text-right">
                            <div className="text-[10px] uppercase font-mono text-slate-400">
                              Skor
                            </div>
                            <span
                              className={`inline-flex items-center justify-center font-mono font-semibold text-xs px-2.5 py-1 rounded-xl border ${
                                score === 10
                                  ? 'bg-teal-600 text-white border-teal-600 shadow-glow-teal'
                                  : score === 5
                                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                                  : 'bg-slate-100 text-slate-500 border-slate-200'
                              }`}
                            >
                              {score} / 10
                            </span>
                          </div>

                          {/* Status Pill */}
                          <div className="w-32 text-center">
                            {approvedDoc ? (
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 w-full justify-center">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Terpenuhi</span>
                              </span>
                            ) : submittedDoc ? (
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-xl bg-cyan-50 text-cyan-800 border border-cyan-200 w-full justify-center">
                                <Clock className="w-3 h-3 text-cyan-600" />
                                <span>Menunggu</span>
                              </span>
                            ) : revisedDoc ? (
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 w-full justify-center">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                <span>Revisi</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">
                                Belum dinilai
                              </span>
                            )}
                            <div className="text-[10px] text-slate-400 mt-1 font-mono">
                              {docs.length} berkas
                            </div>
                          </div>

                          {/* Action Button - Large Rounded */}
                          <button
                            type="button"
                            className="p-2.5 text-slate-400 hover:text-white hover:bg-teal-600 rounded-xl transition cursor-pointer shadow-xs hover:shadow-glow-teal"
                            title="Buka Ruang Kerja EP"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
