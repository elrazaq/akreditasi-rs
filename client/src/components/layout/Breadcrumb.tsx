import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbProps {
  pokjaKode?: string;
  standarKode?: string;
  epKode?: string;
  onNavigateHome: () => void;
  onNavigatePokja?: () => void;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  pokjaKode,
  standarKode,
  epKode,
  onNavigateHome,
  onNavigatePokja,
}) => {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-4 select-none">
      <button
        onClick={onNavigateHome}
        className="flex items-center gap-1 hover:text-navy-900 transition font-medium"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Ringkasan Pokja</span>
      </button>

      {pokjaKode && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <button
            onClick={onNavigatePokja || onNavigateHome}
            className={`font-semibold hover:text-navy-900 transition ${
              !epKode ? 'text-hospital-600' : 'text-slate-600'
            }`}
          >
            Pokja {pokjaKode}
          </button>
        </>
      )}

      {standarKode && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-600 font-medium">{standarKode}</span>
        </>
      )}

      {epKode && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-hospital-700 font-bold px-1.5 py-0.5 rounded bg-sky-50 border border-sky-200">
            {epKode}
          </span>
        </>
      )}
    </nav>
  );
};

