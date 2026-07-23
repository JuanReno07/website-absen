'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 0ms instant pre-hydration for logo to eliminate initial flash
  const [currentLogo, setCurrentLogo] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('ase_system_logo');
      if (cached) return cached;
    }
    return '/Logo/TRANSPARENT_ASERP_BLACK_SQUARE.png';
  });

  const [currentSystemName, setCurrentSystemName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('ase_system_name');
      if (cached) return cached;
    }
    return 'ASE Duty Attendance System';
  });

  useEffect(() => {
    fetch(`/api/auth/me?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          router.push('/dashboard');
        }
        if (data.settings) {
          if (data.settings.logo) {
            setCurrentLogo(data.settings.logo);
            if (typeof window !== 'undefined') {
              localStorage.setItem('ase_system_logo', data.settings.logo);
            }
          }
          if (data.settings.system_name) {
            setCurrentSystemName(data.settings.system_name);
            if (typeof window !== 'undefined') {
              localStorage.setItem('ase_system_name', data.settings.system_name);
            }
          }
        }
      })
      .catch(() => {});
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim()) {
      setErrorMsg('Username wajib diisi.');
      return;
    }
    if (!password) {
      setErrorMsg('Password wajib diisi.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Terjadi kesalahan saat login.');
        setLoading(false);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setErrorMsg('Gagal terhubung ke server. Periksa koneksi Anda.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* High Contrast Background Ornaments */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Logo Banner Header with Spinning Neon Ring */}
        <div className="text-center space-y-3">
          <div className="inline-block relative p-[3px] rounded-3xl bg-gradient-to-r from-red-600 via-amber-400 to-red-600 shadow-2xl shadow-red-600/40 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-amber-400 to-red-700 animate-spin-slow opacity-90"></div>
            
            <div className="relative p-4 rounded-[22px] bg-gradient-to-b from-slate-100 via-slate-200 to-slate-300 border-2 border-slate-300 flex items-center justify-center max-w-[260px]">
              <img
                src={currentLogo}
                alt="ASE Roleplay Logo"
                className="w-full h-auto max-h-24 object-contain animate-logo-3d drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/Logo/TRANSPARENT_ASERP_BLACK_SQUARE.png';
                }}
              />
            </div>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">
              {currentSystemName}
            </h1>
            <p className="text-xs text-brand-400 font-bold tracking-widest uppercase mt-1">
              ASE ROLEPLAY &bull; ASE GROUP
            </p>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {errorMsg && (
            <div className="p-4 bg-red-950/70 border border-red-800/80 rounded-2xl flex items-start gap-3 text-red-300 text-xs sm:text-sm animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username Anda"
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password Anda"
                  className="w-full pl-11 pr-11 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Show Password Option */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-300">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="rounded border-slate-700 text-brand-600 focus:ring-brand-500 bg-slate-900"
                />
                <span>Tampilkan Password</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-brand-600 to-red-700 hover:from-brand-500 hover:to-red-600 text-white font-bold rounded-xl shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>MASUK SEKARANG</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-500">
          &copy; 2026 ASE ROLEPLAY &bull; ASE GROUP. All rights reserved.
        </p>
      </div>
    </main>
  );
}
