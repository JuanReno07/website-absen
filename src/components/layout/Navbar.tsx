'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Clock,
  History,
  User,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Shield,
  Calendar,
} from 'lucide-react';

interface NavbarProps {
  user: {
    id: string;
    username: string;
    role: string;
    discord_name: string;
    position_name: string;
  } | null;
  activeDuty: any | null;
  systemName?: string;
  logoUrl?: string;
}

export default function Navbar({
  user,
  activeDuty,
  systemName: initialSystemName,
  logoUrl: initialLogoUrl,
}: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentLogo, setCurrentLogo] = useState(
    initialLogoUrl || '/Logo/TRANSPARENT_ASERP_BLACK_SQUARE.png'
  );
  const [currentSystemName, setCurrentSystemName] = useState(
    initialSystemName || 'ASE Duty System'
  );

  const loadSettings = () => {
    fetch(`/api/admin/settings?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          if (data.settings.logo) setCurrentLogo(data.settings.logo);
          if (data.settings.system_name) setCurrentSystemName(data.settings.system_name);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadSettings();

    const handleSettingsEvent = () => loadSettings();
    window.addEventListener('systemSettingsUpdated', handleSettingsEvent);
    return () => {
      window.removeEventListener('systemSettingsUpdated', handleSettingsEvent);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/history', label: 'Riwayat Duty', icon: History },
    { href: '/leave', label: 'Pengajuan Izin', icon: Calendar },
    { href: '/profile', label: 'Profil Saya', icon: User },
  ];

  if (user?.role === 'ADMIN') {
    navLinks.push({ href: '/admin', label: 'Panel Admin', icon: Shield });
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & System Name */}
          <Link href={user ? '/dashboard' : '/login'} className="flex items-center gap-3 group">
            {/* Outer Spinning Glow Ring Container */}
            <div className="relative p-[2px] rounded-2xl bg-gradient-to-r from-red-600 via-amber-500 to-red-600 shadow-lg shadow-red-600/30 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-amber-400 to-red-700 animate-spin-slow opacity-80"></div>
              
              {/* Inner High-Contrast Light Badge */}
              <div className="relative h-11 sm:h-13 w-auto flex items-center justify-center p-1.5 rounded-[14px] bg-gradient-to-b from-slate-100 via-slate-200 to-slate-300 border border-slate-300">
                <img
                  src={currentLogo}
                  alt="Logo Perusahaan"
                  className="h-full w-auto object-contain animate-logo-3d drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/Logo/TRANSPARENT_ASERP_BLACK_SQUARE.png';
                  }}
                />
              </div>
            </div>

            <div className="hidden sm:block">
              <span className="text-base font-extrabold text-slate-100 tracking-wide block leading-none">
                {currentSystemName}
              </span>
              <span className="text-[11px] font-bold text-brand-400 tracking-widest uppercase mt-1 block">
                ASE ROLEPLAY
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          {user && (
            <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800/90 shadow-inner">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname?.startsWith(`${link.href}`));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-brand-600 to-red-700 text-white shadow-md shadow-brand-600/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Active Duty Indicator & User Profile Pill */}
          {user ? (
            <div className="flex items-center gap-3">
              {/* Duty Status Badge */}
              {activeDuty ? (
                <Link
                  href="/duty-out"
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/90 border border-emerald-500/50 text-emerald-400 text-xs font-extrabold animate-pulse hover:bg-emerald-900/80 transition-colors shadow-lg shadow-emerald-950/50"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="hidden sm:inline">SEDANG DUTY</span>
                </Link>
              ) : (
                <Link
                  href="/duty-in"
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-600 to-red-700 hover:from-brand-500 hover:to-red-600 text-white text-xs font-extrabold shadow-lg shadow-brand-600/30 transition-all"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>MULAI DUTY</span>
                </Link>
              )}

              {/* User Pill */}
              <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-800">
                <div className="text-right">
                  <p className="text-xs font-extrabold text-slate-100 truncate max-w-[140px]">
                    {user.discord_name}
                  </p>
                  <p className="text-[10px] text-brand-400 font-bold truncate max-w-[140px]">
                    {user.position_name}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile Menu Toggle Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-xl"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 bg-gradient-to-r from-brand-600 to-red-700 hover:from-brand-500 hover:to-red-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-600/30 transition-all"
            >
              Login
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {user && mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-3">
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 mb-2">
            <p className="text-sm font-bold text-slate-100">{user.discord_name}</p>
            <p className="text-xs text-brand-400 font-medium">{user.position_name}</p>
          </div>

          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-brand-600 text-white'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-950/40 border border-red-900/50 text-red-400 font-semibold rounded-xl text-sm hover:bg-red-900/50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Keluar / Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
