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

  const DEFAULT_LOGO = '/Logo/TRANSPARENT_ASERP_BLACK_SQUARE.png';
  const DEFAULT_NAME = 'ASE Duty System';

  // Instant 0ms pre-hydration from localStorage to eliminate old logo flash
  const [currentLogo, setCurrentLogo] = useState<string>(() => {
    if (initialLogoUrl) return initialLogoUrl;
    if (typeof window !== 'undefined') {
      try {
        const cachedLogo = localStorage.getItem('ase_system_logo');
        if (cachedLogo) return cachedLogo;
      } catch (e) {}
    }
    return DEFAULT_LOGO;
  });

  const [currentSystemName, setCurrentSystemName] = useState<string>(() => {
    if (initialSystemName) return initialSystemName;
    if (typeof window !== 'undefined') {
      try {
        const cachedName = localStorage.getItem('ase_system_name');
        if (cachedName) return cachedName;
      } catch (e) {}
    }
    return DEFAULT_NAME;
  });

  const loadSettings = () => {
    fetch(`/api/auth/me?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          // Always update logo from database - this is the source of truth
          const newLogo = data.settings.logo || DEFAULT_LOGO;
          setCurrentLogo(newLogo);
          try {
            // Only cache non-base64 logos in localStorage (base64 can exceed quota)
            if (!newLogo.startsWith('data:')) {
              localStorage.setItem('ase_system_logo', newLogo);
            } else {
              // For base64 logos, try to cache but silently handle quota errors
              localStorage.setItem('ase_system_logo', newLogo);
            }
          } catch (e) {
            // localStorage quota exceeded - clear old cache to make room
            try { localStorage.removeItem('ase_system_logo'); } catch (ex) {}
          }

          const newName = data.settings.system_name || DEFAULT_NAME;
          setCurrentSystemName(newName);
          try {
            localStorage.setItem('ase_system_name', newName);
          } catch (e) {}
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadSettings();

    // Listen for settings update event (same tab)
    const handleSettingsEvent = () => loadSettings();
    window.addEventListener('systemSettingsUpdated', handleSettingsEvent);

    // Listen for storage changes (cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ase_system_logo' && e.newValue) {
        setCurrentLogo(e.newValue);
      }
      if (e.key === 'ase_system_name' && e.newValue) {
        setCurrentSystemName(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('systemSettingsUpdated', handleSettingsEvent);
      window.removeEventListener('storage', handleStorageChange);
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
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* Logo & System Name */}
          <Link href={user ? '/dashboard' : '/login'} className="flex items-center gap-3 group shrink-0">
            {/* Outer Spinning Glow Ring Container */}
            <div className="relative p-[2px] rounded-2xl bg-gradient-to-r from-red-600 via-amber-500 to-red-600 shadow-lg shadow-red-600/30 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-amber-400 to-red-700 animate-spin-slow opacity-80"></div>
              
              {/* Inner High-Contrast Light Badge */}
              <div className="relative h-10 sm:h-12 w-auto flex items-center justify-center p-1.5 rounded-[14px] bg-gradient-to-b from-slate-100 via-slate-200 to-slate-300 border border-slate-300">
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
              <span className="text-sm sm:text-base font-extrabold text-slate-100 tracking-wide block leading-tight whitespace-nowrap">
                {currentSystemName}
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold text-brand-400 tracking-widest uppercase mt-0.5 block whitespace-nowrap">
                ASE ROLEPLAY
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          {user && (
            <nav className="hidden xl:flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800/90 shadow-inner shrink-0">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname?.startsWith(`${link.href}`));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-slate-800 text-brand-400 border border-brand-500/40 shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-brand-400" />
                    <span className="whitespace-nowrap">{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Active Duty Indicator & User Profile Pill */}
          {user ? (
            <div className="flex items-center gap-3 shrink-0">
              {/* Duty Status Badge */}
              {activeDuty ? (
                <Link
                  href="/duty-out"
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/90 border border-emerald-500/50 text-emerald-400 text-xs font-extrabold animate-pulse hover:bg-emerald-900/80 transition-colors shadow-lg shadow-emerald-950/50 whitespace-nowrap"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="whitespace-nowrap">SEDANG DUTY</span>
                </Link>
              ) : (
                <Link
                  href="/duty-in"
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-600 to-red-700 hover:from-brand-500 hover:to-red-600 text-white text-xs font-extrabold shadow-lg shadow-brand-600/30 transition-all whitespace-nowrap"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span className="whitespace-nowrap">MULAI DUTY</span>
                </Link>
              )}

              {/* User Pill */}
              <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-800">
                <div className="text-right">
                  <p className="text-xs font-extrabold text-slate-100 truncate max-w-[140px] whitespace-nowrap">
                    {user.discord_name}
                  </p>
                  <p className="text-[10px] text-brand-400 font-bold truncate max-w-[140px] whitespace-nowrap">
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
                className="xl:hidden p-2 text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-xl"
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
