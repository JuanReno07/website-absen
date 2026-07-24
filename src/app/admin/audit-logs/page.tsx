'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { ShieldAlert, Clock, User, FileText, Database } from 'lucide-react';
import { formatIndonesianDate, formatIndonesianTime } from '@/lib/utils';

export default function AdminAuditLogsPage() {
  const [user, setUser] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/audit-logs');
      const data = await res.json();
      if (res.ok) {
        setLogs(data.logs || []);
      } else if (res.status === 403 || res.status === 401) {
        window.location.href = '/dashboard';
      }
    } catch (e) {
      console.error('Fetch audit logs error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar user={user} activeDuty={null} />

      <div className="flex-1 flex flex-col lg:flex-row">
        <AdminSidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-brand-400" />
              Audit Log Trail Sistem
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Rekam jejak seluruh perubahan data, koreksi absensi, dan aktivitas admin.
            </p>
          </div>

          <div className="glass-card rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono border-b border-slate-800">
                  <tr>
                    <th className="p-4">Waktu</th>
                    <th className="p-4">Admin Executed</th>
                    <th className="p-4">Aksi</th>
                    <th className="p-4">Tabel Database</th>
                    <th className="p-4">Perubahan Data (JSON)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200 font-mono">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="p-4"><div className="w-36 h-4 bg-slate-800/80 rounded-lg"></div></td>
                        <td className="p-4"><div className="w-28 h-4 bg-slate-800/80 rounded-lg"></div></td>
                        <td className="p-4"><div className="w-24 h-4 bg-slate-800/80 rounded-lg"></div></td>
                        <td className="p-4"><div className="w-20 h-4 bg-slate-800/80 rounded-lg"></div></td>
                        <td className="p-4"><div className="w-48 h-4 bg-slate-800/80 rounded-lg"></div></td>
                      </tr>
                    ))
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500 font-sans">
                        Belum ada catatan audit log.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-900/40">
                        <td className="p-4 text-slate-400">
                          {formatIndonesianDate(log.created_at)}, {formatIndonesianTime(log.created_at)}
                        </td>
                        <td className="p-4 font-bold text-brand-400">
                          {log.admin?.discord_name || log.admin?.username || 'SYSTEM'}
                        </td>
                        <td className="p-4 font-bold text-slate-100">{log.action}</td>
                        <td className="p-4 text-slate-400">{log.table_name}</td>
                        <td className="p-4 max-w-xs truncate text-[11px] text-slate-400">
                          {log.new_data || log.old_data || '-'}
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
    </div>
  );
}
