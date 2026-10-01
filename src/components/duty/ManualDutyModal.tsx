'use client';

import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, Upload, CheckCircle2, AlertCircle, Sparkles, Loader2, Image as ImageIcon } from 'lucide-react';
import ClipboardUploadArea from './ClipboardUploadArea';
import { formatDurationMinutes } from '@/lib/utils';

interface ManualDutyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ManualDutyModal({ isOpen, onClose, onSuccess }: ManualDutyModalProps) {
  // Default: Today at 08:00 to 11:00
  const now = new Date();
  const formatInputDateTime = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const defaultIn = new Date(now);
  defaultIn.setHours(8, 0, 0, 0);

  const defaultOut = new Date(now);
  defaultOut.setHours(11, 0, 0, 0);

  const [inTime, setInTime] = useState<string>(formatInputDateTime(defaultIn));
  const [outTime, setOutTime] = useState<string>(formatInputDateTime(defaultOut));
  const [userNote, setUserNote] = useState<string>('Patroli & Pengamanan Rutin');
  const [screenshotIn, setScreenshotIn] = useState<string | null>(null);
  const [screenshotOut, setScreenshotOut] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Calculate live duration
  let durationMinutes = 0;
  if (inTime && outTime) {
    const dIn = new Date(inTime).getTime();
    const dOut = new Date(outTime).getTime();
    if (dOut > dIn) {
      durationMinutes = Math.round((dOut - dIn) / (1000 * 60));
    }
  }

  const isTargetAchieved = durationMinutes >= 180;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!inTime || !outTime) {
      setErrorMsg('Waktu masuk (IN) dan keluar (OUT) wajib diisi.');
      return;
    }

    const dIn = new Date(inTime).getTime();
    const dOut = new Date(outTime).getTime();

    if (dOut <= dIn) {
      setErrorMsg('Waktu keluar (OUT) harus lebih besar daripada waktu masuk (IN).');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/duty/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duty_in_time: new Date(inTime).toISOString(),
          duty_out_time: new Date(outTime).toISOString(),
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

      setSuccessMsg('Absensi manual berhasil disimpan ke database!');
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1200);
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
                Input Absen Manual & Backdate
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-950 text-brand-400 border border-brand-500/40">
                  Akses Khusus ASE Juan
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Bebas input jam masuk dan keluar di tanggal mana pun (termasuk tanggal lampau).
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
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" /> Waktu Masuk (Duty IN):
              </label>
              <input
                type="datetime-local"
                value={inTime}
                onChange={(e) => setInTime(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-xs font-medium [color-scheme:dark] focus:outline-none focus:border-brand-500"
              />
              <p className="text-[10px] text-slate-500">Bisa pilih tanggal kapan saja di masa lalu.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-rose-400" /> Waktu Keluar (Duty OUT):
              </label>
              <input
                type="datetime-local"
                value={outTime}
                onChange={(e) => setOutTime(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-xs font-medium [color-scheme:dark] focus:outline-none focus:border-brand-500"
              />
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
            <label className="text-xs font-bold text-slate-300">Catatan Duty (Opsional):</label>
            <input
              type="text"
              value={userNote}
              onChange={(e) => setUserNote(e.target.value)}
              placeholder="Contoh: Patroli kota, pengamanan event, dll..."
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
              <span>SIMPAN ABSENSI MANUAL</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
