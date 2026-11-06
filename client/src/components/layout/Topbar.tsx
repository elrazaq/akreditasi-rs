import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  LogOut,
  Shield,
  Award,
  User,
  RefreshCw,
  X,
  ChevronRight,
  FileCheck,
  Layers,
  Loader2,
  KeyRound,
  Menu,
} from 'lucide-react';
import { Role } from '../../types';
import { api } from '../../api/client';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';

interface SearchResult {
  pokjas: Array<{ id: string; kode: string; nama: string }>;
  eps: Array<{
    id: string;
    kode: string;
    deskripsi: string;
    standar: {
      id: string;
      kode: string;
      pokja: { id: string; kode: string; nama: string };
    };
  }>;
}

interface TopbarProps {
  onSelectPokja: (pokjaId: string) => void;
  onSelectEP: (pokjaId: string, epId: string) => void;
  onRefreshAll: () => void;
  onToggleMobileSidebar?: () => void;
}

const ROLE_BADGES: Record<Role, { label: string; badge: string; icon: any }> = {
  SUPERADMIN: {
    label: 'Super Admin',
    badge: 'bg-violet-50 text-violet-700 border-violet-200',
    icon: Shield,
  },
  VERIFIKATOR: {
    label: 'Verifikator Mutu',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: Award,
  },
  POKJA: {
    label: 'PIC Pokja',
    badge: 'bg-teal-50 text-teal-800 border-teal-200',
    icon: User,
  },
};

export const Topbar: React.FC<TopbarProps> = ({
  onSelectPokja,
  onSelectEP,
  onRefreshAll,
  onToggleMobileSidebar,
}) => {
  const { user, logout } = useAuth();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      api
        .search(trimmed)
        .then((res) => {
          setResults(res.results);
          setIsOpen(true);
        })
        .catch((err) => {
          console.error('Search error:', err);
          setResults(null);
        })
        .finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!user) return null;

  const roleMeta = ROLE_BADGES[user.role];

  const handleSelectPokja = (id: string) => {
    onSelectPokja(id);
    setIsOpen(false);
    setQuery('');
  };

  const handleSelectEP = (pokjaId: string, epId: string) => {
    onSelectEP(pokjaId, epId);
    setIsOpen(false);
    setQuery('');
  };

  const hasResults =
    results && (results.pokjas.length > 0 || results.eps.length > 0);

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-3 sm:px-6 flex items-center justify-between z-20 flex-shrink-0 select-none shadow-xs gap-2">
      {/* Left: Mobile Hamburger & Search Input */}
      <div className="flex items-center gap-1.5 sm:gap-3 flex-1 min-w-0 max-w-xl">
        {onToggleMobileSidebar && (
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="p-2 -ml-1 text-slate-600 hover:text-slate-900 lg:hidden rounded-xl hover:bg-slate-100 transition cursor-pointer flex-shrink-0"
            title="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div ref={searchContainerRef} className="relative flex-1 min-w-0 max-w-[180px] xs:max-w-[220px] sm:max-w-xs md:max-w-md">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value.trim().length >= 2) setIsOpen(true);
              }}
              onFocus={() => {
                if (query.trim().length >= 2) setIsOpen(true);
              }}
              placeholder="Cari Pokja / EP..."
              className="w-full pl-9 pr-8 sm:pr-9 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/20 transition-all truncate"
            />
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 text-teal-600 animate-spin absolute right-2.5 top-1/2 -translate-y-1/2" />
            ) : query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setResults(null);
                  setIsOpen(false);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>

          {/* Search Results Dropdown */}
          {isOpen && query.trim().length >= 2 && (
            <div className="absolute left-0 mt-2 w-[calc(100vw-24px)] max-w-[480px] bg-white rounded-2xl shadow-modal border border-slate-200/90 p-3 z-50 animate-in fade-in duration-100 max-h-[460px] overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                <span>Mencari dalam instrumen akreditasi...</span>
              </div>
            ) : !hasResults ? (
              <div className="p-6 text-center text-xs text-slate-500">
                Tidak ada Pokja atau Elemen Penilaian yang cocok dengan "{query}".
              </div>
            ) : (
              <div className="space-y-3">
                {/* Pokja Matches */}
                {results.pokjas.length > 0 && (
                  <div>
                    <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                      <Layers className="w-3 h-3 text-teal-600" />
                      <span>Kelompok Kerja (Pokja)</span>
                    </div>
                    <div className="space-y-1">
                      {results.pokjas.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectPokja(p.id)}
                          className="w-full text-left p-2.5 rounded-xl hover:bg-teal-50/60 transition-colors flex items-center justify-between group cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 flex-shrink-0">
                              {p.kode}
                            </span>
                            <span className="text-xs text-slate-800 font-medium truncate">
                              {p.nama}
                            </span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* EP Matches */}
                {results.eps.length > 0 && (
                  <div>
                    <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                      <FileCheck className="w-3 h-3 text-teal-600" />
                      <span>Elemen Penilaian (EP)</span>
                    </div>
                    <div className="space-y-1">
                      {results.eps.map((ep) => (
                        <button
                          key={ep.id}
                          type="button"
                          onClick={() => handleSelectEP(ep.standar.pokja.id, ep.id)}
                          className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-start justify-between gap-3 group cursor-pointer"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                                {ep.kode}
                              </span>
                              <span className="text-[11px] text-teal-700 font-medium">
                                Pokja {ep.standar.pokja.kode} / {ep.standar.kode}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                              {ep.deskripsi}
                            </p>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all mt-1" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      </div>

      {/* Right Controls: User Profile & Actions */}
      <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
        {/* User Identity Pill (Clean, without verbose name text) */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <div
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-teal-600 text-white font-semibold flex items-center justify-center text-[11px] sm:text-xs shadow-xs"
            title={user.nama}
          >
            {user.nama.substring(0, 2).toUpperCase()}
          </div>
          <span className={`text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-md border hidden xs:inline ${roleMeta.badge}`}>
            {user.role}
          </span>
        </div>

        {/* Change Password Button */}
        <button
          onClick={() => setIsChangePasswordOpen(true)}
          title="Ubah Kata Sandi Akun"
          className="p-1.5 sm:p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition cursor-pointer"
        >
          <KeyRound className="w-4 h-4" />
        </button>

        {/* Refresh Data Button */}
        <button
          onClick={onRefreshAll}
          title="Sinkronkan & Muat Ulang Data"
          className="p-1.5 sm:p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        <div className="h-4 sm:h-5 w-px bg-slate-200 hidden xs:block" />

        {/* Logout Button */}
        <button
          onClick={logout}
          title="Keluar dari Akun"
          className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Change Password Modal */}
      {isChangePasswordOpen && (
        <ChangePasswordModal onClose={() => setIsChangePasswordOpen(false)} />
      )}
    </header>
  );
};
