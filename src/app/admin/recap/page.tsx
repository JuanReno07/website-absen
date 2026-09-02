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
  CalendarDays,
  Layers,
} from 'lucide-react';
import { formatDurationMinutes, formatIndonesianDate } from '@/lib/utils';

export default function AdminRecapPage() {
  const [user, setUser] = useState<any>(null);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // View Mode: 'daily' (Rekap Per Tanggal) vs 'summary' (Ringkasan Akumulasi)
  const [viewMode, setViewMode] = useState<'daily' | 'summary'>('daily');

  const fetchRecapData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('period', periodFilter);
      if (periodFilter === 'custom') {
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
      }
      if (positionFilter !== 'ALL') params.append('position_id', positionFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

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
      } else if (res.status === 403 || res.status === 401) {
        window.location.href = '/dashboard';
      }
    } catch (e) {
      console.error('Fetch recap error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecapData();
  }, [periodFilter, positionFilter, statusFilter]);

  const handleApplyCustomDate = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRecapData();
  };

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

  // 1. Grouping Daily Breakdown (Per Tanggal Per Anggota)
  interface DailyGroup {
    dateStr: string;
    duty_in_time: Date;
    discord_name: string;
    position_name: string;
    ooc_name: string;
    steam_hex: string;
    session_count: number;
    total_minutes: number;
  }

  const dailyMap: Record<string, DailyGroup> = {};

  attendances.forEach((a) => {
    const dateStr = new Date(a.duty_in_time).toISOString().slice(0, 10);
    const key = `${a.user.id}_${dateStr}`;

    if (!dailyMap[key]) {
      dailyMap[key] = {
        dateStr,
        duty_in_time: new Date(a.duty_in_time),
        discord_name: a.user.discord_name,
        position_name: a.user.position.name,
        ooc_name: a.user.ooc_name,
        steam_hex: a.user.steam_hex,
        session_count: 0,
        total_minutes: 0,
      };
    }

    dailyMap[key].session_count += 1;
    if (a.status === 'DUTY_SELESAI' && a.duration_minutes) {
      dailyMap[key].total_minutes += a.duration_minutes;
    }
  });

  const dailyBreakdownList = Object.values(dailyMap).sort(
    (a, b) => new Date(b.duty_in_time).getTime() - new Date(a.duty_in_time).getTime()
  );

  // 2. Member Summary Leaderboard Map (Total Accumulation)
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
    const params = new URLSearchParams({ format, period: periodFilter });
    if (periodFilter === 'custom') {
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
    }
    if (positionFilter !== 'ALL') params.append('position_id', positionFilter);
    if (statusFilter !== 'ALL') params.append('status', statusFilter);
    window.open(`/api/admin/export?${params.toString()}`, '_blank');
  };

  const periodLabels = {
    today: 'Hari Ini',
    week: 'Minggu Ini',
    month: 'Bulan Ini',
    all: 'Semua Waktu',
    custom: startDate && endDate ? `${startDate} s/d ${endDate}` : 'Custom Tanggal',
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
                Statistik rekapitulasi jam duty per tanggal, per minggu, dan per bulan serta unduh Excel.
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

          {/* Period Filter Selector & Date Picker Bar */}
          <div className="glass-card rounded-2xl p-4 space-y-4 border border-slate-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  FILTER PERIODE LAPORAN:
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {[
                  { id: 'today', label: 'Hari Ini' },
                  { id: 'week', label: 'Minggu Ini' },
                  { id: 'month', label: 'Bulan Ini' },
                  { id: 'all', label: 'Semua Waktu' },
                  { id: 'custom', label: 'Pilih Tanggal' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPeriodFilter(p.id as any)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      periodFilter === p.id
                        ? 'bg-brand-600 text-white border-brand-500 shadow-md shadow-brand-600/30'
                        : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Date Range Controls */}
            {periodFilter === 'custom' && (
              <form
                onSubmit={handleApplyCustomDate}
                className="pt-3 border-t border-slate-800 flex flex-wrap items-center gap-3"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold">Dari Tanggal (DD/MM/YYYY):</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    className="bg-slate-950 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-1.5 cursor-pointer [color-scheme:dark] focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold">Sampai Tanggal (DD/MM/YYYY):</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    className="bg-slate-950 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-1.5 cursor-pointer [color-scheme:dark] focus:outline-none focus:border-brand-500"
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow transition-colors"
                >
                  Terapkan Tanggal
                </button>
              </form>
            )}
          </div>

          {/* Statistical Highlights Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass-card rounded-2xl p-5 space-y-2 animate-pulse">
                  <div className="w-24 h-3 bg-slate-800 rounded"></div>
                  <div className="w-28 h-6 bg-slate-800 rounded font-mono"></div>
                  <div className="w-20 h-2 bg-slate-800/60 rounded"></div>
                </div>
              ))
            ) : (
              <>
                <div className="glass-card rounded-2xl p-5 space-y-1">
                  <span className="text-xs text-slate-400 font-semibold uppercase block">Total Jam Terkumpul</span>
                  <p className="text-2xl font-extrabold text-brand-400 font-mono">
                    {formatDurationMinutes(totalCompletedMinutes)}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Periode {periodLabels[periodFilter]} ({completedDuties.length} sesi selesai)
                  </p>
                </div>

                <div className="glass-card rounded-2xl p-5 space-y-1">
                  <span className="text-xs text-slate-400 font-semibold uppercase block">Rata-Rata Durasi Duty</span>
                  <p className="text-2xl font-extrabold text-blue-400 font-mono">
                    {formatDurationMinutes(avgMinutes)}
                  </p>
                  <p className="text-[10px] text-slate-500">Per sesi duty ({periodLabels[periodFilter]})</p>
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
                  <p className="text-[10px] text-slate-500">Periode {periodLabels[periodFilter]}</p>
                </div>
              </>
            )}
          </div>

          {/* Table Container & View Mode Tabs */}
          <div className="glass-card rounded-3xl p-6 space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              {/* View Mode Tabs */}
              <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                <button
                  onClick={() => setViewMode('daily')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    viewMode === 'daily'
                      ? 'bg-brand-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <CalendarDays className="w-4 h-4" />
                  <span>Rekap Per Tanggal</span>
                </button>

                <button
                  onClick={() => setViewMode('summary')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    viewMode === 'summary'
                      ? 'bg-brand-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  <span>Ringkasan Akumulasi Anggota</span>
                </button>
              </div>

              {/* Position Filter */}
              <div className="flex items-center gap-2">
                <select
                  value={positionFilter}
                  onChange={(e) => setPositionFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3.5 py-2 font-semibold"
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

            {/* TAB 1: REKAP PER TANGGAL (DAILY BREAKDOWN PER ANGGOTA) */}
            {viewMode === 'daily' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-brand-400" />
                    Rincian Duty Per Tanggal ({periodLabels[periodFilter]})
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Total {dailyBreakdownList.length} Entri Tanggal
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono border-b border-slate-800">
                      <tr>
                        <th className="p-3">No</th>
                        <th className="p-3">Tanggal Duty</th>
                        <th className="p-3">Nama Anggota</th>
                        <th className="p-3">Jabatan</th>
                        <th className="p-3">Jumlah Sesi</th>
                        <th className="p-3">Status Target (3 Jam)</th>
                        <th className="p-3 text-right">Total Jam Duty Harian</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200">
                      {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i} className="animate-pulse">
                            <td className="p-3"><div className="w-6 h-4 bg-slate-800/80 rounded"></div></td>
                            <td className="p-3"><div className="w-28 h-4 bg-slate-800/80 rounded-lg"></div></td>
                            <td className="p-3"><div className="w-32 h-4 bg-slate-800/80 rounded-lg"></div></td>
                            <td className="p-3"><div className="w-24 h-4 bg-slate-800/80 rounded-lg"></div></td>
                            <td className="p-3"><div className="w-16 h-4 bg-slate-800/80 rounded-lg"></div></td>
                            <td className="p-3"><div className="w-28 h-5 bg-slate-800/80 rounded-full"></div></td>
                            <td className="p-3 text-right"><div className="w-20 h-5 bg-slate-800/80 rounded-lg ml-auto"></div></td>
                          </tr>
                        ))
                      ) : dailyBreakdownList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-500">
                            Belum ada data duty per tanggal untuk periode {periodLabels[periodFilter]}.
                          </td>
                        </tr>
                      ) : (
                        dailyBreakdownList.map((item, idx) => {
                          const isFulfilled = item.total_minutes >= 180;
                          return (
                            <tr key={idx} className="hover:bg-slate-900/40">
                              <td className="p-3 font-mono text-slate-500">{idx + 1}</td>
                              <td className="p-3 font-bold text-brand-300 font-mono">
                                {formatIndonesianDate(item.duty_in_time)}
                              </td>
                              <td className="p-3 font-bold text-slate-100">{item.discord_name}</td>
                              <td className="p-3 text-slate-300">{item.position_name}</td>
                              <td className="p-3 font-mono">{item.session_count} Sesi</td>
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
                                {formatDurationMinutes(item.total_minutes)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: RINGKASAN AKUMULASI PERFORMA ANGGOTA */}
            {viewMode === 'summary' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    Peringkat Akumulasi Performa Anggota ({periodLabels[periodFilter]})
                  </h3>
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
                        <th className="p-3 text-right font-bold text-emerald-400">Total Akumulasi Duty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200">
                      {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i} className="animate-pulse">
                            <td className="p-3"><div className="w-8 h-4 bg-slate-800/80 rounded-full"></div></td>
                            <td className="p-3"><div className="w-32 h-4 bg-slate-800/80 rounded-lg"></div></td>
                            <td className="p-3"><div className="w-24 h-4 bg-slate-800/80 rounded-lg"></div></td>
                            <td className="p-3"><div className="w-16 h-4 bg-slate-800/80 rounded-lg"></div></td>
                            <td className="p-3"><div className="w-28 h-5 bg-slate-800/80 rounded-full"></div></td>
                            <td className="p-3 text-right"><div className="w-20 h-5 bg-slate-800/80 rounded-lg ml-auto"></div></td>
                          </tr>
                        ))
                      ) : memberLeaderboard.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500">
                            Belum ada data rekapitulasi jam duty untuk periode {periodLabels[periodFilter]}.
                          </td>
                        </tr>
                      ) : (
                        memberLeaderboard.map((m, idx) => {
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
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
