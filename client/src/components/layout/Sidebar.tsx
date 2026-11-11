import React, { useState } from 'react';
import { NavTab, PokjaSummary, PokjaGroup } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  ClipboardList,
  FolderArchive,
  CheckSquare,
  History,
  ChevronDown,
  ChevronRight,
  LogOut,
  Users,
  X,
  Loader2,
} from 'lucide-react';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pokjas: PokjaSummary[];
  selectedPokjaId: string | null;
  loadingPokjaId?: string | null;
  onSelectPokja: (id: string | null) => void;
  pendingReviewCount: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const GROUP_CONFIG: Record<PokjaGroup, { label: string; dotColor: string; badge: string }> = {
  TATA_KELOLA: { label: 'Tata Kelola RS', dotColor: 'bg-violet-400', badge: 'text-violet-300' },
  PELAYANAN: { label: 'Pelayanan Pasien', dotColor: 'bg-cyan-400', badge: 'text-cyan-300' },
  MANAJEMEN: { label: 'Manajemen & Sarana', dotColor: 'bg-teal-400', badge: 'text-teal-300' },
  PROGNAS: { label: 'Program Nasional', dotColor: 'bg-rose-400', badge: 'text-rose-300' },
};

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pokjas,
  selectedPokjaId,
  loadingPokjaId,
  onSelectPokja,
  pendingReviewCount,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { user, logout } = useAuth();
  const [pokjaExpanded, setPokjaExpanded] = useState<boolean>(true);
  const [expandedGroup, setExpandedGroup] = useState<PokjaGroup | null>('TATA_KELOLA');

  const groups: PokjaGroup[] = ['TATA_KELOLA', 'PELAYANAN', 'MANAJEMEN', 'PROGNAS'];

  const handleSelectTab = (tab: NavTab) => {
    onSelectTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  const handleSelectPokja = (id: string | null) => {
    onSelectPokja(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Shell */}
      <aside
        className={`fixed lg:static top-0 left-0 bottom-0 z-50 w-72 lg:w-64 min-w-[16rem] max-w-[18rem] lg:max-w-[16rem] shrink-0 bg-slate-900 text-slate-300 flex flex-col h-screen border-r border-slate-800 select-none overflow-x-hidden transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand & Hospital Banner */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src="/logo.png"
                alt="Logo RSUD Bintan Sehati"
                className="w-10 h-10 rounded-full object-contain bg-white/10 p-0.5 shadow-md flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h1 className="text-xs font-bold text-white tracking-wider uppercase truncate">
                  E-SEHATI
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-teal-400 font-mono tracking-wider uppercase truncate">
                    STARKES 2024 · RSUD BINTAN
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile Close Drawer Button */}
            {onCloseMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1.5 text-slate-400 hover:text-white lg:hidden rounded-xl hover:bg-slate-800 transition cursor-pointer"
                title="Tutup Menu"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

      {/* Main Navigation Menu */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 text-xs sidebar-scroll">
        {/* Core Navigation Items */}
        <div className="space-y-1">
          <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Menu Utama
          </div>

          {/* 1. Executive Dashboard */}
          <button
            onClick={() => handleSelectTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
              currentTab === 'dashboard'
                ? 'bg-teal-600 text-white shadow-glow-teal'
                : 'hover:bg-slate-800/80 text-slate-300'
            }`}
          >
            <LayoutDashboard className={`w-4 h-4 ${currentTab === 'dashboard' ? 'text-white' : 'text-teal-400'}`} />
            <span>Dashboard Eksekutif</span>
          </button>

          {/* 2. Repository Berkas Dokumen */}
          <button
            onClick={() => handleSelectTab('documents')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
              currentTab === 'documents'
                ? 'bg-teal-600 text-white shadow-glow-teal'
                : 'hover:bg-slate-800/80 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <FolderArchive className={`w-4 h-4 ${currentTab === 'documents' ? 'text-white' : 'text-cyan-400'}`} />
              <span>Repositori Berkas</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 font-mono font-medium">
              Semua
            </span>
          </button>

          {/* 3. Antrean Verifikasi (Khusus Verifikator & Superadmin) */}
          <button
            onClick={() => handleSelectTab('verification')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
              currentTab === 'verification'
                ? 'bg-teal-600 text-white shadow-glow-teal'
                : 'hover:bg-slate-800/80 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <CheckSquare className={`w-4 h-4 ${currentTab === 'verification' ? 'text-white' : 'text-amber-400'}`} />
              <span>Antrean Verifikasi</span>
            </div>
            {pendingReviewCount > 0 ? (
              <span className="text-[10px] px-2 py-0.5 rounded-lg bg-amber-500 text-white font-mono font-semibold shadow-xs">
                {pendingReviewCount}
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 font-mono font-medium">
                0
              </span>
            )}
          </button>

          {/* 4. Audit Trail */}
          <button
            onClick={() => handleSelectTab('audit')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
              currentTab === 'audit'
                ? 'bg-teal-600 text-white shadow-glow-teal'
                : 'hover:bg-slate-800/80 text-slate-300'
            }`}
          >
            <History className={`w-4 h-4 ${currentTab === 'audit' ? 'text-white' : 'text-slate-400'}`} />
            <span>Jejak Audit</span>
          </button>

          {/* 5. User Management (SUPERADMIN only) */}
          {user?.role === 'SUPERADMIN' && (
            <button
              onClick={() => handleSelectTab('users')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                currentTab === 'users'
                  ? 'bg-teal-600 text-white shadow-glow-teal'
                  : 'hover:bg-slate-800/80 text-slate-300'
              }`}
            >
              <Users className={`w-4 h-4 ${currentTab === 'users' ? 'text-white' : 'text-violet-400'}`} />
              <span>Manajemen Pengguna</span>
            </button>
          )}
        </div>

        {/* Instrumen 16 Pokja Section (Organized by Collapsible Groups) */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <div
            onClick={() => setPokjaExpanded(!pokjaExpanded)}
            className="px-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400 cursor-pointer hover:text-slate-200 transition"
          >
            <div className="flex items-center gap-2">
              <ClipboardList className="w-3.5 h-3.5 text-teal-400" />
              <span>Instrumen 16 Pokja</span>
            </div>
            {pokjaExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            )}
          </div>

          {pokjaExpanded && (
            <div className="space-y-2 pt-1">
              {groups.map((grp) => {
                const groupMeta = GROUP_CONFIG[grp];
                const groupPokjas = pokjas.filter((p) => p.kelompok === grp);
                const isGroupOpen = expandedGroup === grp;

                return (
                  <div key={grp} className="bg-slate-950/40 rounded-2xl border border-slate-800/60 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedGroup(isGroupOpen ? null : grp)}
                      className="w-full px-3.5 py-2.5 flex items-center justify-between text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-slate-800/50 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${groupMeta.dotColor}`} />
                        <span>{groupMeta.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[10px]">
                        <span>{groupPokjas.length}</span>
                        {isGroupOpen ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                      </div>
                    </button>

                    {isGroupOpen && (
                      <div className="px-2 pb-2 space-y-1">
                        {groupPokjas.map((pokja) => {
                          const isSelected = selectedPokjaId === pokja.id && currentTab === 'pokja';
                          const isAssigned = user?.assignedPokjaId === pokja.id;
                          const rate = pokja.stats.complianceRate;

                          return (
                            <button
                              key={pokja.id}
                              onClick={() => {
                                handleSelectTab('pokja');
                                handleSelectPokja(pokja.id);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all group cursor-pointer ${
                                isSelected
                                  ? 'bg-teal-600 text-white font-semibold shadow-xs'
                                  : 'hover:bg-slate-800 text-slate-300 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className={`font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded-lg ${
                                    isSelected
                                      ? 'bg-white/20 text-white'
                                      : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700'
                                  }`}
                                >
                                  {pokja.kode}
                                </span>
                                <span className="truncate text-xs font-normal">{pokja.nama}</span>
                              </div>

                              <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
                                {loadingPokjaId === pokja.id ? (
                                  <Loader2 className="w-3.5 h-3.5 text-teal-300 animate-spin" />
                                ) : (
                                  <>
                                    {isAssigned && (
                                      <span
                                        className="w-1.5 h-1.5 rounded-full bg-teal-400"
                                        title="Pokja Anda"
                                      />
                                    )}
                                    <span
                                      className={`text-[10px] font-mono font-semibold ${
                                        rate >= 80
                                          ? 'text-teal-400'
                                          : rate >= 40
                                          ? 'text-amber-400'
                                          : 'text-slate-500'
                                      }`}
                                    >
                                      {rate}%
                                    </span>
                                  </>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* User Session Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-teal-400 font-semibold flex items-center justify-center text-xs flex-shrink-0">
              {user?.nama.substring(0, 2).toUpperCase() || 'RS'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-slate-200 truncate">{user?.nama}</div>
              <div className="text-[10px] text-slate-400 font-medium truncate flex items-center gap-1">
                <span className="capitalize">{user?.role.toLowerCase()}</span>
                {user?.assignedPokja && (
                  <span className="text-teal-400 font-mono">({user.assignedPokja.kode})</span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            title="Keluar"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
      </aside>
    </>
  );
};
