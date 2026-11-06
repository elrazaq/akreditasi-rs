import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Silakan masukkan email dan kata sandi.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login gagal. Periksa kembali email dan kata sandi Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100/80">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-modal border border-slate-200/90 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 p-7 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-teal-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="inline-flex items-center justify-center mb-3.5">
            <img
              src="/logo.png"
              alt="Logo RSUD Bintan Sehati"
              className="w-16 h-16 rounded-full object-contain bg-white/10 p-1 shadow-lg ring-2 ring-white/20"
            />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-white">RSUD BINTAN</h1>
          <p className="text-[11px] uppercase tracking-wider text-teal-300/80 font-mono mt-1">
            Sistem Informasi Dokumentasi Akreditasi Rumah Sakit
          </p>
        </div>

        {/* Form Body */}
        <div className="p-7">
          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs shadow-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@rsudbintan.id"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Kata sandi akun"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-glow-teal disabled:opacity-50 mt-3"
            >
              {isSubmitting ? (
                <span>Memproses autentikasi...</span>
              ) : (
                <>
                  <span>Masuk ke Akun</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-slate-50/80 px-6 py-3 text-center border-t border-slate-100 text-[11px] text-slate-500 font-mono">
          STARKES Kemenkes RI | RSUD Bintan
        </div>
      </div>
    </div>
  );
};
