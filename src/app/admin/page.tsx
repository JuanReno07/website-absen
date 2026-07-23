'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import AdminSidebar from '@/components/layout/AdminSidebar';
import ScreenshotModal from '@/components/duty/ScreenshotModal';
import {
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  ExternalLink,
  Shield,
  Activity,
} from 'lucide-react';
import {
  formatIndonesianDate,
  formatIndonesianTime,
  formatDurationMinutes,
  DUTY_STATUS_CONFIG,
} from '@/lib/utils';

export default function AdminDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>({});
  const [activeDutiesList, setActiveDutiesList] = useState<any[]>([]);
  const [recentAttendances, setRecentAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  const fetchAdminDashboard = async () => {
    try {
      const authRes = await fetch('/api/auth/me');
      const authData = await authRes.json();
      if (!authData.authenticated || authData.user.role !== 'ADMIN') {
        window.location.href = '/dashboard';
        return;
      }
      setUser(authData.user);

      const res = await fetch('/api/admin/attendances');
      const data = await res.json();
      if (res.ok) {
        setStats(data.stats || {});
        setActiveDutiesList(data.activeDutiesList || []);
        setRecentAttendances((data.attendances || []).slice(0, 8));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminDashboard();
  }, []);

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

      <div className="flex-1 flex flex-col lg:flex-row">
        <AdminSidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 flex items-center gap-2">
                <Shield className="w-6 h-6 text-brand-400" />
                Dashboard Pentadbir / Admin
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Pengawasan real-time status duty anggota dan rekapitulasi sistem.
              </p>
            </div>
            <span className="px-3 py-1 bg-brand-950/80 border border-brand-500/40 text-brand-400 text-xs font-mono font-bold rounded-full">
              ADMIN MODE
            </span>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="glass-card rounded-2xl p-4 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Anggota Aktif</span>
              <p className="text-xl font-extrabold text-slate-100">{stats.totalMembers || 0}</p>
            </div>
            <div className="glass-card rounded-2xl p-4 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Sedang Duty</span>
              <p className="text-xl font-extrabold text-emerald-400 font-mono">
                {stats.activeDutyCount || 0}
              </p>
            </div>
            <div className="glass-card rounded-2xl p-4 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Pemeriksaan</span>
              <p className="text-xl font-extrabold text-amber-400 font-mono">
                {stats.pendingReviewCount || 0}
              </p>
            </div>
            <div className="glass-card rounded-2xl p-4 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Jam Hari Ini</span>
              <p className="text-sm font-extrabold text-slate-200 font-mono truncate">
                {formatDurationMinutes(stats.todayTotalMinutes)}
              </p>
            </div>
            <div className="glass-card rounded-2xl p-4 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Jam Bulan Ini</span>
              <p className="text-sm font-extrabold text-slate-200 font-mono truncate">
                {formatDurationMinutes(stats.monthTotalMinutes)}
              </p>
            </div>
            <div className="glass-card rounded-2xl p-4 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Nonaktif</span>
              <p className="text-xl font-extrabold text-slate-500">{stats.inactiveMembers || 0}</p>
            </div>
          </div>

          {/* Real-time Duty Monitor Section */}
          <div className="glass-card rounded-3xl p-6 space-y-4 border border-emerald-500/30">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
                Anggota Yang Sedang Duty Saat Ini ({activeDutiesList.length})
              </h2>
              <span className="text-xs text-emerald-400 font-mono font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                LIVE MONITORING
              </span>
            </div>

            {activeDutiesList.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                Tidak ada anggota yang sedang duty saat ini.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeDutiesList.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-slate-900/90 border border-emerald-500/30 rounded-2xl space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-100">
                        {item.user.discord_name}
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 text-[10px] font-bold rounded-full">
                        {item.user.position.name}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 space-y-0.5 font-mono">
                      <p>Waktu Mulai: {formatIndonesianTime(item.duty_in_time)}</p>
                      <p>OOC Name: {item.user.ooc_name}</p>
                    </div>

                    {item.duty_in_screenshot && (
                      <button
                        onClick={() => setSelectedScreenshot(item.duty_in_screenshot)}
                        className="w-full py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-brand-400 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Bukti Screenshot IN
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity Absensi Table */}
          <div className="glass-card rounded-3xl p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-100">Aktivitas Absensi Terbaru</h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono border-b border-slate-800">
                  <tr>
                    <th className="p-3">Nama Anggota</th>
                    <th className="p-3">Jabatan</th>
                    <th className="p-3">Tanggal</th>
                    <th className="p-3">Waktu IN</th>
                    <th className="p-3">Waktu OUT</th>
                    <th className="p-3">Durasi</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {recentAttendances.map((item) => {
                    const cfg = DUTY_STATUS_CONFIG[item.status] || DUTY_STATUS_CONFIG.BELUM_DUTY;
                    return (
                      <tr key={item.id} className="hover:bg-slate-900/40">
                        <td className="p-3 font-bold">{item.user.discord_name}</td>
                        <td className="p-3 text-slate-400">{item.user.position.name}</td>
                        <td className="p-3">{formatIndonesianDate(item.duty_in_time)}</td>
                        <td className="p-3 font-mono">{formatIndonesianTime(item.duty_in_time)}</td>
                        <td className="p-3 font-mono">
                          {item.duty_out_time ? formatIndonesianTime(item.duty_out_time) : '-'}
                        </td>
                        <td className="p-3 font-mono font-bold text-brand-300">
                          {formatDurationMinutes(item.duration_minutes)}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${cfg.bgClass} ${cfg.textClass} ${cfg.borderClass}`}
                          >
                            {cfg.label}
                          </span>
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

      <ScreenshotModal
        isOpen={!!selectedScreenshot}
        imageUrl={selectedScreenshot}
        onClose={() => setSelectedScreenshot(null)}
      />
    </div>
  );
}
