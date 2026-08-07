'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import {
  FileText,
  PlusCircle,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Image as ImageIcon,
  Upload,
  Trash2,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  Tag,
  MessageSquare,
} from 'lucide-react';

interface ReportItem {
  id: string;
  title: string;
  category: string;
  content: string;
  screenshots: string; // JSON string
  status: 'MENUNGGU_DITANGGAPI' | 'DIPROSES' | 'SELESAI' | 'DITOLAK' | string;
  admin_note?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export default function UserReportsPage() {
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Laporan Kegiatan');
  const [content, setContent] = useState('');
  const [screenshots, setScreenshots] = useState<string[]>([]);

  // Modal Detail states
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [previewImageIndex, setPreviewImageIndex] = useState<number | null>(null);

  const categories = [
    'Laporan Kerja Harian',
    'Patroli & Pengawasan',
    'Penanganan Kasus / Pasien',
    'Rapat & Koordinasi',
    'Kendala Teknis',
    'Lainnya',
  ];

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
        }
      })
      .catch((err) => console.error(err));
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      if (res.ok && data.reports) {
        setReports(data.reports);
      }
    } catch (err) {
      console.error('Fetch reports error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Paste (Ctrl + V) from Clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (activeTab !== 'create') return;

      const items = e.clipboardData?.items;
      if (!items) return;

      const newScreenshots: string[] = [];
      let processed = 0;
      let totalImageItems = 0;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          totalImageItems++;
        }
      }

      if (totalImageItems === 0) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            if (blob.size > 8 * 1024 * 1024) {
              alert('Foto clipboard melebihi batas 8MB.');
              continue;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
              if (event.target?.result) {
                newScreenshots.push(event.target.result as string);
              }
              processed++;
              if (processed === totalImageItems) {
                setScreenshots((prev) => [...prev, ...newScreenshots]);
              }
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [activeTab]);

  // Multiple File Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newScreenshots: string[] = [];
    let processedCount = 0;

    Array.from(files).forEach((file) => {
      if (file.size > 8 * 1024 * 1024) {
        alert(`File ${file.name} melebihi batas 8MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newScreenshots.push(event.target.result as string);
        }
        processedCount++;
        if (processedCount === files.length) {
          setScreenshots((prev) => [...prev, ...newScreenshots]);
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const removeScreenshot = (index: number) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!title.trim()) {
      setErrorMsg('Silakan isi judul laporan.');
      return;
    }

    if (!content.trim()) {
      setErrorMsg('Silakan isi isi/deskripsi rincian laporan.');
      return;
    }

    if (screenshots.length === 0) {
      setErrorMsg('Minimal unggah 1 foto screenshot sebagai bukti.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          content,
          screenshots,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengirimkan laporan.');
      }

      setSuccessMsg('Laporan Anda berhasil dikirimkan!');
      setTitle('');
      setCategory('Laporan Kegiatan');
      setContent('');
      setScreenshots([]);
      fetchReports();
      setActiveTab('list');
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  const parseScreenshots = (jsonStr: string): string[] => {
    try {
      const parsed = JSON.parse(jsonStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'MENUNGGU_DITANGGAPI':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" /> Menunggu Tanggapan
          </span>
        );
      case 'DIPROSES':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <AlertCircle className="w-3.5 h-3.5" /> Sedang Diproses
          </span>
        );
      case 'SELESAI':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle className="w-3.5 h-3.5" /> Selesai
          </span>
        );
      case 'DITOLAK':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" /> Ditolak
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-slate-500/20 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col">
      <Navbar user={user} activeDuty={null} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {/* Title Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60 backdrop-blur-xl shadow-2xl">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-red-600/20 rounded-xl border border-red-500/30 text-red-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-wide">Pusat Laporan Anggota</h1>
                <p className="text-sm text-slate-400">Kirim laporan kegiatan, kejadian, atau kendala dengan lampiran foto bukti multi-screenshot.</p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-700/80">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'create'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Buat Laporan Baru
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'list'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              Riwayat Laporan ({reports.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Create New Report */}
        {activeTab === 'create' && (
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 md:p-8 backdrop-blur-xl shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-700/60 pb-4">
              <PlusCircle className="w-5 h-5 text-red-500" /> Form Buat Laporan Baru
            </h2>

            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-3">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitReport} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Title */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-semibold text-slate-300">
                    Judul Laporan <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Laporan Penanganan Kasus / Kendala Teknis"
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">
                    Kategori Laporan <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat} className="bg-slate-900 text-white">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">
                  Isi / Rincian Laporan <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Tuliskan kronologi, rincian kegiatan, atau kendala selengkap mungkin..."
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors resize-y"
                />
              </div>

              {/* Multiple Screenshot Upload */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-300 flex items-center justify-between">
                  <span>
                    Foto Bukti Screenshot <span className="text-red-400">*</span> (Bisa Lebih Dari 1 Foto)
                  </span>
                  <span className="text-xs text-slate-400 font-normal">
                    Terunggah: {screenshots.length} foto
                  </span>
                </label>

                {/* Upload Zone */}
                <div className="relative border-2 border-dashed border-slate-700 hover:border-red-500/60 rounded-2xl p-6 text-center bg-slate-900/40 hover:bg-slate-900/80 transition-all group">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="p-3 bg-red-600/10 rounded-full text-red-400 group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-200 flex items-center justify-center gap-1.5 flex-wrap">
                      <span>Klik / Seret foto ke sini, atau tekan</span>
                      <span className="text-red-400 font-mono bg-red-950/70 border border-red-800/60 px-2 py-0.5 rounded text-xs shadow-sm">Ctrl + V</span>
                      <span>untuk Paste screenshot</span>
                    </p>
                    <p className="text-xs text-slate-400">
                      Mendukung screenshot instan (Win + Shift + S) & multi-file PNG/JPG (Max 8MB/foto)
                    </p>
                  </div>
                </div>

                {/* Screenshots Preview Grid */}
                {screenshots.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pt-4">
                    {screenshots.map((src, idx) => (
                      <div
                        key={idx}
                        className="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-900 aspect-video shadow-md"
                      >
                        <img
                          src={src}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => removeScreenshot(idx)}
                            className="p-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors"
                            title="Hapus Foto Ini"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <span className="absolute bottom-1.5 left-1.5 bg-slate-950/80 text-white text-[10px] px-2 py-0.5 rounded-full border border-slate-700">
                          Foto {idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold shadow-lg shadow-red-600/30 disabled:opacity-50 transition-all"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Mengirim Laporan...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" /> Kirim Laporan Sekarang
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Reports History List */}
        {activeTab === 'list' && (
          <div className="space-y-4">
            {loading ? (
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Memuat daftar laporan Anda...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-12 text-center">
                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">Belum Ada Laporan</h3>
                <p className="text-sm text-slate-400 mb-6">Anda belum pernah membuat laporan kegiatan atau kejadian.</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-500 transition-colors"
                >
                  <PlusCircle className="w-4 h-4" /> Buat Laporan Pertama
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {reports.map((report) => {
                  const shotList = parseScreenshots(report.screenshots);
                  return (
                    <div
                      key={report.id}
                      className="bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/60 rounded-2xl p-6 transition-all shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6"
                    >
                      <div className="space-y-3 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {getStatusBadge(report.status)}
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-700/60 text-slate-300 border border-slate-600/40">
                            <Tag className="w-3 h-3 text-red-400" /> {report.category}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(report.created_at).toLocaleString('id-ID', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-white tracking-wide">{report.title}</h3>
                        <p className="text-sm text-slate-300 line-clamp-2">{report.content}</p>

                        {/* Admin Note if any */}
                        {report.admin_note && (
                          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-slate-300 flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold text-amber-400">Tanggapan Admin ({report.reviewed_by || 'Admin'}):</span>{' '}
                              <span>{report.admin_note}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right action area */}
                      <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-slate-700/60 pt-4 md:pt-0 md:pl-6 shrink-0">
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                          <ImageIcon className="w-4 h-4 text-slate-400" /> {shotList.length} Foto Bukti
                        </div>
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-sm transition-colors"
                        >
                          <Eye className="w-4 h-4 text-red-400" /> Detail Laporan
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Report Detail & Screenshots Gallery Modal */}
        {selectedReport && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl space-y-6">
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(selectedReport.status)}
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {selectedReport.category}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white">{selectedReport.title}</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Dikirim pada: {new Date(selectedReport.created_at).toLocaleString('id-ID')}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Rincian Laporan:</h4>
                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-sm text-slate-200 whitespace-pre-wrap">
                    {selectedReport.content}
                  </div>
                </div>

                {/* Screenshots Gallery */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Foto Bukti Screenshots ({parseScreenshots(selectedReport.screenshots).length} Foto):
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {parseScreenshots(selectedReport.screenshots).map((src, idx) => (
                      <div
                        key={idx}
                        onClick={() => setPreviewImageIndex(idx)}
                        className="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-950 aspect-video cursor-pointer"
                      >
                        <img src={src} alt={`Bukti ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Admin Note if reviewed */}
                {selectedReport.admin_note && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm space-y-1">
                    <div className="font-semibold flex items-center gap-2 text-amber-400">
                      <MessageSquare className="w-4 h-4" /> Tanggapan Admin ({selectedReport.reviewed_by || 'Admin'}):
                    </div>
                    <p className="text-slate-200">{selectedReport.admin_note}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Fullscreen Image Lightbox */}
        {selectedReport && previewImageIndex !== null && (
          <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-4">
            <button
              onClick={() => setPreviewImageIndex(null)}
              className="absolute top-4 right-4 p-3 bg-slate-800/80 text-white rounded-xl hover:bg-slate-700 transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation buttons */}
            {parseScreenshots(selectedReport.screenshots).length > 1 && (
              <>
                <button
                  onClick={() =>
                    setPreviewImageIndex((prev) =>
                      prev === null || prev === 0
                        ? parseScreenshots(selectedReport.screenshots).length - 1
                        : prev - 1
                    )
                  }
                  className="absolute left-4 p-3 bg-slate-800/80 text-white rounded-xl hover:bg-slate-700 transition-colors z-10"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() =>
                    setPreviewImageIndex((prev) =>
                      prev === null || prev === parseScreenshots(selectedReport.screenshots).length - 1
                        ? 0
                        : prev + 1
                    )
                  }
                  className="absolute right-4 p-3 bg-slate-800/80 text-white rounded-xl hover:bg-slate-700 transition-colors z-10"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            <div className="max-w-4xl max-h-[80vh] w-full h-full flex items-center justify-center p-2">
              <img
                src={parseScreenshots(selectedReport.screenshots)[previewImageIndex]}
                alt="Full Preview"
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl border border-slate-700"
              />
            </div>

            <p className="text-slate-400 text-sm mt-4">
              Foto {previewImageIndex + 1} dari {parseScreenshots(selectedReport.screenshots).length}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
