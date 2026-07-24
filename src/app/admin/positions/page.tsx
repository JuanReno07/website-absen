'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { Briefcase, Plus, Edit2, Trash2, Shield, AlertCircle, X } from 'lucide-react';

export default function AdminPositionsPage() {
  const [user, setUser] = useState<any>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<any | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchPositions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/positions');
      const data = await res.json();
      if (res.ok) {
        setPositions(data.positions || []);
      } else if (res.status === 403 || res.status === 401) {
        window.location.href = '/dashboard';
      }
    } catch (e) {
      console.error('Fetch positions error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  const handleOpenAdd = () => {
    setEditingPosition(null);
    setName('');
    setDescription('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: any) => {
    setEditingPosition(p);
    setName(p.name);
    setDescription(p.description || '');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSaving(true);

    try {
      const method = editingPosition ? 'PUT' : 'POST';
      const payload: any = { name, description };
      if (editingPosition) payload.id = editingPosition.id;

      const res = await fetch('/api/admin/positions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Gagal menyimpan jabatan.');
        setSaving(false);
        return;
      }

      setIsModalOpen(false);
      fetchPositions();
    } catch (err) {
      setErrorMsg('Kesalahan jaringan.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePosition = async (p: any) => {
    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus jabatan "${p.name}"?`
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/admin/positions?id=${p.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Gagal menghapus jabatan.');
        return;
      }

      alert(`Jabatan "${p.name}" berhasil dihapus.`);
      fetchPositions();
    } catch (e) {
      alert('Gagal menghapus data.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar user={user} activeDuty={null} />

      <div className="flex-1 flex flex-col lg:flex-row">
        <AdminSidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-brand-400" />
                Manajemen Jabatan & Ranks
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Kelola daftar struktur jabatan organisasi ASE Roleplay (Tambah, Edit, & Hapus).
              </p>
            </div>

            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-brand-600/30 flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>TAMBAH JABATAN BARU</span>
            </button>
          </div>

          <div className="glass-card rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono border-b border-slate-800">
                  <tr>
                    <th className="p-4">Nama Jabatan</th>
                    <th className="p-4">Deskripsi Tugas</th>
                    <th className="p-4">Jumlah Anggota</th>
                    <th className="p-4 text-right">Aksi Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="p-4">
                          <div className="w-32 h-4 bg-slate-800/80 rounded-lg"></div>
                        </td>
                        <td className="p-4">
                          <div className="w-56 h-4 bg-slate-800/80 rounded-lg"></div>
                        </td>
                        <td className="p-4">
                          <div className="w-20 h-4 bg-slate-800/80 rounded-lg"></div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="w-28 h-7 bg-slate-800/80 rounded-lg ml-auto"></div>
                        </td>
                      </tr>
                    ))
                  ) : positions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500">
                        Belum ada data jabatan. Klik tombol + Tambah Jabatan Baru untuk menambahkan.
                      </td>
                    </tr>
                  ) : (
                    positions.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-900/40">
                        <td className="p-4 font-bold text-brand-400">{p.name}</td>
                        <td className="p-4 text-slate-400">{p.description || '-'}</td>
                        <td className="p-4 font-mono font-bold text-slate-300">
                          {p._count?.users || 0} Anggota
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                              title="Edit Jabatan"
                            >
                              <Edit2 className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button
                              onClick={() => handleDeletePosition(p)}
                              className="px-2.5 py-1.5 bg-red-950/60 hover:bg-red-900/80 border border-red-800/60 text-red-400 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                              title="Hapus Jabatan"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Hapus
                            </button>
                          </div>
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

      {/* Modal Add/Edit Position */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative max-w-md w-full glass-card rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-brand-400" />
                {editingPosition ? 'Edit Jabatan Organisasi' : 'Tambah Jabatan Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-red-950/80 border border-red-800/80 rounded-xl text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  NAMA JABATAN <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: President, PJ EMS, PJ Resto"
                  required
                  className="w-full px-4 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  DESKRIPSI TUGAS
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Deskripsi singkat peranan jabatan ini..."
                  className="w-full px-4 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
