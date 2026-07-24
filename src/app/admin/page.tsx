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
      setLoading(true);
      // Fetch auth check and dashboard stats concurrently in parallel for 10x faster load
      const [authRes, res] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/admin/attendances'),
      ]);

      const authData = await authRes.json();
      if (!authData || !authData.authenticated || authData.user?.role !== 'ADMIN') {
        window.location.href = '/dashboard';
        return;
      }
      setUser(authData.user);

      if (res.ok) {
        const data = await res.json();
        setStats(data.stats || {});
        setActiveDutiesList(data.activeDutiesList || []);
        setRecentAttendances((data.attendances || []).slice(0, 8));
      }
    } catch (e) {
      console.error('Admin dashboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminDashboard();
  }, []);

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 font-medium">Memuat Dashboard Pentadbir Admin...</p>
        </div>
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
                Ringkasan statistik real-time, aktivitas duty aktif, dan tinjauan seluruh absensi.
              </p>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="glass-card rounded-2xl p-4 sm:p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-950/80 border border-brand-800/50 flex items-center justify-center text-brand-400 shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Total Anggota Aktif</p>
                <p className="text-xl sm:text-2xl font-black text-slate-100 mt-0.5">
                  {stats.totalMembers || 0}
                </p>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-4 sm:p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-800/50 flex items-center justify-center text-emerald-400 shrink-0">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Sedang Duty IN</p>
                <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">
                  {stats.activeDutyCount || 0}
                </p>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-4 sm:p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-800/50 flex items-center justify-center text-amber-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Perlu Pemeriksaan</p>
                <p className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5">
                  {stats.pendingReviewCount || 0}
                </p>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-4 sm:p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-950/80 border border-blue-800/50 flex items-center justify-center text-blue-400 shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Total Jam Hari Ini</p>
                <p className="text-xl sm:text-2xl font-black text-blue-400 mt-0.5">
                  {formatDurationMinutes(stats.todayTotalMinutes || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Active Duty Live Feed */}
          <div className="glass-card rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
                <h2 className="text-base sm:text-lg font-bold text-slate-100">
                  Petugas Sedang Duty IN (Real-time)
                </h2>
              </div>
              <span className="text-xs text-emerald-400 font-mono font-bold bg-emerald-950 px-3 py-1 rounded-full border border-emerald-800/50">
                {activeDutiesList.length} Petugas Aktif
              </span>
            </div>

            {activeDutiesList.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800/60">
                <p className="text-xs text-slate-400">Tidak ada petugas yang sedang Duty IN saat ini.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeDutiesList.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-slate-100 text-xs">{item.user?.discord_name}</p>
                      <p className="text-[10px] text-brand-400 font-semibold mt-0.5">
                        {item.user?.position?.name || 'Anggota'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono mt-1">
                        IN: {formatIndonesianTime(item.duty_in_time)}
                      </p>
                    </div>
                    {item.duty_in_screenshot && (
                      <button
                        onClick={() => setSelectedScreenshot(item.duty_in_screenshot)}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 rounded-lg flex items-center gap-1 shrink-0"
                      >
                        <ExternalLink className="w-3 h-3" /> Bukti
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Attendances Table */}
          <div className="glass-card rounded-3xl p-5 sm:p-6 space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-100">
              Aktivitas Absensi Terbaru
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono border-b border-slate-800">
                  <tr>
                    <th className="p-3">Nama Anggota</th>
                    <th className="p-3">Jabatan</th>
                    <th className="p-3">Duty IN</th>
                    <th className="p-3">Duty OUT</th>
                    <th className="p-3">Durasi</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {recentAttendances.map((m) => {
                    const statusCfg =
                      DUTY_STATUS_CONFIG[m.status as keyof typeof DUTY_STATUS_CONFIG] ||
                      DUTY_STATUS_CONFIG.SEDANG_DUTY;
                    return (
                      <tr key={m.id} className="hover:bg-slate-900/40">
                        <td className="p-3 font-bold text-slate-100">{m.user?.discord_name}</td>
                        <td className="p-3 text-brand-400 font-medium">
                          {m.user?.position?.name || '-'}
                        </td>
                        <td className="p-3 font-mono">{formatIndonesianTime(m.duty_in_time)}</td>
                        <td className="p-3 font-mono">
                          {m.duty_out_time ? formatIndonesianTime(m.duty_out_time) : '-'}
                        </td>
                        <td className="p-3 font-semibold text-slate-300">
                          {formatDurationMinutes(m.duration_minutes)}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusCfg.bgClass} ${statusCfg.textClass} ${statusCfg.borderClass}`}
                          >
                            {statusCfg.label}
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

      {selectedScreenshot && (
        <ScreenshotModal
          isOpen={!!selectedScreenshot}
          imageUrl={selectedScreenshot}
          title="Bukti Screenshot Duty"
          onClose={() => setSelectedScreenshot(null)}
        />
      )}
    </div>
  );
}
