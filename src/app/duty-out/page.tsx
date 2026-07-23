'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import ClipboardUploadArea from '@/components/duty/ClipboardUploadArea';
import DutyTimer from '@/components/duty/DutyTimer';
import ScreenshotModal from '@/components/duty/ScreenshotModal';
import { Square, ArrowLeft, AlertCircle, CheckCircle2, Clock, ExternalLink } from 'lucide-react';
import { formatIndonesianTime, formatDurationMinutes, calculateDurationInMinutes } from '@/lib/utils';

export default function DutyOutPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeDuty, setActiveDuty] = useState<any>(null);
  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);
  const [userNote, setUserNote] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [settings, setSettings] = useState<any>(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

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

  const handleSubmitDutyOut = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (settings?.require_duty_out_screenshot && !screenshotBase64) {
      setErrorMsg('Bukti screenshot Duty OUT wajib diunggah.');
      return;
    }

    const confirmFinish = window.confirm('Anda yakin ingin menyelesaikan duty saat ini?');
    if (!confirmFinish) return;

    setSubmitting(true);

    try {
      const res = await fetch('/api/duty/out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          screenshot_base64: screenshotBase64,
          user_note: userNote,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Gagal menyelesaikan duty.');
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

  if (!activeDuty) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950">
        <Navbar user={user} activeDuty={null} />
        <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 flex items-center justify-center">
          <div className="glass-card rounded-3xl p-6 sm:p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-950/80 border border-red-500/50 flex items-center justify-center text-red-400 mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">Anda Belum Memiliki Duty Aktif</h2>
            <p className="text-xs text-slate-400">
              Anda tidak dapat melakukan Duty OUT karena belum memulai Duty IN.
            </p>
            <button
              onClick={() => router.push('/duty-in')}
              className="px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
            >
              MULAI DUTY IN SEKARANG &rarr;
            </button>
          </div>
        </main>
      </div>
    );
  }

  const currentDurationMinutes = calculateDurationInMinutes(
    new Date(activeDuty.duty_in_time),
    new Date()
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar user={user} activeDuty={activeDuty} />

      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Dashboard
          </button>
          <span className="text-xs font-bold text-red-400 tracking-wider uppercase">
            Formulir Duty OUT
          </span>
        </div>

        <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 border border-red-500/30">
          <div className="flex items-center gap-4 pb-4 border-b border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <Square className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-100">Selesaikan Duty (Duty OUT)</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Konfirmasi penyelesaian jam kerja duty Anda.
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-4 bg-red-950/70 border border-red-800/80 rounded-2xl flex items-center gap-3 text-red-300 text-xs">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Active Duty Live Ticker */}
          <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-3">
            <DutyTimer startTime={activeDuty.duty_in_time} />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-3 border-t border-slate-800">
              <div>
                <span className="text-slate-400 block text-[10px]">Waktu Duty IN:</span>
                <span className="text-slate-100 font-bold font-mono">
                  {formatIndonesianTime(activeDuty.duty_in_time)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Waktu Selesai (Estimasi):</span>
                <span className="text-slate-100 font-bold font-mono">
                  {formatIndonesianTime(new Date())}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-slate-400 block text-[10px]">Estimasi Durasi Total:</span>
                <span className="text-emerald-400 font-bold font-mono">
                  {formatDurationMinutes(currentDurationMinutes)}
                </span>
              </div>
            </div>

            {activeDuty.duty_in_screenshot && (
              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="text-slate-400">Screenshot Duty IN:</span>
                <button
                  type="button"
                  onClick={() => setSelectedScreenshot(activeDuty.duty_in_screenshot)}
                  className="text-brand-400 hover:text-brand-300 font-bold flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Lihat Bukti Awal
                </button>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmitDutyOut} className="space-y-6">
            {/* End Screenshot Proof Upload */}
            <ClipboardUploadArea
              onImageSelected={(img) => setScreenshotBase64(img)}
              label="Unggah Bukti Screenshot Duty OUT"
              required={settings?.require_duty_out_screenshot ?? true}
            />

            {/* Optional note */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase">
                Catatan Selesai Duty (Opsional)
              </label>
              <textarea
                value={userNote}
                onChange={(e) => setUserNote(e.target.value)}
                placeholder="Catatan hasil penanganan duty / penutupan..."
                rows={2}
                className="w-full p-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Confirm button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-gradient-to-r from-red-600 to-brand-700 hover:from-red-500 hover:to-brand-600 text-white font-extrabold rounded-2xl shadow-xl shadow-red-600/30 flex items-center justify-center gap-2 text-base transition-all disabled:opacity-50"
            >
              {submitting ? (
                <span>Menyelesaikan Duty...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>KONFIRMASI DUTY OUT SEKARANG</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      <ScreenshotModal
        isOpen={!!selectedScreenshot}
        imageUrl={selectedScreenshot}
        onClose={() => setSelectedScreenshot(null)}
      />
    </div>
  );
}
