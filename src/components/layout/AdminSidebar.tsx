'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CalendarCheck,
  Calendar,
  FileSpreadsheet,
  ShieldAlert,
  Palette,
  ArrowLeft,
} from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { href: '/admin', label: 'Dashboard Overview', icon: LayoutDashboard },
    { href: '/admin/members', label: 'Data Anggota', icon: Users },
    { href: '/admin/positions', label: 'Jabatan Organisasi', icon: Briefcase },
    { href: '/admin/attendances', label: 'Data Absensi', icon: CalendarCheck },
    { href: '/admin/leaves', label: 'Persetujuan Izin', icon: Calendar },
    { href: '/admin/recap', label: 'Rekap Jam & Ekspor', icon: FileSpreadsheet },
    { href: '/admin/audit-logs', label: 'Audit Log Trail', icon: ShieldAlert },
    { href: '/admin/settings', label: 'Branding & Theme', icon: Palette },
  ];

  return (
    <aside className="w-full lg:w-64 flex-shrink-0 bg-slate-950/80 border-r border-slate-800 p-4 space-y-6">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Panel Pentadbir / Admin
        </span>
        <Link
          href="/dashboard"
          className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Member Area
        </Link>
      </div>

      <nav className="space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30 font-bold'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
