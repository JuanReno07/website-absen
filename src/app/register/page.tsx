'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Lock, ArrowLeft, CheckCircle, AlertCircle, Shield, Briefcase, Hash } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [positions, setPositions] = useState<any[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [discordName, setDiscordName] = useState('');
  const [positionId, setPositionId] = useState('');
  const [oocName, setOocName] = useState('');
  const [steamHex, setSteamHex] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetch('/api/admin/positions')
      .then((res) => res.json())
      .then((data) => {
        if (data.positions) {
          setPositions(data.positions);
          if (data.positions.length > 0) {
            setPositionId(data.positions[0].id);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!username || !password || !discordName || !positionId || !oocName || !steamHex) {
      setErrorMsg('Seluruh kolom formulir pendaftaran wajib diisi.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          discord_name: discordName,
          position_id: positionId,
          ooc_name: oocName,
          steam_hex: steamHex,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Pendaftaran gagal.');
        setLoading(false);
        return;
      }

      setSuccessMsg('Registrasi berhasil! Mengalihkan ke halaman login...');
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err) {
      setErrorMsg('Terjadi kesalahan jaringan.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 relative">
      <div className="w-full max-w-xl relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/login"
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Login
          </Link>
          <span className="text-xs font-bold text-brand-400 tracking-widest uppercase">
            Aktivasi Akun Anggota
          </span>
        </div>

        <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-100">Formulir Registrasi Anggota Baru</h2>
            <p className="text-xs text-slate-400 mt-1">
              Data identitas ini hanya perlu diisi 1x saat pendaftaran.
            </p>
          </div>

          {errorMsg && (
            <div className="p-4 bg-red-950/70 border border-red-800/80 rounded-2xl flex items-center gap-3 text-red-300 text-xs">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-emerald-950/70 border border-emerald-800/80 rounded-2xl flex items-center gap-3 text-emerald-300 text-xs">
              <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Username */}
            <div className="space-y-1.5 sm:col-span-1">
              <label className="block text-xs font-bold text-slate-300 uppercase">Username Login</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="misal: alexrider"
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:border-brand-500"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5 sm:col-span-1">
              <label className="block text-xs font-bold text-slate-300 uppercase">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Buat password unik"
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:border-brand-500"
              />
            </div>

            {/* Discord Name */}
            <div className="space-y-1.5 sm:col-span-1">
              <label className="block text-xs font-bold text-slate-300 uppercase">Nama Discord</label>
              <input
                type="text"
                value={discordName}
                onChange={(e) => setDiscordName(e.target.value)}
                placeholder="misal: AlexRider#1234"
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:border-brand-500"
              />
            </div>

            {/* Position */}
            <div className="space-y-1.5 sm:col-span-1">
              <label className="block text-xs font-bold text-slate-300 uppercase">Jabatan / Role</label>
              <select
                value={positionId}
                onChange={(e) => setPositionId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:border-brand-500"
              >
                {positions.map((pos) => (
                  <option key={pos.id} value={pos.id} className="bg-slate-900 text-slate-100">
                    {pos.name}
                  </option>
                ))}
              </select>
            </div>

            {/* OOC Name */}
            <div className="space-y-1.5 sm:col-span-1">
              <label className="block text-xs font-bold text-slate-300 uppercase">Nama OOC</label>
              <input
                type="text"
                value={oocName}
                onChange={(e) => setOocName(e.target.value)}
                placeholder="Nama asli / OOC Anda"
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:border-brand-500"
              />
            </div>

            {/* Steam Hex */}
            <div className="space-y-1.5 sm:col-span-1">
              <label className="block text-xs font-bold text-slate-300 uppercase">Steam Hex ID (Unik)</label>
              <input
                type="text"
                value={steamHex}
                onChange={(e) => setSteamHex(e.target.value)}
                placeholder="1100001xxxxxxxx"
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 font-mono placeholder-slate-500 focus:border-brand-500"
              />
            </div>

            <div className="sm:col-span-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg shadow-brand-600/30 transition-all text-sm"
              >
                {loading ? 'Memproses Pendaftaran...' : 'DAFTARKAN AKUN SAYA'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
