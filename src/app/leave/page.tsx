'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import ClipboardUploadArea from '@/components/duty/ClipboardUploadArea';
import ScreenshotModal from '@/components/duty/ScreenshotModal';
import { Calendar, FileText, Send, CheckCircle2, AlertCircle, Clock, ExternalLink } from 'lucide-react';
import { formatIndonesianDate, formatDateDMY } from '@/lib/utils';

export default function MemberLeavePage() {
  const [user, setUser] = useState<any>(null);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [leaveType, setLeaveType] = useState('Halangan OOC');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  const fetchLeaveRequests = async () => {
    setLoading(true);
    try {
      const authRes = await fetch('/api/auth/me');
      const authData = await authRes.json();
      if (!authData.authenticated) {
        window.location.href = '/login';
        return;
      }
      setUser(authData.user);

      const res = await fetch('/api/leave');
      if (res.ok) {
        const data = await res.json();
        setLeaveRequests(data.leaveRequests || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const [todayStr, setTodayStr] = useState('');

  useEffect(() => {
    // Current date in YYYY-MM-DD for min attribute
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    setTodayStr(`${y}-${m}-${d}`);
  }, []);

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!startDate || !endDate || !reason.trim()) {
      setErrorMsg('Seluruh kolom formulir pengajuan izin wajib diisi.');
      return;
    }

    if (todayStr && startDate < todayStr) {
      setErrorMsg('Tanggal mulai izin tidak boleh tanggal yang sudah lewat (backdate).');
      return;
    }

    if (endDate < startDate) {
      setErrorMsg('Tanggal selesai tidak boleh lebih awal dari tanggal mulai izin.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leave_type: leaveType,
          start_date: startDate,
          end_date: endDate,
          reason: reason,
          screenshot_base64: screenshotBase64,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Gagal mengirim pengajuan izin.');
        setSubmitting(false);
        return;
      }

      setSuccessMsg('Pengajuan izin berhasil dikirim. Menunggu persetujuan Admin.');
      setReason('');
      setScreenshotBase64(null);
      fetchLeaveRequests();
    } catch (err) {
      setErrorMsg('Terjadi kesalahan jaringan.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (st: string) => {
    if (st === 'DISETUJUI') {
      return (
        <span className="px-2.5 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full text-[10px] font-bold">
          DISETUJUI
        </span>
      );
    }
    if (st === 'DITOLAK') {
      return (
        <span className="px-2.5 py-1 bg-red-950 text-red-400 border border-red-800 rounded-full text-[10px] font-bold">
          DITOLAK
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 bg-amber-950 text-amber-400 border border-amber-800 rounded-full text-[10px] font-bold">
        MENUNGGU PERSETUJUAN
      </span>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar user={user} activeDuty={null} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-brand-400" />
            Pengajuan Izin & Off Duty Anggota
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Formulir pengajuan izin tidak bertugas (sakit, halangan OOC, cuti, dll).
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Submission Form Card */}
          <div className="glass-card rounded-3xl p-6 lg:col-span-1 space-y-4">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <FileText className="w-4 h-4 text-brand-400" />
              Formulir Izin Baru
            </h2>

            {errorMsg && (
              <div className="p-3 bg-red-950 border border-red-800 rounded-xl text-red-300 text-xs">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-950 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitLeave} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">Jenis Izin</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-bold"
                >
                  <option value="Halangan OOC">Halangan OOC</option>
                  <option value="Sakit">Sakit / Kesehatan</option>
                  <option value="Cuti Kerja">Cuti Kerja Organisasi</option>
                  <option value="Keperluan Keluarga">Keperluan Keluarga</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1 flex items-center justify-between">
                  <span>Tanggal Mulai</span>
                  <span className="text-[10px] text-brand-400 font-semibold tracking-wider">DD/MM/YYYY</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  min={todayStr || undefined}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    setStartDate(newStart);
                    if (endDate && newStart > endDate) {
                      setEndDate(newStart);
                    }
                  }}
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  required
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-medium cursor-pointer [color-scheme:dark] focus:outline-none focus:border-brand-500 transition-colors"
                />
                {startDate && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Format: <span className="text-emerald-400 font-bold">{formatDateDMY(startDate)}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1 flex items-center justify-between">
                  <span>Tanggal Selesai</span>
                  <span className="text-[10px] text-brand-400 font-semibold tracking-wider">DD/MM/YYYY</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || todayStr || undefined}
                  onChange={(e) => setEndDate(e.target.value)}
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  required
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-medium cursor-pointer [color-scheme:dark] focus:outline-none focus:border-brand-500 transition-colors"
                />
                {endDate && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Format: <span className="text-emerald-400 font-bold">{formatDateDMY(endDate)}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">Alasan / Keterangan</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  placeholder="Jelaskan alasan izin Anda..."
                  rows={3}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <ClipboardUploadArea
                  onImageSelected={(img) => setScreenshotBase64(img)}
                  label="Bukti / Lampiran (Opsional)"
                  required={false}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 text-xs transition-all"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'KIRIMKAN...' : 'KIRIM PERMOHONAN IZIN'}</span>
              </button>
            </form>
          </div>

          {/* Personal Leave History Table */}
          <div className="glass-card rounded-3xl p-6 lg:col-span-2 space-y-4">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Clock className="w-4 h-4 text-brand-400" />
              Riwayat Pengajuan Izin Saya
            </h2>

            {loading ? (
              <div className="py-12 flex justify-center">
                <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : leaveRequests.length === 0 ? (
              <p className="text-center py-8 text-slate-500 text-xs">Belum ada data pengajuan izin.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 uppercase text-[11px] font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-3.5 whitespace-nowrap">Jenis Izin</th>
                      <th className="p-3.5 whitespace-nowrap">Periode</th>
                      <th className="p-3.5 min-w-[200px]">Alasan</th>
                      <th className="p-3.5 text-center whitespace-nowrap">Status</th>
                      <th className="p-3.5 text-center whitespace-nowrap">Bukti</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {leaveRequests.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3.5 font-bold text-brand-400 whitespace-nowrap align-top">{l.leave_type}</td>
                        <td className="p-3.5 font-semibold text-xs text-slate-200 whitespace-nowrap align-top">
                          {formatDateDMY(l.start_date)} - {formatDateDMY(l.end_date)}
                        </td>
                        <td className="p-3.5 text-slate-300 break-words whitespace-normal leading-relaxed align-top">
                          <p className="text-xs">{l.reason}</p>
                          {l.admin_note && (
                            <span className="block text-[11px] text-amber-400 mt-1.5 p-1.5 rounded-lg bg-amber-950/40 border border-amber-800/60">
                              <strong>Catatan Admin:</strong> {l.admin_note}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap align-top">{getStatusBadge(l.status)}</td>
                        <td className="p-3.5 text-center whitespace-nowrap align-top">
                          {l.attachment && (
                            <button
                              onClick={() => setSelectedScreenshot(l.attachment)}
                              className="p-1.5 bg-slate-900 border border-slate-800 text-brand-400 rounded-lg hover:text-white hover:bg-brand-600 transition-colors"
                              title="Lihat Bukti Foto"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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
