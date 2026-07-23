'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import AdminSidebar from '@/components/layout/AdminSidebar';
import ClipboardUploadArea from '@/components/duty/ClipboardUploadArea';
import { compressImage } from '@/lib/imageUtils';
import { Palette, Save, CheckCircle2, AlertCircle, RefreshCw, Image as ImageIcon, Shield, RotateCcw } from 'lucide-react';

export default function AdminSettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [companyName, setCompanyName] = useState('ASE GROUP');
  const [systemName, setSystemName] = useState('ASE Duty Attendance System');
  const [primaryColor, setPrimaryColor] = useState('#DC2626');
  const [secondaryColor, setSecondaryColor] = useState('#1E293B');
  const [accentColor, setAccentColor] = useState('#EF4444');
  const [themeMode, setThemeMode] = useState('BRANDED');
  const [requireDutyInScreenshot, setRequireDutyInScreenshot] = useState(true);
  const [requireDutyOutScreenshot, setRequireDutyOutScreenshot] = useState(true);
  const [systemActive, setSystemActive] = useState(true);

  // Logo handling
  const [currentSavedLogo, setCurrentSavedLogo] = useState<string>('/Logo/TRANSPARENT_ASERP_BLACK_SQUARE.png');
  const [logoBase64, setLogoBase64] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetch(`/api/auth/me?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) setUser(data.user);
        if (data.settings) {
          const s = data.settings;
          setCompanyName(s.company_name || 'ASE GROUP');
          setSystemName(s.system_name || 'ASE Duty Attendance System');
          if (s.logo) setCurrentSavedLogo(s.logo);
          setPrimaryColor(s.primary_color || '#DC2626');
          setSecondaryColor(s.secondary_color || '#1E293B');
          setAccentColor(s.accent_color || '#EF4444');
          setThemeMode(s.theme_mode || 'BRANDED');
          setRequireDutyInScreenshot(s.require_duty_in_screenshot ?? true);
          setRequireDutyOutScreenshot(s.require_duty_out_screenshot ?? true);
          setSystemActive(s.system_active ?? true);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLogoUpload = async (rawImg: string | null) => {
    if (!rawImg) {
      setLogoBase64(null);
      return;
    }
    // Compress image to lightweight max 600px canvas to guarantee <100KB payload & fast loads
    try {
      const compressed = await compressImage(rawImg, 600, 600, 0.85);
      setLogoBase64(compressed);
    } catch (e) {
      setLogoBase64(rawImg);
    }
  };

  const handleResetLogo = () => {
    const defaultLogo = '/Logo/TRANSPARENT_ASERP_BLACK_SQUARE.png';
    setLogoBase64(defaultLogo);
    setCurrentSavedLogo(defaultLogo);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSaving(true);

    try {
      const finalLogo = logoBase64 || currentSavedLogo;

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName,
          system_name: systemName,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          accent_color: accentColor,
          theme_mode: themeMode,
          require_duty_in_screenshot: requireDutyInScreenshot,
          require_duty_out_screenshot: requireDutyOutScreenshot,
          system_active: systemActive,
          logo_base64: finalLogo,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Gagal memperbarui pengaturan.');
        setSaving(false);
        return;
      }

      // Update local state to reflect the saved logo
      if (finalLogo) {
        setCurrentSavedLogo(finalLogo);
        setLogoBase64(null); // Clear pending upload since it's now saved
      }

      // Safe update localStorage - clear first to avoid quota issues
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('ase_system_logo');
          localStorage.removeItem('ase_system_name');
        } catch (e) {}
        try {
          if (finalLogo) localStorage.setItem('ase_system_logo', finalLogo);
          if (systemName) localStorage.setItem('ase_system_name', systemName);
        } catch (e) {
          console.error('LocalStorage quota error ignored:', e);
        }
      }

      setSuccessMsg('Pengaturan branding dan logo sistem berhasil disimpan!');
      window.dispatchEvent(new Event('systemSettingsUpdated'));

      setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (err) {
      setErrorMsg('Terjadi kesalahan jaringan.');
    } finally {
      setSaving(false);
    }
  };

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
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 flex items-center gap-2">
              <Palette className="w-6 h-6 text-brand-400" />
              Pengaturan Branding & Tema Perusahaan
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Sesuaikan nama perusahaan, logo aktif di semua menu, skema warna, tema, dan aturan absensi.
            </p>
          </div>

          <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
            {errorMsg && (
              <div className="p-4 bg-red-950/70 border border-red-800/80 rounded-2xl flex items-center gap-3 text-red-300 text-xs">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-4 bg-emerald-950/70 border border-emerald-800/80 rounded-2xl flex items-center gap-3 text-emerald-300 text-xs">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Active Current Logo Showcase */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-brand-400" />
                    Logo Utama Aktif (Akan Muncul di Seluruh Menu)
                  </span>
                  <button
                    type="button"
                    onClick={handleResetLogo}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset Logo Default
                  </button>
                </div>

                <div className="flex items-center gap-4 pt-1">
                  <div className="relative p-[2px] rounded-2xl bg-gradient-to-r from-red-600 via-amber-400 to-red-600 shadow-xl overflow-hidden">
                    <div className="relative h-16 w-auto flex items-center justify-center p-2 rounded-[14px] bg-gradient-to-b from-slate-100 via-slate-200 to-slate-300 border border-slate-300">
                      <img
                        src={logoBase64 || currentSavedLogo}
                        alt="Logo Aktif Perusahaan"
                        className="h-full w-auto object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/Logo/TRANSPARENT_ASERP_BLACK_SQUARE.png';
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200">
                      {logoBase64 ? '⚡ Logo Baru Siap Disimpan' : 'Logo Aktif Saat Ini'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Logo ini ditampilkan di Navbar header, Halaman Login, dan seluruh Panel Admin/Member.
                    </p>
                  </div>
                </div>
              </div>

              {/* Company Identity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase">
                    Nama Perusahaan / Organisasi
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase">
                    Nama Sistem Absensi
                  </label>
                  <input
                    type="text"
                    value={systemName}
                    onChange={(e) => setSystemName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100"
                  />
                </div>
              </div>

              {/* Theme & Colors */}
              <div className="pt-4 border-t border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-slate-200">Sistem Tema & Warna UI</h3>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                      Mode Tema Bawaan
                    </label>
                    <select
                      value={themeMode}
                      onChange={(e) => setThemeMode(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 font-bold"
                    >
                      <option value="BRANDED">Branded Theme (ASE Obsidian Crimson)</option>
                      <option value="DARK">Dark Slate Theme</option>
                      <option value="LIGHT">Light Theme</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                      Warna Utama (Primary)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-9 h-9 rounded bg-transparent border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="flex-1 p-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                      Warna Sekunder
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-9 h-9 rounded bg-transparent border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="flex-1 p-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                      Warna Aksens
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="w-9 h-9 rounded bg-transparent border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="flex-1 p-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-100"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Attendance Rules & Maintenance Mode */}
              <div className="pt-4 border-t border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-slate-200">Aturan Absensi & Status Sistem</h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <label className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requireDutyInScreenshot}
                      onChange={(e) => setRequireDutyInScreenshot(e.target.checked)}
                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 bg-slate-950"
                    />
                    <span className="font-semibold text-slate-200">Wajib Screenshot Duty IN</span>
                  </label>

                  <label className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requireDutyOutScreenshot}
                      onChange={(e) => setRequireDutyOutScreenshot(e.target.checked)}
                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 bg-slate-950"
                    />
                    <span className="font-semibold text-slate-200">Wajib Screenshot Duty OUT</span>
                  </label>

                  <label className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={systemActive}
                      onChange={(e) => setSystemActive(e.target.checked)}
                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 bg-slate-950"
                    />
                    <span className="font-semibold text-slate-200">
                      Sistem Aktif (Uncheck untuk Maintenance)
                    </span>
                  </label>
                </div>
              </div>

              {/* Logo Image Upload */}
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase">
                  Unggah / Replace Logo Perusahaan Baru (Opsional)
                </label>
                <ClipboardUploadArea
                  onImageSelected={handleLogoUpload}
                  label="Upload Berkas Logo Baru"
                  required={false}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-4 bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-brand-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                <span>{saving ? 'Menyimpan Settings...' : 'SIMPAN PENGATURAN BRANDING'}</span>
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
