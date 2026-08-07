'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import AdminSidebar from '@/components/layout/AdminSidebar';
import {
  FileText,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  Tag,
  User as UserIcon,
  MessageSquare,
  RefreshCw,
  ImageIcon,
} from 'lucide-react';

interface ReportItem {
  id: string;
  title: string;
  category: string;
  content: string;
  screenshots: string;
  status: 'MENUNGGU_DITANGGAPI' | 'DIPROSES' | 'SELESAI' | 'DITOLAK' | string;
  admin_note?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  user: {
    id: string;
    username: string;
    discord_name: string;
    ooc_name: string;
    steam_hex: string;
    position?: { name: string };
  };
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modal States
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [adminNote, setAdminNote] = useState('');
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
  }, [statusFilter, categoryFilter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
      if (search.trim()) params.append('search', search.trim());

      const res = await fetch(`/api/admin/reports?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.reports) {
        setReports(data.reports);
      }
    } catch (err) {
      console.error('Fetch admin reports error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports();
  };

  const openDetailModal = (report: ReportItem) => {
    setSelectedReport(report);
    setNewStatus(report.status);
    setAdminNote(report.admin_note || '');
  };

  const handleUpdateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    setUpdating(true);
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedReport.id,
          status: newStatus,
          admin_note: adminNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memperbarui status laporan.');
      }

      alert('Tanggapan laporan berhasil disimpan!');
      setSelectedReport(null);
      fetchReports();
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setUpdating(false);
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
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" /> Menunggu
          </span>
        );
      case 'DIPROSES':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <AlertCircle className="w-3 h-3" /> Diproses
          </span>
        );
      case 'SELESAI':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle className="w-3 h-3" /> Selesai
          </span>
        );
      case 'DITOLAK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3 h-3" /> Ditolak
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-500/20 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col">
      <Navbar user={user} activeDuty={null} />

      <div className="flex-1 flex flex-col lg:flex-row w-full px-4 sm:px-6 lg:px-8 py-8 gap-6 lg:gap-8">
        <AdminSidebar />

        <main className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-600/20 rounded-xl border border-red-500/30 text-red-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-wide">Kelola Laporan Anggota</h1>
                <p className="text-sm text-slate-400">Tinjau, periksa bukti multi-screenshot, dan tanggapi laporan dari anggota.</p>
              </div>
            </div>

            <button
              onClick={fetchReports}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-sm transition-colors self-start md:self-auto"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
            </button>
          </div>

          {/* Filters Bar */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 mb-6 backdrop-blur-xl space-y-4">
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari judul, rincian, atau nama anggota..."
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
              >
                <option value="ALL">Semua Status</option>
                <option value="MENUNGGU_DITANGGAPI">Menunggu Tanggapan</option>
                <option value="DIPROSES">Sedang Diproses</option>
                <option value="SELESAI">Selesai</option>
                <option value="DITOLAK">Ditolak</option>
              </select>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
              >
                <option value="ALL">Semua Kategori</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </form>
          </div>

          {/* Reports Table */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Memuat daftar laporan anggota...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">Tidak Ada Data Laporan</h3>
                <p className="text-sm text-slate-400">Tidak ada laporan yang sesuai dengan kriteria filter Anda.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300 min-w-[950px]">
                  <thead className="bg-slate-900/90 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700">
                    <tr>
                      <th className="px-4 py-3.5 text-center">No</th>
                      <th className="px-4 py-3.5">Tanggal</th>
                      <th className="px-4 py-3.5">Anggota</th>
                      <th className="px-4 py-3.5">Kategori</th>
                      <th className="px-4 py-3.5">Judul Laporan</th>
                      <th className="px-4 py-3.5 text-center">Bukti Foto</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {reports.map((report, idx) => {
                      const shotList = parseScreenshots(report.screenshots);
                      return (
                        <tr key={report.id} className="hover:bg-slate-800/60 transition-colors">
                          <td className="px-4 py-4 text-center font-medium text-slate-500">{idx + 1}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-400">
                            {new Date(report.created_at).toLocaleString('id-ID', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-semibold text-white">{report.user.discord_name}</div>
                            <div className="text-xs text-slate-400">
                              {report.user.position?.name || 'Anggota'} ({report.user.username})
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                              <Tag className="w-3 h-3 text-red-400" /> {report.category}
                            </span>
                          </td>
                          <td className="px-4 py-4 font-medium text-slate-200 max-w-xs truncate">
                            {report.title}
                          </td>
                          <td className="px-4 py-4 text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-700">
                              <ImageIcon className="w-3.5 h-3.5 text-red-400" /> {shotList.length} Foto
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">{getStatusBadge(report.status)}</td>
                          <td className="px-4 py-4 text-center whitespace-nowrap">
                            <button
                              onClick={() => openDetailModal(report)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 text-xs font-semibold transition-all"
                            >
                              <Eye className="w-3.5 h-3.5" /> Detail & Tanggapi
                            </button>
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
      </div>

      {/* Admin Respond & Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {getStatusBadge(selectedReport.status)}
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {selectedReport.category}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white">{selectedReport.title}</h2>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                  <UserIcon className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-slate-200 font-semibold">{selectedReport.user.discord_name}</span>
                  <span>({selectedReport.user.position?.name || 'Anggota'})</span>
                  <span>• {new Date(selectedReport.created_at).toLocaleString('id-ID')}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content & Screenshots */}
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Isi Laporan:</h4>
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-sm text-slate-200 whitespace-pre-wrap">
                  {selectedReport.content}
                </div>
              </div>

              {/* Screenshots Grid */}
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

              {/* Response Form */}
              <form onSubmit={handleUpdateReport} className="pt-4 border-t border-slate-800 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-red-400" /> Tanggapi & Perbarui Status Laporan
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Pilih Status Baru:</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="MENUNGGU_DITANGGAPI">Menunggu Tanggapan</option>
                      <option value="DIPROSES">Sedang Diproses / Ditindaklanjuti</option>
                      <option value="SELESAI">Selesai / Disetujui</option>
                      <option value="DITOLAK">Ditolak</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Catatan Tanggapan Admin:</label>
                  <textarea
                    rows={3}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Tuliskan alasan, instruksi, atau tanggapan untuk anggota..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedReport(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-semibold transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold text-sm shadow-lg shadow-red-600/30 disabled:opacity-50 transition-all"
                  >
                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Simpan Tanggapan
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Image Preview Modal */}
      {selectedReport && previewImageIndex !== null && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-4">
          <button
            onClick={() => setPreviewImageIndex(null)}
            className="absolute top-4 right-4 p-3 bg-slate-800/80 text-white rounded-xl hover:bg-slate-700 transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

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
    </div>
  );
}
