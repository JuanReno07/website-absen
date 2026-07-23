'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import ScreenshotModal from '@/components/duty/ScreenshotModal';
import { History, Calendar, Filter, ExternalLink, Search, Clock, FileText } from 'lucide-react';
import {
  formatIndonesianDate,
  formatIndonesianTime,
  formatDurationMinutes,
  DUTY_STATUS_CONFIG,
} from '@/lib/utils';

export default function PersonalHistoryPage() {
  const [user, setUser] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [period, setPeriod] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedScreenshot, setSelectedScreenshot] = useState<{ url: string; title: string } | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const authRes = await fetch('/api/auth/me');
      const authData = await authRes.json();
      if (authData.authenticated) setUser(authData.user);

      const params = new URLSearchParams();
      if (period !== 'all') params.append('period', period);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      const res = await fetch(`/api/duty/history?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setHistory(data.history || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [period, statusFilter]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar user={user} activeDuty={null} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 flex items-center gap-2">
              <History className="w-6 h-6 text-brand-400" />
              Riwayat Absensi Duty Pribadi
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Daftar seluruh rekam jejak jam kerja Duty IN & Duty OUT Anda.
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 p-2 rounded-2xl border border-slate-800 w-full sm:w-auto">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500"
            >
              <option value="all">Semua Waktu</option>
              <option value="today">Hari Ini</option>
              <option value="week">Minggu Ini (7 Hari)</option>
              <option value="month">Bulan Ini (30 Hari)</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="SEDANG_DUTY">Sedang Duty</option>
              <option value="DUTY_SELESAI">Duty Selesai</option>
              <option value="PERLU_PEMERIKSAAN">Perlu Pemeriksaan</option>
              <option value="DIBATALKAN_ADMIN">Dibatalkan Admin</option>
            </select>
          </div>
        </div>

        {/* Content Container */}
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center text-slate-400 space-y-2">
            <Clock className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold">Tidak Ada Data Riwayat Duty</p>
            <p className="text-xs text-slate-500">
              Coba sesuaikan filter rentang waktu atau status di atas.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block glass-card rounded-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono border-b border-slate-800">
                    <tr>
                      <th className="p-4">Tanggal</th>
                      <th className="p-4">Duty IN</th>
                      <th className="p-4">Duty OUT</th>
                      <th className="p-4">Total Durasi</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Bukti IN / OUT</th>
                      <th className="p-4">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {history.map((item) => {
                      const cfg = DUTY_STATUS_CONFIG[item.status] || DUTY_STATUS_CONFIG.BELUM_DUTY;
                      return (
                        <tr key={item.id} className="hover:bg-slate-900/50">
                          <td className="p-4 font-medium">{formatIndonesianDate(item.duty_in_time)}</td>
                          <td className="p-4 font-mono">{formatIndonesianTime(item.duty_in_time)}</td>
                          <td className="p-4 font-mono">
                            {item.duty_out_time ? formatIndonesianTime(item.duty_out_time) : '-'}
                          </td>
                          <td className="p-4 font-mono font-bold text-brand-300">
                            {formatDurationMinutes(item.duration_minutes)}
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${cfg.bgClass} ${cfg.textClass} ${cfg.borderClass}`}
                            >
                              {cfg.label}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {item.duty_in_screenshot && (
                                <button
                                  onClick={() =>
                                    setSelectedScreenshot({
                                      url: item.duty_in_screenshot,
                                      title: 'Bukti Duty IN',
                                    })
                                  }
                                  className="px-2 py-1 bg-slate-900 border border-slate-700 hover:border-brand-500 rounded text-[11px] font-medium text-brand-400 flex items-center gap-1"
                                >
                                  <ExternalLink className="w-3 h-3" /> IN
                                </button>
                              )}
                              {item.duty_out_screenshot && (
                                <button
                                  onClick={() =>
                                    setSelectedScreenshot({
                                      url: item.duty_out_screenshot,
                                      title: 'Bukti Duty OUT',
                                    })
                                  }
                                  className="px-2 py-1 bg-slate-900 border border-slate-700 hover:border-red-500 rounded text-[11px] font-medium text-red-400 flex items-center gap-1"
                                >
                                  <ExternalLink className="w-3 h-3" /> OUT
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="p-4 max-w-xs truncate text-slate-400">
                            {item.admin_note ? (
                              <span className="text-amber-400">Admin: {item.admin_note}</span>
                            ) : (
                              item.user_note || '-'
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden space-y-3">
              {history.map((item) => {
                const cfg = DUTY_STATUS_CONFIG[item.status] || DUTY_STATUS_CONFIG.BELUM_DUTY;
                return (
                  <div key={item.id} className="glass-card rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-100">
                        {formatIndonesianDate(item.duty_in_time)}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${cfg.bgClass} ${cfg.textClass} ${cfg.borderClass}`}
                      >
                        {cfg.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-2.5 rounded-xl text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-500 block">IN</span>
                        <span className="font-bold">{formatIndonesianTime(item.duty_in_time)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">OUT</span>
                        <span className="font-bold">
                          {item.duty_out_time ? formatIndonesianTime(item.duty_out_time) : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">DURASI</span>
                        <span className="font-bold text-brand-400">
                          {formatDurationMinutes(item.duration_minutes)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        {item.duty_in_screenshot && (
                          <button
                            onClick={() =>
                              setSelectedScreenshot({
                                url: item.duty_in_screenshot,
                                title: 'Bukti Duty IN',
                              })
                            }
                            className="px-2.5 py-1 bg-slate-900 border border-slate-700 text-brand-400 rounded text-xs font-medium flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" /> Proof IN
                          </button>
                        )}
                        {item.duty_out_screenshot && (
                          <button
                            onClick={() =>
                              setSelectedScreenshot({
                                url: item.duty_out_screenshot,
                                title: 'Bukti Duty OUT',
                              })
                            }
                            className="px-2.5 py-1 bg-slate-900 border border-slate-700 text-red-400 rounded text-xs font-medium flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" /> Proof OUT
                          </button>
                        )}
                      </div>
                      {item.admin_note && (
                        <span className="text-[10px] text-amber-400 italic">Ada Catatan Admin</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      <ScreenshotModal
        isOpen={!!selectedScreenshot}
        imageUrl={selectedScreenshot?.url || null}
        title={selectedScreenshot?.title}
        onClose={() => setSelectedScreenshot(null)}
      />
    </div>
  );
}
