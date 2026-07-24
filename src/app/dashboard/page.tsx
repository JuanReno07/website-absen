'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import DutyTimer from '@/components/duty/DutyTimer';
import ScreenshotModal from '@/components/duty/ScreenshotModal';
import {
  Clock,
  Play,
  Square,
  History,
  Calendar,
  User,
  Shield,
  CheckCircle,
  AlertTriangle,
  Award,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import {
  formatIndonesianDate,
  formatIndonesianTime,
  formatDurationMinutes,
  DUTY_STATUS_CONFIG,
} from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeDuty, setActiveDuty] = useState<any>(null);
  const [todayTotalMinutes, setTodayTotalMinutes] = useState<number>(0);
  const [monthTotalMinutes, setMonthTotalMinutes] = useState<number>(0);
  const [recentHistory, setRecentHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [errorState, setErrorState] = useState<boolean>(false);

  const fetchDashboardData = async () => {
    try {
      setErrorState(false);
      const authRes = await fetch('/api/auth/me');
      const authData = await authRes.json();

      if (!authData || !authData.authenticated) {
        setLoading(false);
        window.location.href = '/login';
        return;
      }
      setUser(authData.user);

      const dutyRes = await fetch('/api/duty/active');
      const dutyData = await dutyRes.json();

      if (dutyRes.ok) {
        setActiveDuty(dutyData.activeDuty);
        setTodayTotalMinutes(dutyData.todayTotalMinutes || 0);
        setMonthTotalMinutes(dutyData.monthTotalMinutes || 0);
        setRecentHistory(dutyData.recentHistory || []);
      }
    } catch (e) {
      console.error('Dashboard fetch error:', e);
      setErrorState(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Fallback timeout in case fetch hangs
    const timer = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 font-medium">Memuat Dashboard Duty...</p>
        </div>
      </div>
    );
  }

  if (errorState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-400" />
          <p className="text-sm text-slate-300 font-semibold">Gagal memuat dashboard</p>
          <p className="text-xs text-slate-500 max-w-xs">Terjadi kesalahan saat menghubungi server. Periksa koneksi internet Anda.</p>
          <div className="flex gap-3">
            <button
              onClick={() => { setLoading(true); fetchDashboardData(); }}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl transition-all"
            >
              Coba Lagi
            </button>
            <button
              onClick={() => { window.location.href = '/login'; }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all"
            >
              Ke Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar user={user} activeDuty={activeDuty} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* User Identity & Stats Header Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Identity Profile Card */}
          <div className="glass-card rounded-3xl p-5 sm:p-6 lg:col-span-2 flex flex-col justify-between space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-brand-600 to-slate-800 p-0.5 shadow-xl flex-shrink-0">
                  <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-brand-400 font-bold text-xl uppercase border border-slate-700">
                    {user?.discord_name?.slice(0, 2) || 'AS'}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-100">
                      {user?.discord_name}
                    </h2>
                    <span className="px-2.5 py-0.5 bg-brand-950/80 border border-brand-500/40 text-brand-400 rounded-full text-[10px] font-bold tracking-wider uppercase">
                      {user?.position_name}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1 font-mono">
                    <span>OOC: <strong className="text-slate-200">{user?.ooc_name}</strong></span>
                    <span>Hex: <strong className="text-slate-200">{user?.steam_hex}</strong></span>
                  </div>
                </div>
              </div>

              <div className="text-left sm:text-right border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0 w-full sm:w-auto">
                <p className="text-xs text-slate-400 flex items-center sm:justify-end gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-brand-400" />
                  {formatIndonesianDate(new Date())}
                </p>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  WIB (Asia/Jakarta)
                </p>
              </div>
            </div>

            {/* Status Duty Badge Summary */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Status Saat Ini:</span>
                {activeDuty ? (
                  <span className="px-3 py-1 bg-emerald-950/90 border border-emerald-500/50 text-emerald-400 rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-emerald-950">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    SEDANG DUTY AKTIF
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded-full text-xs font-semibold">
                    BELUM DUTY
                  </span>
                )}
              </div>

              {user?.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="text-xs font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Buka Panel Admin &rarr;
                </Link>
              )}
            </div>
          </div>

          {/* Quick Hours Summary Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
            <div className="glass-card rounded-3xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-950/80 border border-brand-500/30 flex items-center justify-center text-brand-400">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Total Hari Ini</p>
                <p className="text-lg sm:text-xl font-extrabold text-slate-100 font-mono mt-0.5">
                  {formatDurationMinutes(todayTotalMinutes)}
                </p>
              </div>
            </div>

            <div className="glass-card rounded-3xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-950/80 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Total Bulan Ini</p>
                <p className="text-lg sm:text-xl font-extrabold text-slate-100 font-mono mt-0.5">
                  {formatDurationMinutes(monthTotalMinutes)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Duty Action Banner */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-brand-500/30 shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600/10 rounded-full blur-3xl pointer-events-none"></div>

          {!activeDuty ? (
            /* BELUM DUTY STATE */
            <div className="flex flex-col items-center text-center space-y-6 py-4">
              <div className="w-16 h-16 rounded-full bg-brand-600/20 border border-brand-500/40 flex items-center justify-center text-brand-400 shadow-xl">
                <Play className="w-8 h-8 translate-x-0.5" />
              </div>

              <div className="space-y-1 max-w-md">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
                  Anda Belum Memulai Duty
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  Tekan tombol di bawah untuk memulai pencatatan waktu duty Anda secara otomatis.
                </p>
              </div>

              <Link
                href="/duty-in"
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-brand-600 via-red-600 to-brand-700 hover:from-brand-500 hover:to-red-500 text-white font-extrabold text-lg rounded-2xl shadow-xl shadow-brand-600/40 flex items-center justify-center gap-3 transform hover:scale-[1.02] active:scale-95 transition-all"
              >
                <Play className="w-6 h-6 fill-current" />
                <span>MULAI DUTY SEKARANG</span>
              </Link>
            </div>
          ) : (
            /* SEDANG DUTY STATE */
            <div className="space-y-6 py-2">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-100">DUTY SEDANG AKTIF</h3>
                    <p className="text-xs text-slate-400">
                      Dimulai pada:{' '}
                      <strong className="text-slate-200">
                        {formatIndonesianTime(activeDuty.duty_in_time)}
                      </strong>
                    </p>
                  </div>
                </div>

                <Link
                  href="/duty-out"
                  className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all text-sm"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>SELESAI DUTY (DUTY OUT)</span>
                </Link>
              </div>

              {/* Real-time Duty Ticker */}
              <div className="py-4 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-inner">
                <DutyTimer startTime={activeDuty.duty_in_time} />
              </div>

              {/* Proof Duty IN Screenshot Thumbnail */}
              {activeDuty.duty_in_screenshot && (
                <div className="flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400 font-medium">Bukti Screenshot Duty IN:</span>
                  <button
                    onClick={() => setSelectedScreenshot(activeDuty.duty_in_screenshot)}
                    className="text-brand-400 hover:text-brand-300 font-bold flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Lihat Screenshot
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent Personal Duty History Table */}
        <div className="glass-card rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <History className="w-5 h-5 text-brand-400" />
              Riwayat Duty Terbaru
            </h3>
            <Link
              href="/history"
              className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1"
            >
              Lihat Semua <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {recentHistory.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">Belum ada data riwayat duty.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono border-b border-slate-800">
                  <tr>
                    <th className="p-3">Tanggal</th>
                    <th className="p-3">Waktu IN</th>
                    <th className="p-3">Waktu OUT</th>
                    <th className="p-3">Total Durasi</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Bukti</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {recentHistory.map((item) => {
                    const cfg = DUTY_STATUS_CONFIG[item.status] || DUTY_STATUS_CONFIG.BELUM_DUTY;
                    return (
                      <tr key={item.id} className="hover:bg-slate-900/40">
                        <td className="p-3 font-medium">{formatIndonesianDate(item.duty_in_time)}</td>
                        <td className="p-3 font-mono">{formatIndonesianTime(item.duty_in_time)}</td>
                        <td className="p-3 font-mono">
                          {item.duty_out_time ? formatIndonesianTime(item.duty_out_time) : '-'}
                        </td>
                        <td className="p-3 font-mono font-bold text-brand-300">
                          {formatDurationMinutes(item.duration_minutes)}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${cfg.bgClass} ${cfg.textClass} ${cfg.borderClass}`}
                          >
                            {cfg.label}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {item.duty_in_screenshot && (
                            <button
                              onClick={() => setSelectedScreenshot(item.duty_in_screenshot)}
                              className="p-1.5 text-slate-400 hover:text-brand-400 bg-slate-900 border border-slate-800 rounded-lg transition-colors"
                              title="Lihat Screenshot IN"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Interactive Screenshot Preview Modal */}
      <ScreenshotModal
        isOpen={!!selectedScreenshot}
        imageUrl={selectedScreenshot}
        onClose={() => setSelectedScreenshot(null)}
      />
    </div>
  );
}
