import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginForm } from './components/auth/LoginForm';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { Breadcrumb } from './components/layout/Breadcrumb';
import { ExecutiveDashboard } from './components/dashboard/ExecutiveDashboard';
import { PokjaDetailView } from './components/pokja/PokjaDetailView';
import { EPWorkspace } from './components/ep/EPWorkspace';
import { DocumentRepository } from './components/documents/DocumentRepository';
import { VerificationQueue } from './components/verification/VerificationQueue';
import { AuditTrailView } from './components/audit/AuditTrailView';
import { UserManagement } from './components/admin/UserManagement';
import { TopLoadingBar } from './components/layout/TopLoadingBar';
import { api } from './api/client';
import { PokjaSummary, PokjaDetail, ElemenPenilaian, NavTab } from './types';
import { Loader2 } from 'lucide-react';

function parseHashRoute(): { tab: NavTab; pokja: string | null; ep: string | null } {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const params = new URLSearchParams(hash);
  const tabParam = params.get('tab') as NavTab | null;
  const validTabs: NavTab[] = ['dashboard', 'pokja', 'documents', 'verification', 'audit', 'users'];
  const tab: NavTab = tabParam && validTabs.includes(tabParam) ? tabParam : 'dashboard';

  return {
    tab,
    pokja: params.get('pokja'),
    ep: params.get('ep'),
  };
}

