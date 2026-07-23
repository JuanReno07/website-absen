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

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) setUser(data.user);
        fetch('/api/admin/audit-logs')
          .then((r) => r.json())
          .then((d) => {
            setLogs(d.logs || []);
            setLoading(false);
          });
      })
      .catch(() => setLoading(false));
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
            {loading ? (
              <div className="py-12 flex justify-center">
                <div className="w-8 h-8 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin"></div>
              </div>
            ) : logs.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">Belum ada catatan audit log.</div>
            ) : (
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
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-900/40 font-mono">
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
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
