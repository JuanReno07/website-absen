'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import AdminSidebar from '@/components/layout/AdminSidebar';
import ScreenshotModal from '@/components/duty/ScreenshotModal';
import { Calendar, Search, CheckCircle, XCircle, ExternalLink, Filter, X } from 'lucide-react';
import { formatIndonesianDate } from '@/lib/utils';

export default function AdminLeavesPage() {
  const [user, setUser] = useState<any>(null);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('MENUNGGU_PERSETUJUAN');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  // Approval Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetLeave, setTargetLeave] = useState<any | null>(null);
  const [actionStatus, setActionStatus] = useState<'DISETUJUI' | 'DITOLAK'>('DISETUJUI');
  const [adminNote, setAdminNote] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchAdminLeaves = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (search) params.append('search', search);

      const res = await fetch(`/api/admin/leaves?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setLeaveRequests(data.leaveRequests || []);
      } else if (res.status === 403 || res.status === 401) {
        window.location.href = '/dashboard';
      }
    } catch (e) {
      console.error('Fetch leaves error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminLeaves();
  }, [statusFilter, search]);

  const handleOpenAction = (leave: any, st: 'DISETUJUI' | 'DITOLAK') => {
    setTargetLeave(leave);
    setActionStatus(st);
    setAdminNote('');
    setIsModalOpen(true);
  };

  const handleConfirmAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetLeave) return;

    setSaving(true);

    try {
      const res = await fetch('/api/admin/leaves', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: targetLeave.id,
          status: actionStatus,
          admin_note: adminNote,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Gagal memperbarui status izin.');
        setSaving(false);
        return;
      }

      setIsModalOpen(false);
      fetchAdminLeaves();
    } catch (err) {
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setSaving(false);
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
                <Calendar className="w-6 h-6 text-brand-400" />
                Persetujuan Izin Anggota
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Kelola dan berikan persetujuan atau penolakan pengajuan izin anggota.
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
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 w-full sm:w-auto font-bold"
            >
              <option value="MENUNGGU_PERSETUJUAN">Menunggu Persetujuan</option>
              <option value="DISETUJUI">Disetujui</option>
              <option value="DITOLAK">Ditolak</option>
              <option value="ALL">Semua Status</option>
            </select>
          </div>

          {/* Main Table */}
          <div className="glass-card rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono border-b border-slate-800">
                  <tr>
                    <th className="p-3">Nama Anggota</th>
                    <th className="p-3">Jabatan</th>
                    <th className="p-3">Jenis Izin</th>
                    <th className="p-3">Periode Izin</th>
                    <th className="p-3">Alasan</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Aksi Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="p-3"><div className="w-28 h-4 bg-slate-800/80 rounded-lg"></div></td>
                        <td className="p-3"><div className="w-20 h-4 bg-slate-800/80 rounded-lg"></div></td>
                        <td className="p-3"><div className="w-24 h-4 bg-slate-800/80 rounded-lg"></div></td>
                        <td className="p-3"><div className="w-32 h-4 bg-slate-800/80 rounded-lg"></div></td>
                        <td className="p-3"><div className="w-36 h-4 bg-slate-800/80 rounded-lg"></div></td>
                        <td className="p-3"><div className="w-20 h-4 bg-slate-800/80 rounded-lg"></div></td>
                        <td className="p-3 text-right"><div className="w-24 h-7 bg-slate-800/80 rounded-lg ml-auto"></div></td>
                      </tr>
                    ))
                  ) : leaveRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        Tidak ada data pengajuan izin dengan filter ini.
                      </td>
                    </tr>
                  ) : (
                    leaveRequests.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-900/40">
                        <td className="p-3 font-bold text-slate-100">{l.user.discord_name}</td>
                        <td className="p-3 text-brand-400 font-semibold">{l.user.position.name}</td>
                        <td className="p-3 font-bold">{l.leave_type}</td>
                        <td className="p-3 font-mono text-[11px]">
                          {formatIndonesianDate(l.start_date)} - {formatIndonesianDate(l.end_date)}
                        </td>
                        <td className="p-3 max-w-xs truncate text-slate-300">
                          {l.reason}
                          {l.attachment && (
                            <button
                              onClick={() => setSelectedScreenshot(l.attachment)}
                              className="ml-2 text-brand-400 inline-flex items-center gap-1 font-bold"
                            >
                              <ExternalLink className="w-3 h-3" /> Bukti
                            </button>
                          )}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              l.status === 'DISETUJUI'
                                ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                                : l.status === 'DITOLAK'
                                ? 'bg-red-950 text-red-400 border-red-800'
                                : 'bg-amber-950 text-amber-400 border-amber-800'
                            }`}
                          >
                            {l.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {l.status === 'MENUNGGU_PERSETUJUAN' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenAction(l, 'DISETUJUI')}
                                className="px-2.5 py-1 bg-emerald-900/80 hover:bg-emerald-800 text-emerald-300 border border-emerald-700 rounded-lg text-xs font-bold flex items-center gap-1"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Setujui
                              </button>
                              <button
                                onClick={() => handleOpenAction(l, 'DITOLAK')}
                                className="px-2.5 py-1 bg-red-950/80 hover:bg-red-900 text-red-400 border border-red-800 rounded-lg text-xs font-bold flex items-center gap-1"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Tolak
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500 font-mono">Selesai</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Confirmation Modal */}
      {isModalOpen && targetLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100">
                {actionStatus === 'DISETUJUI' ? 'Setujui Pengajuan Izin' : 'Tolak Pengajuan Izin'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Konfirmasi status izin untuk anggota <strong>{targetLeave.user.discord_name}</strong> (
              {targetLeave.leave_type}).
            </p>

            <form onSubmit={handleConfirmAction} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">Catatan Admin (Opsional)</label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Keterangan persetujuan / alasan penolakan..."
                  rows={3}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`px-5 py-2 text-white font-bold rounded-xl shadow-lg ${
                    actionStatus === 'DISETUJUI' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
                  }`}
                >
                  {saving ? 'Memproses...' : `Konfirmasi ${actionStatus}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ScreenshotModal
        isOpen={!!selectedScreenshot}
        imageUrl={selectedScreenshot}
        onClose={() => setSelectedScreenshot(null)}
      />
    </div>
  );
}