export const App: React.FC = () => {
  const { user, token, isLoading: authLoading } = useAuth();

  const [currentTab, setCurrentTab] = useState<NavTab>(() => parseHashRoute().tab);
  const [pokjas, setPokjas] = useState<PokjaSummary[]>([]);
  const [loadingPokjas, setLoadingPokjas] = useState(false);
  const [selectedPokjaId, setSelectedPokjaId] = useState<string | null>(() => parseHashRoute().pokja);
  const [pokjaDetail, setPokjaDetail] = useState<PokjaDetail | null>(null);
  const [loadingPokjaDetail, setLoadingPokjaDetail] = useState(false);
  const [selectedEPId, setSelectedEPId] = useState<string | null>(() => parseHashRoute().ep);
  const [epDetail, setEPDetail] = useState<ElemenPenilaian | null>(null);
  const [loadingEPDetail, setLoadingEPDetail] = useState(false);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Sync route into window.location.hash
  const setRoute = useCallback(
    (tab: NavTab, pokjaId: string | null, epId: string | null) => {
      api.startLoading();
      setCurrentTab(tab);
      setSelectedPokjaId(pokjaId);
      setSelectedEPId(epId);

      const params = new URLSearchParams();
      params.set('tab', tab);
      if (pokjaId) params.set('pokja', pokjaId);
      if (epId) params.set('ep', epId);

      const hashString = params.toString();
      const newHash = hashString ? `#${hashString}` : '#';
      if (window.location.hash !== newHash) {
        window.history.pushState(null, '', newHash);
      }
      setTimeout(() => api.stopLoading(), 250);
    },
    []
  );

  // Listen to browser Back / Forward buttons
  useEffect(() => {
    const handleHashChange = () => {
      const { tab, pokja, ep } = parseHashRoute();
      setCurrentTab(tab);
      setSelectedPokjaId(pokja);
      setSelectedEPId(ep);
    };

    window.addEventListener('popstate', handleHashChange);
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('popstate', handleHashChange);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Load 16 Pokjas summary
  useEffect(() => {
    if (!token) return;

    let mounted = true;
    setLoadingPokjas(true);

    api
      .getPokjas()
      .then((res) => {
        if (mounted) setPokjas(res.pokjas);
      })
      .catch((err) => console.error('Gagal mengambil daftar Pokja:', err))
      .finally(() => {
        if (mounted) setLoadingPokjas(false);
      });

    return () => {
      mounted = false;
    };
  }, [token, refreshIndex]);

  // Load Pokja detail when selected
  useEffect(() => {
    if (!selectedPokjaId) {
      setPokjaDetail(null);
      setLoadingPokjaDetail(false);
      return;
    }

    let mounted = true;
    setLoadingPokjaDetail(true);

    api
      .getPokjaDetail(selectedPokjaId)
      .then((res) => {
        if (mounted) {
          setPokjaDetail(res.pokja);
          setLoadingPokjaDetail(false);
        }
      })
      .catch((err) => {
        console.error('Gagal memuat detail Pokja:', err);
        if (mounted) setLoadingPokjaDetail(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedPokjaId, refreshIndex]);

  // Load EP detail when selected
  useEffect(() => {
    if (!selectedEPId) {
      setEPDetail(null);
      setLoadingEPDetail(false);
      return;
    }

    let mounted = true;
    setLoadingEPDetail(true);

    api
      .getEPDetail(selectedEPId)
      .then((res) => {
        if (mounted) {
          setEPDetail(res.ep);
          setLoadingEPDetail(false);
        }
      })
      .catch((err) => {
        console.error('Gagal memuat detail EP:', err);
        if (mounted) setLoadingEPDetail(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedEPId, refreshIndex]);

  const triggerRefresh = () => {
    api.clearCache();
    setRefreshIndex((prev) => prev + 1);
  };

  const pendingReviewCount = pokjas.reduce((sum, p) => sum + p.stats.submitted, 0);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-hospital-600 animate-spin" />
          <span className="text-xs font-semibold text-slate-500">
            Memuat Portal Akreditasi RSUD Bintan...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <TopLoadingBar />
        <LoginForm />
      </>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <TopLoadingBar />
      {/* Redesigned Clean Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setRoute(tab, null, null)}
        pokjas={pokjas}
        selectedPokjaId={selectedPokjaId}
        loadingPokjaId={loadingPokjaDetail ? selectedPokjaId : null}
        onSelectPokja={(id) => {
          if (id) {
            setRoute('pokja', id, null);
          } else {
            setRoute('dashboard', null, null);
          }
        }}
        pendingReviewCount={pendingReviewCount}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Workspace Shell */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Topbar
          onSelectPokja={(id) => setRoute('pokja', id, null)}
          onSelectEP={(pokjaId, epId) => setRoute('pokja', pokjaId, epId)}
          onRefreshAll={triggerRefresh}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        />

        {/* Workspace Body */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb Navigation */}
            <Breadcrumb
              pokjaKode={pokjaDetail?.kode}
              standarKode={epDetail?.standar?.kode}
              epKode={epDetail?.kode}
              onNavigateHome={() => setRoute('dashboard', null, null)}
              onNavigatePokja={() => setRoute('pokja', selectedPokjaId, null)}
            />

            {/* Dynamic View Switcher */}
            {loadingPokjas && pokjas.length === 0 ? (
              <div className="p-16 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs">
                <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-slate-800">Sinkronisasi Instrumen STARKES 2024...</h3>
                <p className="text-xs text-slate-400 mt-1">Mengambil 16 Pokja Akreditasi RSUD Bintan</p>
              </div>
            ) : selectedEPId ? (
              loadingEPDetail || !epDetail || epDetail.id !== selectedEPId ? (
                <div className="p-16 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs animate-pulse">
                  <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-slate-800">Memuat Ruang Kerja Elemen Penilaian...</h3>
                  <p className="text-xs text-slate-400 mt-1">Mengambil berkas regulasi dan bukti akreditasi</p>
                </div>
              ) : (
                <EPWorkspace
                  ep={epDetail}
                  onBack={() => setRoute('pokja', selectedPokjaId, null)}
                  onRefresh={triggerRefresh}
                />
              )
            ) : currentTab === 'pokja' && selectedPokjaId ? (
              loadingPokjaDetail || !pokjaDetail || pokjaDetail.id !== selectedPokjaId ? (
                <div className="p-16 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs animate-pulse">
                  <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-slate-800">Memuat Instrumen Pokja...</h3>
                  <p className="text-xs text-slate-400 mt-1">Mengambil seluruh standar dan elemen penilaian</p>
                </div>
              ) : (
                <PokjaDetailView
                  pokja={pokjaDetail}
                  onSelectEP={(epId) => setRoute('pokja', selectedPokjaId, epId)}
                  selectedEPId={selectedEPId}
                  loadingEPId={loadingEPDetail ? selectedEPId : null}
                />
              )
            ) : currentTab === 'documents' ? (
              <DocumentRepository
                pokjas={pokjas}
                onSelectDocumentEP={(pId, epId) => setRoute('pokja', pId, epId)}
              />
            ) : currentTab === 'verification' ? (
              <VerificationQueue onDocumentReviewed={triggerRefresh} />
            ) : currentTab === 'audit' ? (
              <AuditTrailView />
            ) : currentTab === 'users' && user ? (
              <UserManagement currentUser={user} />
            ) : (
              <ExecutiveDashboard
                pokjas={pokjas}
                onSelectPokja={(id) => setRoute('pokja', id, null)}
                onGoToVerification={() => setRoute('verification', null, null)}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
