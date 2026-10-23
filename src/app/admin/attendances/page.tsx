'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import AdminSidebar from '@/components/layout/AdminSidebar';
import ScreenshotModal from '@/components/duty/ScreenshotModal';
import {
  CalendarCheck,
  Search,
  Filter,
  ExternalLink,
  Edit2,
  Trash2,
  XCircle,
  CheckCircle,
  AlertCircle,
  X,
  FileText,
  Check,
} from 'lucide-react';
import {
  formatIndonesianDate,
  formatIndonesianTime,
  formatDurationMinutes,
  DUTY_STATUS_CONFIG,
} from '@/lib/utils';

export default function AdminAttendancesPage() {
  const [user, setUser] = useState<any>(null);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Screenshot preview modal state
  const [selectedScreenshot, setSelectedScreenshot] = useState<{ url: string; title: string } | null>(null);

  // Edit / Action Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [status, setStatus] = useState('DUTY_SELESAI');
  const [adminNote, setAdminNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleQuickApprove = async (rec: any) => {
    const confirmApprove = window.confirm(
      `Setujui pengajuan absen manual untuk ${rec.user.discord_name} (${formatDurationMinutes(rec.duration_minutes)})? Status akan berubah menjadi DUTY SELESAI.`
    );
    if (!confirmApprove) return;

    try {
      const res = await fetch('/api/admin/attendances', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: rec.id,
          status: 'DUTY_SELESAI',
          admin_note: 'Disetujui oleh Admin',
        }),
      });
      if (res.ok) {
        fetchAttendances();
      } else {
        const d = await res.json();
        alert(d.error || 'Gagal menyetujui pengajuan.');
      }
    } catch {
      alert('Terjadi kesalahan koneksi.');
    }
  };

  const handleQuickReject = (rec: any) => {
    handleOpenEdit(rec);
    setStatus('DIBATALKAN_ADMIN');
    setAdminNote('Bukti screenshot tidak sesuai / pengajuan ditolak.');
  };

  const fetchAttendances = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (positionFilter !== 'ALL') params.append('position_id', positionFilter);

      const [posRes, res] = await Promise.all([
        fetch('/api/admin/positions'),
        fetch(`/api/admin/attendances?${params.toString()}`),
      ]);

      if (posRes.ok) {
        const posData = await posRes.json();
        setPositions(posData.positions || []);
      }

      if (res.ok) {
        const data = await res.json();
        setAttendances(data.attendances || []);
        setStats(data.stats || null);
      } else if (res.status === 403 || res.status === 401) {
        window.location.href = '/dashboard';
      }
    } catch (e) {
      console.error('Fetch attendances error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendances();
  }, [search, statusFilter, positionFilter]);

  const handleOpenEdit = (rec: any) => {
    setEditingRecord(rec);
    setStatus(rec.status);
    setAdminNote(rec.admin_note || '');
    setErrorMsg('');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (status === 'DIBATALKAN_ADMIN' && !adminNote.trim()) {
      setErrorMsg('Catatan admin wajib diisi ketika membatalkan data absensi.');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/admin/attendances', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingRecord.id,
          status,
          admin_note: adminNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Gagal mengubah data absensi.');
        setSaving(false);
        return;
      }

      setIsEditModalOpen(false);
      fetchAttendances();
    } catch (err) {
      setErrorMsg('Kesalahan koneksi.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRecord = async (rec: any) => {
    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus data absensi milik ${rec.user.discord_name} pada tanggal ${formatIndonesianDate(rec.duty_in_time)}? Tindakan ini akan dicatat dalam Audit Log.`
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/admin/attendances?id=${rec.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Gagal menghapus data absensi.');
        return;
      }

      alert('Data absensi berhasil dihapus.');
      fetchAttendances();
    } catch (err) {
      alert('Terjadi kesalahan jaringan.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar user={user} activeDuty={null} />

      <div className="flex-1 flex flex-col lg:flex-row">
        <AdminSidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 flex items-center gap-2">
                <CalendarCheck className="w-6 h-6 text-brand-400" />
                Manajemen Data Absensi
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Kelola, tinjau, koreksi, batalkan, atau hapus riwayat absensi anggota.
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari Nama Discord, Jabatan, OOC, atau Steam Hex..."
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2"
              >
                <option value="ALL">Semua Jabatan</option>
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2"
              >
                <option value="ALL">Semua Status</option>
                <option value="SEDANG_DUTY">Sedang Duty</option>
                <option value="DUTY_SELESAI">Duty Selesai</option>
                <option value="PERLU_PEMERIKSAAN">Perlu Pemeriksaan</option>
                <option value="DIBATALKAN_ADMIN">Dibatalkan Admin</option>
              </select>

              {stats?.pendingReviewCount > 0 && (
                <button
                  type="button"
                  onClick={() => setStatusFilter(statusFilter === 'PERLU_PEMERIKSAAN' ? 'ALL' : 'PERLU_PEMERIKSAAN')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    statusFilter === 'PERLU_PEMERIKSAAN'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                      : 'bg-amber-950/80 border-amber-500/50 text-amber-300 hover:bg-amber-900/60'
                  }`}
                  title="Filter hanya pengajuan absen yang perlu pemeriksaan"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                  <span>{stats.pendingReviewCount} Perlu Approval</span>
                </button>
              )}
            </div>
          </div>

          {/* Attendances Main Table */}
          <div className="glass-card rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono border-b border-slate-800">
                  <tr>
                    <th className="p-3">Nama Anggota</th>
                    <th className="p-3">Jabatan</th>
                    <th className="p-3">Steam Hex</th>
                    <th className="p-3">Tanggal</th>
                    <th className="p-3">IN</th>
                    <th className="p-3">OUT</th>
                    <th className="p-3">Durasi</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Bukti</th>
                    <th className="p-3 text-right">Aksi Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="p-3"><div className="w-28 h-4 bg-slate-800/80 rounded-lg"></div></td>
                        <td className="p-3"><div className="w-20 h-4 bg-slate-800/80 rounded-lg"></div></td>
                        <td className="p-3"><div className="w-28 h-4 bg-slate-800/80 rounded-lg"></div></td>
                        <td className="p-3"><div className="w-24 h-4 bg-slate-800/80 rounded-lg"></div></td>
                        <td className="p-3"><div className="w-16 h-4 bg-slate-800/80 rounded-lg"></div></td>
                        <td className="p-3"><div className="w-16 h-4 bg-slate-800/80 rounded-lg"></div></td>
                        <td className="p-3"><div className="w-16 h-4 bg-slate-800/80 rounded-lg"></div></td>
                        <td className="p-3"><div className="w-20 h-4 bg-slate-800/80 rounded-lg"></div></td>
                        <td className="p-3"><div className="w-16 h-4 bg-slate-800/80 rounded-lg"></div></td>
                        <td className="p-3 text-right"><div className="w-20 h-7 bg-slate-800/80 rounded-lg ml-auto"></div></td>
                      </tr>
                    ))
                  ) : attendances.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-500">
                        Tidak ada data absensi yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    attendances.map((rec) => {
                    const cfg = DUTY_STATUS_CONFIG[rec.status] || DUTY_STATUS_CONFIG.BELUM_DUTY;
                    const isPending = rec.status === 'PERLU_PEMERIKSAAN';
                    return (
                      <tr
                        key={rec.id}
                        className={`transition-colors ${
                          isPending
                            ? 'bg-amber-950/20 hover:bg-amber-950/30 border-l-4 border-amber-500'
                            : 'hover:bg-slate-900/40'
                        }`}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-100">{rec.user.discord_name}</span>
                            {isPending && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                Manual
                              </span>
                            )}
                          </div>
                          {rec.user_note && (
                            <p className="text-[11px] text-slate-400 italic max-w-[200px] sm:max-w-xs truncate mt-0.5" title={rec.user_note}>
                              {rec.user_note}
                            </p>
                          )}
                        </td>
                        <td className="p-3 text-brand-400 font-semibold">{rec.user.position.name}</td>
                        <td className="p-3 font-mono text-slate-400">{rec.user.steam_hex}</td>
                        <td className="p-3">{formatIndonesianDate(rec.duty_in_time)}</td>
                        <td className="p-3 font-mono">{formatIndonesianTime(rec.duty_in_time)}</td>
                        <td className="p-3 font-mono">
                          {rec.duty_out_time ? formatIndonesianTime(rec.duty_out_time) : '-'}
                        </td>
                        <td className="p-3 font-mono font-bold text-brand-300">
                          {formatDurationMinutes(rec.duration_minutes)}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${cfg.bgClass} ${cfg.textClass} ${cfg.borderClass}`}
                          >
                            {cfg.label}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            {rec.duty_in_screenshot && (
                              <button
                                onClick={() =>
                                  setSelectedScreenshot({
                                    url: rec.duty_in_screenshot,
                                    title: `Bukti Duty IN - ${rec.user.discord_name}`,
                                  })
                                }
                                className="px-2 py-0.5 bg-slate-900 border border-slate-700 hover:border-brand-500 rounded text-[10px] text-brand-400 flex items-center gap-1 font-mono"
                              >
                                <ExternalLink className="w-3 h-3" /> IN
                              </button>
                            )}
                            {rec.duty_out_screenshot && (
                              <button
                                onClick={() =>
                                  setSelectedScreenshot({
                                    url: rec.duty_out_screenshot,
                                    title: `Bukti Duty OUT - ${rec.user.discord_name}`,
                                  })
                                }
                                className="px-2 py-0.5 bg-slate-900 border border-slate-700 hover:border-red-500 rounded text-[10px] text-red-400 flex items-center gap-1 font-mono"
                              >
                                <ExternalLink className="w-3 h-3" /> OUT
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {isPending && (
                              <>
                                <button
                                  onClick={() => handleQuickApprove(rec)}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 shadow-sm transition-colors"
                                  title="Setujui Pengajuan Absen Manual (Ubah ke Duty Selesai)"
                                >
                                  <Check className="w-3.5 h-3.5" /> Setujui
                                </button>

                                <button
                                  onClick={() => handleQuickReject(rec)}
                                  className="px-2 py-1.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-600/50 text-amber-300 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                                  title="Tolak Pengajuan Absen Manual"
                                >
                                  <X className="w-3.5 h-3.5" /> Tolak
                                </button>
                              </>
                            )}

                            <button
                              onClick={() => handleOpenEdit(rec)}
                              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                              title="Edit / Koreksi Data"
                            >
                              <Edit2 className="w-3.5 h-3.5" /> Edit
                            </button>

                            <button
                              onClick={() => handleDeleteRecord(rec)}
                              className="px-2 py-1.5 bg-red-950/60 hover:bg-red-900/80 border border-red-800/60 text-red-400 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                              title="Hapus History Duty"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Admin Action Modal */}
      {isEditModalOpen && editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100">
                Kelola Absensi - {editingRecord.user.discord_name}
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-950 border border-red-800 rounded-xl text-red-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">Status Absensi</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-bold"
                >
                  <option value="SEDANG_DUTY">Sedang Duty</option>
                  <option value="DUTY_SELESAI">Duty Selesai</option>
                  <option value="PERLU_PEMERIKSAAN">Perlu Pemeriksaan</option>
                  <option value="DIBATALKAN_ADMIN">Dibatalkan Admin</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">Catatan Admin</label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Catatan pemeriksaan atau alasan pembatalan data absensi..."
                  rows={3}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500"
                />
                <p className="text-[10px] text-amber-400 mt-1">
                  *Setiap perubahan data oleh Admin akan dicatat ke dalam Audit Log.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ScreenshotModal
        isOpen={!!selectedScreenshot}
        imageUrl={selectedScreenshot?.url || null}
        title={selectedScreenshot?.title}
        onClose={() => setSelectedScreenshot(null)}
      />
    </div>
  );
}
