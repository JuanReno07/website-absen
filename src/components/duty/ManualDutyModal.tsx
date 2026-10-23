'use client';

import React, { useState } from 'react';
import { X, Clock, AlertCircle, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import ClipboardUploadArea from './ClipboardUploadArea';
import { formatDurationMinutes } from '@/lib/utils';
import DatePickerDMY, { formatDMY } from '@/components/ui/DatePickerDMY';

interface ManualDutyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  isAdminOrJuan?: boolean;
}

export default function ManualDutyModal({ isOpen, onClose, onSuccess, isAdminOrJuan = false }: ManualDutyModalProps) {
  const getTodayDateStr = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const [inDate, setInDate] = useState<string>(getTodayDateStr());
  const [inClock, setInClock] = useState<string>('08:00');
  const [outDate, setOutDate] = useState<string>(getTodayDateStr());
  const [outClock, setOutClock] = useState<string>('11:00');

  const [userNote, setUserNote] = useState<string>(isAdminOrJuan ? 'Patroli & Pengamanan Rutin' : '');
  const [screenshotIn, setScreenshotIn] = useState<string | null>(null);
  const [screenshotOut, setScreenshotOut] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Helper to build Date object from YYYY-MM-DD and HH:mm
  const buildDateTime = (dateStr: string, clockStr: string): Date | null => {
    if (!dateStr || !clockStr) return null;
    const d = new Date(`${dateStr}T${clockStr}:00`);
    return isNaN(d.getTime()) ? null : d;
  };

  const dIn = buildDateTime(inDate, inClock);
  const dOut = buildDateTime(outDate, outClock);

  // Calculate live duration
  let durationMinutes = 0;
  if (dIn && dOut && dOut.getTime() > dIn.getTime()) {
    durationMinutes = Math.round((dOut.getTime() - dIn.getTime()) / (1000 * 60));
  }

  const isTargetAchieved = durationMinutes >= 180;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!dIn || !dOut) {
      setErrorMsg('Tanggal dan waktu masuk (IN) serta keluar (OUT) wajib diisi.');
      return;
    }

    if (dOut.getTime() <= dIn.getTime()) {
      setErrorMsg('Waktu keluar (OUT) harus lebih besar daripada waktu masuk (IN).');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/duty/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duty_in_time: dIn.toISOString(),
          duty_out_time: dOut.toISOString(),
          screenshot_in_base64: screenshotIn,
          screenshot_out_base64: screenshotOut,
          user_note: userNote,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Gagal menyimpan absensi manual.');
        setLoading(false);
        return;
      }

      setSuccessMsg(data.message || (isAdminOrJuan ? 'Absensi manual berhasil disimpan ke database!' : 'Pengajuan absen manual berhasil dikirim dan menunggu persetujuan Admin.'));
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan koneksi.');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-brand-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-brand-950 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-600/20 border border-brand-500/40 flex items-center justify-center text-brand-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-100 flex items-center gap-2">
                {isAdminOrJuan ? 'Input Absen Manual & Backdate' : 'Pengajuan Absen Manual'}
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                  isAdminOrJuan
                    ? 'bg-brand-950 text-brand-400 border-brand-500/40'
                    : 'bg-amber-950 text-amber-400 border-amber-500/40'
                }`}>
                  {isAdminOrJuan ? 'Akses Khusus Admin' : 'Perlu Approval Admin'}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAdminOrJuan
                  ? 'Bebas input jam masuk dan keluar di tanggal mana pun (langsung disetujui).'
                  : 'Gunakan jika mengalami kendala sistem/game crash. Pengajuan akan diverifikasi oleh Admin.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Date & Time Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Duty IN Section */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-emerald-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Waktu Masuk (Duty IN)
                </label>
                <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                  {formatDMY(inDate)} • {inClock} WIB
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block mb-1">
                    Tanggal (DD/MM/YYYY):
                  </span>
                  <DatePickerDMY
                    value={inDate}
                    onChange={(val) => {
                      setInDate(val);
                      if (outDate < val) setOutDate(val);
                    }}
                  />
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block mb-1">
                    Jam Masuk (Format 24 Jam):
                  </span>
                  <input
                    type="time"
                    value={inClock}
                    onChange={(e) => setInClock(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 hover:border-brand-500 rounded-xl text-slate-100 text-xs sm:text-sm font-mono font-medium [color-scheme:dark] focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-500">Bisa pilih tanggal kapan saja di masa lalu.</p>
            </div>

            {/* Duty OUT Section */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-rose-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Waktu Keluar (Duty OUT)
                </label>
                <span className="text-[10px] text-rose-400 font-mono font-bold bg-rose-950/80 px-2 py-0.5 rounded border border-rose-500/30">
                  {formatDMY(outDate)} • {outClock} WIB
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block mb-1">
                    Tanggal (DD/MM/YYYY):
                  </span>
                  <DatePickerDMY
                    value={outDate}
                    min={inDate}
                    onChange={(val) => setOutDate(val)}
                  />
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block mb-1">
                    Jam Keluar (Format 24 Jam):
                  </span>
                  <input
                    type="time"
                    value={outClock}
                    onChange={(e) => setOutClock(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 hover:border-brand-500 rounded-xl text-slate-100 text-xs sm:text-sm font-mono font-medium [color-scheme:dark] focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-500">Wajib lebih besar daripada waktu Duty IN.</p>
            </div>
          </div>

          {/* Calculated Live Duration Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Kalkulasi Durasi Sesi:
              </span>
              <p className="text-base font-extrabold text-slate-100 font-mono">
                {formatDurationMinutes(durationMinutes)}
              </p>
            </div>

            <div className="text-right">
              {durationMinutes > 0 ? (
                isTargetAchieved ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Target 3 Jam Terpenuhi
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950 text-amber-400 border border-amber-500/40">
                    <AlertCircle className="w-3.5 h-3.5" /> Di Bawah 3 Jam
                  </span>
                )
              ) : (
                <span className="text-xs text-rose-400 font-bold">Waktu tidak valid</span>
              )}
            </div>
          </div>

          {/* Screenshot Upload Areas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Bukti Screenshot Duty IN:
              </label>
              <ClipboardUploadArea
                onImageSelected={setScreenshotIn}
                label="Screenshot Masuk (IN)"
                required={false}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Bukti Screenshot Duty OUT:
              </label>
              <ClipboardUploadArea
                onImageSelected={setScreenshotOut}
                label="Screenshot Keluar (OUT)"
                required={false}
              />
            </div>
          </div>

          {/* User Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>{isAdminOrJuan ? 'Catatan Duty (Opsional):' : 'Alasan Pengajuan (Wajib):'}</span>
              {!isAdminOrJuan && <span className="text-[10px] text-amber-400 font-normal">*Wajib dijelaskan ke Admin</span>}
            </label>
            <input
              type="text"
              value={userNote}
              onChange={(e) => setUserNote(e.target.value)}
              required={!isAdminOrJuan}
              placeholder={isAdminOrJuan ? "Contoh: Patroli kota, pengamanan event, dll..." : "Contoh: Mengalami game crash saat patroli / lupa klik Duty OUT karena kendala jaringan..."}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={loading || durationMinutes <= 0}
              className="px-6 py-2.5 bg-gradient-to-r from-brand-600 to-red-600 hover:from-brand-500 hover:to-red-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-brand-600/30 flex items-center gap-2 transition-all"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isAdminOrJuan ? 'SIMPAN ABSENSI MANUAL' : 'KIRIM PENGAJUAN KE ADMIN'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
