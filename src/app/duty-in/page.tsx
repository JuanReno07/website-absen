'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import ClipboardUploadArea from '@/components/duty/ClipboardUploadArea';
import { Clock, Play, ArrowLeft, AlertCircle, CheckCircle2, Shield } from 'lucide-react';
import { formatIndonesianDate, formatIndonesianTime } from '@/lib/utils';

export default function DutyInPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeDuty, setActiveDuty] = useState<any>(null);
  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);
  const [userNote, setUserNote] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated) {
          router.push('/login');
          return;
        }
        setUser(data.user);
        setSettings(data.settings);

        fetch('/api/duty/active')
          .then((r) => r.json())
          .then((d) => {
            if (d.activeDuty) {
              setActiveDuty(d.activeDuty);
            }
            setLoading(false);
          });
      })
      .catch(() => setLoading(false));
  }, [router]);

  const handleSubmitDutyIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (settings?.require_duty_in_screenshot && !screenshotBase64) {
      setErrorMsg('Bukti screenshot Duty IN wajib diunggah.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/duty/in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          screenshot_base64: screenshotBase64,
          user_note: userNote,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Gagal memulai duty.');
        setSubmitting(false);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setErrorMsg('Terjadi kesalahan koneksi.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (activeDuty) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950">
        <Navbar user={user} activeDuty={activeDuty} />
        <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 flex items-center justify-center">
          <div className="glass-card rounded-3xl p-6 sm:p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-400 mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">Anda Masih Memiliki Duty Aktif</h2>
            <p className="text-xs text-slate-400">
              Satu akun hanya boleh memiliki satu duty aktif secara bersamaan. Selesaikan duty terlebih dahulu sebelum memulai duty baru.
            </p>
            <button
              onClick={() => router.push('/duty-out')}
              className="px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
            >
              KE HALAMAN DUTY OUT &rarr;
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar user={user} activeDuty={null} />

      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Batal & Kembali
          </button>
          <span className="text-xs font-bold text-brand-400 tracking-wider uppercase">
            Formulir Duty IN
          </span>
        </div>

        <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-4 pb-4 border-b border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-brand-600/20 border border-brand-500/40 flex items-center justify-center text-brand-400">
              <Play className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-100">Konfirmasi Mulai Duty (Duty IN)</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Identitas dan waktu server akan dicatat secara otomatis oleh sistem.
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-4 bg-red-950/70 border border-red-800/80 rounded-2xl flex items-center gap-3 text-red-300 text-xs">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Auto-detected identity summary info box */}
          <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Nama Discord</span>
              <span className="text-slate-100 font-bold truncate block">{user?.discord_name}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Jabatan</span>
              <span className="text-brand-400 font-bold truncate block">{user?.position_name}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Nama OOC</span>
              <span className="text-slate-200 truncate block">{user?.ooc_name}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Waktu Server</span>
              <span className="text-emerald-400 font-mono font-bold block">
                {formatIndonesianTime(new Date())}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmitDutyIn} className="space-y-6">
            {/* Screenshot proof upload area */}
            <ClipboardUploadArea
              onImageSelected={(img) => setScreenshotBase64(img)}
              label="Unggah Bukti Screenshot Duty IN"
              required={settings?.require_duty_in_screenshot ?? true}
            />

            {/* User Notes Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase">
                Catatan / Keterangan Duty (Opsional)
              </label>
              <textarea
                value={userNote}
                onChange={(e) => setUserNote(e.target.value)}
                placeholder="misal: Patroli rutin wilayah pusat city..."
                rows={2}
                className="w-full p-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Confirm button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-gradient-to-r from-brand-600 to-red-700 hover:from-brand-500 hover:to-red-600 text-white font-extrabold rounded-2xl shadow-xl shadow-brand-600/30 flex items-center justify-center gap-2 text-base transition-all disabled:opacity-50"
            >
              {submitting ? (
                <span>Memulai Duty...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>KONFIRMASI DUTY IN SEKARANG</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
