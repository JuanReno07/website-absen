'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import AdminSidebar from '@/components/layout/AdminSidebar';
import {
  FileSpreadsheet,
  Download,
  Award,
  Clock,
  Calendar,
  Filter,
  BarChart3,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { formatDurationMinutes, formatIndonesianDate } from '@/lib/utils';

export default function AdminRecapPage() {
  const [user, setUser] = useState<any>(null);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const fetchRecapData = async () => {
    setLoading(true);
    try {
      const authRes = await fetch('/api/auth/me');
      const authData = await authRes.json();
      if (authData.authenticated) setUser(authData.user);

      const posRes = await fetch('/api/admin/positions');
      const posData = await posRes.json();
      if (posRes.ok) setPositions(posData.positions || []);

      const params = new URLSearchParams();
      if (positionFilter !== 'ALL') params.append('position_id', positionFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      const res = await fetch(`/api/admin/attendances?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setAttendances(data.attendances || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecapData();
  }, [positionFilter, statusFilter]);

  // Aggregate math
  const completedDuties = attendances.filter((a) => a.status === 'DUTY_SELESAI');
  const totalSessions = attendances.length;
  const totalCompletedMinutes = completedDuties.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0);
  const avgMinutes = completedDuties.length > 0 ? Math.round(totalCompletedMinutes / completedDuties.length) : 0;

  let longestMinutes = 0;
  let shortestMinutes = Infinity;

  completedDuties.forEach((a) => {
    if (a.duration_minutes && a.duration_minutes > longestMinutes) longestMinutes = a.duration_minutes;
    if (a.duration_minutes && a.duration_minutes < shortestMinutes) shortestMinutes = a.duration_minutes;
  });
  if (shortestMinutes === Infinity) shortestMinutes = 0;

  // Member Leaderboard Map
  const memberMap: Record<string, { name: string; pos: string; totalMin: number; sessions: number }> = {};
  attendances.forEach((a) => {
    const key = a.user.id;
    if (!memberMap[key]) {
      memberMap[key] = {
        name: a.user.discord_name,
        pos: a.user.position.name,
        totalMin: 0,
        sessions: 0,
      };
    }
    memberMap[key].sessions += 1;
    if (a.status === 'DUTY_SELESAI' && a.duration_minutes) {
      memberMap[key].totalMin += a.duration_minutes;
    }
  });

  const memberLeaderboard = Object.values(memberMap).sort((a, b) => b.totalMin - a.totalMin);

  const handleExport = (format: 'excel' | 'csv') => {
    const params = new URLSearchParams({ format });
    if (positionFilter !== 'ALL') params.append('position_id', positionFilter);
    if (statusFilter !== 'ALL') params.append('status', statusFilter);
    window.open(`/api/admin/export?${params.toString()}`, '_blank');
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
                <FileSpreadsheet className="w-6 h-6 text-brand-400" />
                Rekapitulasi Jam Duty & Ekspor Laporan
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Statistik performa jam duty anggota dan pengunduhan berkas laporan Excel/CSV.
              </p>
            </div>

            {/* Export Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExport('excel')}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>UNDUH EXCEL (.XLSX)</span>
              </button>

              <button
                onClick={() => handleExport('csv')}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl flex items-center gap-2 transition-all"
              >
                <FileText className="w-4 h-4" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* Statistical Highlights Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card rounded-2xl p-5 space-y-1">
              <span className="text-xs text-slate-400 font-semibold uppercase block">Total Jam Terkumpul</span>
              <p className="text-2xl font-extrabold text-brand-400 font-mono">
                {formatDurationMinutes(totalCompletedMinutes)}
              </p>
              <p className="text-[10px] text-slate-500">Dari {completedDuties.length} sesi duty selesai</p>
            </div>

            <div className="glass-card rounded-2xl p-5 space-y-1">
              <span className="text-xs text-slate-400 font-semibold uppercase block">Rata-Rata Durasi Duty</span>
              <p className="text-2xl font-extrabold text-blue-400 font-mono">
                {formatDurationMinutes(avgMinutes)}
              </p>
              <p className="text-[10px] text-slate-500">Per sesi duty</p>
            </div>

            <div className="glass-card rounded-2xl p-5 space-y-1">
              <span className="text-xs text-slate-400 font-semibold uppercase block">Sesi Terlama</span>
              <p className="text-2xl font-extrabold text-emerald-400 font-mono">
                {formatDurationMinutes(longestMinutes)}
              </p>
              <p className="text-[10px] text-slate-500">Rekor duty terpanjang</p>
            </div>

            <div className="glass-card rounded-2xl p-5 space-y-1">
              <span className="text-xs text-slate-400 font-semibold uppercase block">Total Seluruh Sesi</span>
              <p className="text-2xl font-extrabold text-slate-100 font-mono">
                {totalSessions} Sesi
              </p>
              <p className="text-[10px] text-slate-500">Dalam periode filter saat ini</p>
            </div>
          </div>

          {/* Leaderboard Table per Member */}
          <div className="glass-card rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                Peringkat Total Jam Duty Anggota
              </h2>

              <div className="flex items-center gap-2">
                <select
                  value={positionFilter}
                  onChange={(e) => setPositionFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5"
                >
                  <option value="ALL">Semua Jabatan</option>
                  {positions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono border-b border-slate-800">
                  <tr>
                    <th className="p-3">Peringkat</th>
                    <th className="p-3">Nama Anggota</th>
                    <th className="p-3">Jabatan</th>
                    <th className="p-3">Jumlah Sesi</th>
                    <th className="p-3">Target Harian (3 Jam)</th>
                    <th className="p-3 text-right">Total Jam Duty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {memberLeaderboard.map((m, idx) => {
                    const isFulfilled = m.totalMin >= 180;
                    return (
                      <tr key={idx} className="hover:bg-slate-900/40">
                        <td className="p-3">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] font-mono ${
                              idx === 0
                                ? 'bg-amber-400 text-black'
                                : idx === 1
                                ? 'bg-slate-300 text-black'
                                : idx === 2
                                ? 'bg-amber-700 text-white'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {idx + 1}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-100">{m.name}</td>
                        <td className="p-3 text-brand-400">{m.pos}</td>
                        <td className="p-3 font-mono">{m.sessions} Sesi</td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                              isFulfilled
                                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'
                                : 'bg-red-950/80 text-red-400 border-red-500/40'
                            }`}
                          >
                            {isFulfilled ? 'Terpenuhi (≥ 3 Jam)' : 'Belum Terpenuhi (< 3 Jam)'}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-extrabold text-emerald-400 text-sm">
                          {formatDurationMinutes(m.totalMin)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
