'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { User, Lock, Save, KeyRound, CheckCircle2, AlertCircle, Shield, Hash, ArrowLeft } from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [discordName, setDiscordName] = useState('');
  const [oocName, setOocName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetch(`/api/auth/me?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated) {
          window.location.href = '/login';
          return;
        }
        if (data.user) {
          setUser(data.user);
          setDiscordName(data.user.discord_name || '');
          setOocName(data.user.ooc_name || '');
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi password baru tidak cocok.');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discord_name: discordName,
          ooc_name: oocName,
          current_password: currentPassword || undefined,
          new_password: newPassword || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Gagal memperbarui profil.');
        setSaving(false);
        return;
      }

      setSuccessMsg('Data profil berhasil diperbarui.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setErrorMsg('Terjadi kesalahan koneksi.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar user={user} activeDuty={null} />

      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <User className="w-6 h-6 text-brand-400" />
            Pengaturan Profil Saya
          </h1>
          <span className="text-xs font-mono font-bold text-brand-400 uppercase">
            ID: #{user?.id?.slice(-6)}
          </span>
        </div>

        <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
          {errorMsg && (
            <div className="p-4 bg-red-950/70 border border-red-800/80 rounded-2xl flex items-center gap-3 text-red-300 text-xs">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-emerald-950/70 border border-emerald-800/80 rounded-2xl flex items-center gap-3 text-emerald-300 text-xs">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            {/* Locked System Data Info */}
            <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Identitas Terkunci Sistem (Read-Only):
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">Username</span>
                  <span className="font-bold text-slate-200">{user?.username}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Jabatan Organisasi</span>
                  <span className="font-bold text-brand-400">{user?.position_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Steam Hex (Unik)</span>
                  <span className="font-mono font-bold text-slate-300">{user?.steam_hex}</span>
                </div>
              </div>
            </div>

            {/* Editable Info Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase">Nama Discord</label>
                <input
                  type="text"
                  value={discordName}
                  onChange={(e) => setDiscordName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:border-brand-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase">Nama OOC</label>
                <input
                  type="text"
                  value={oocName}
                  onChange={(e) => setOocName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:border-brand-500"
                />
              </div>
            </div>

            {/* Change Password Section */}
            <div className="pt-4 border-t border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-brand-400" />
                Ganti Password Akun
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-400">Password Lama</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Isi jika ingin ubah"
                    className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-slate-100 focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-400">Password Baru</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-slate-100 focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-400">Ulangi Password Baru</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Samakan password baru"
                    className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-slate-100 focus:border-brand-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Menyimpan Profil...' : 'SIMPAN PERUBAHAN PROFIL'}</span>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
