'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { Users, UserPlus, Edit2, Trash2, Shield, Search, Filter, AlertCircle, CheckCircle2, X, LogOut, Zap, UserX, ShieldAlert, Monitor, Smartphone, Globe, Info, ShieldCheck } from 'lucide-react';

export default function AdminMembersPage() {
  const [user, setUser] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any | null>(null);

  // Form Fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [discordName, setDiscordName] = useState('');
  const [positionId, setPositionId] = useState('');
  const [oocName, setOocName] = useState('');
  const [steamHex, setSteamHex] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [isActive, setIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Kick Session State
  const [kickTarget, setKickTarget] = useState<any | null>(null);
  const [isKickModalOpen, setIsKickModalOpen] = useState(false);
  const [isKickAllModalOpen, setIsKickAllModalOpen] = useState(false);
  const [kicking, setKicking] = useState(false);
  const [kickAlertMsg, setKickAlertMsg] = useState('');

  // Device Sessions Modal State
  const [deviceTarget, setDeviceTarget] = useState<any | null>(null);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [userSessions, setUserSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const fetchUserSessions = async (userId: string) => {
    try {
      setLoadingSessions(true);
      const res = await fetch(`/api/admin/sessions?userId=${userId}`);
      const data = await res.json();
      if (res.ok) {
        setUserSessions(data.sessions || []);
      }
    } catch (e) {
      console.error('Fetch sessions error:', e);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleOpenDeviceModal = (member: any) => {
    setDeviceTarget(member);
    setIsDeviceModalOpen(true);
    fetchUserSessions(member.id);
  };

  const handleKickSingleDevice = async (sessionId: string) => {
    setKicking(true);
    try {
      const res = await fetch('/api/admin/kick-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Gagal menendang sesi perangkat.');
        return;
      }
      setKickAlertMsg(data.message || 'Sesi perangkat berhasil di-kick.');
      setTimeout(() => setKickAlertMsg(''), 4000);
      if (deviceTarget) {
        fetchUserSessions(deviceTarget.id);
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan saat menendang perangkat.');
    } finally {
      setKicking(false);
    }
  };

  const handleKickUser = async () => {
    if (!kickTarget) return;
    setKicking(true);
    try {
      const res = await fetch('/api/admin/kick-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: kickTarget.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Gagal menendang sesi pengguna.');
        setKicking(false);
        return;
      }
      setIsKickModalOpen(false);
      setKickTarget(null);
      setKickAlertMsg(data.message || 'Sesi pengguna berhasil di-kick.');
      setTimeout(() => setKickAlertMsg(''), 4000);
    } catch (err) {
      alert('Terjadi kesalahan jaringan saat menendang sesi.');
    } finally {
      setKicking(false);
    }
  };

  const handleKickAll = async () => {
    setKicking(true);
    try {
      const res = await fetch('/api/admin/kick-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kickAll: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Gagal menendang seluruh sesi pengguna.');
        setKicking(false);
        return;
      }
      setIsKickAllModalOpen(false);
      setKickAlertMsg(data.message || 'Seluruh sesi pengguna berhasil di-kick.');
      setTimeout(() => setKickAlertMsg(''), 4000);
    } catch (err) {
      alert('Terjadi kesalahan jaringan saat menendang seluruh sesi.');
    } finally {
      setKicking(false);
    }
  };

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (positionFilter !== 'ALL') params.append('position_id', positionFilter);
      if (roleFilter !== 'ALL') params.append('role', roleFilter);
      if (statusFilter !== 'ALL') params.append('is_active', statusFilter);

      const res = await fetch(`/api/admin/members?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setMembers(data.members || []);
        setPositions(data.positions || []);
      } else if (res.status === 403 || res.status === 401) {
        window.location.href = '/dashboard';
      }
    } catch (e) {
      console.error('Fetch members error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [search, positionFilter, roleFilter, statusFilter]);

  const handleOpenAddModal = () => {
    setEditingMember(null);
    setUsername('');
    setPassword('');
    setDiscordName('');
    setPositionId(positions[0]?.id || '');
    setOocName('');
    setSteamHex('');
    setRole('MEMBER');
    setIsActive(true);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (m: any) => {
    setEditingMember(m);
    setUsername(m.username);
    setPassword('');
    setDiscordName(m.discord_name);
    setPositionId(m.position_id);
    setOocName(m.ooc_name);
    setSteamHex(m.steam_hex);
    setRole(m.role);
    setIsActive(m.is_active);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSaving(true);

    try {
      const endpoint = '/api/admin/members';
      const method = editingMember ? 'PUT' : 'POST';

      const payload: any = {
        username,
        discord_name: discordName,
        position_id: positionId,
        ooc_name: oocName,
        steam_hex: steamHex,
        role,
        is_active: isActive,
      };

      if (editingMember) {
        payload.id = editingMember.id;
        if (password) payload.new_password = password;
      } else {
        payload.password = password;
      }

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Gagal menyimpan data anggota.');
        setSaving(false);
        return;
      }

      setIsModalOpen(false);
      fetchMembers();
    } catch (err) {
      setErrorMsg('Terjadi kesalahan jaringan.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/members?id=${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Gagal menghapus anggota.');
        setDeleting(false);
        return;
      }
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
      fetchMembers();
    } catch (err) {
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setDeleting(false);
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
                <Users className="w-6 h-6 text-brand-400" />
                Manajemen Data Anggota
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Kelola seluruh akun anggota, jabatan, Steam Hex, dan status keaktifan.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsKickAllModalOpen(true)}
                className="px-3.5 py-2.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-700/60 text-amber-300 font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all"
                title="Tendang seluruh pengguna yang sedang login sekaligus"
              >
                <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>KICK SEMUA SESSION</span>
              </button>

              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-brand-600/30 flex items-center gap-2 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>TAMBAH ANGGOTA BARU</span>
              </button>
            </div>
          </div>

          {kickAlertMsg && (
            <div className="p-3 bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-semibold rounded-2xl flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{kickAlertMsg}</span>
            </div>
          )}

          {/* Filters Bar */}
          <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari Username, Discord, OOC, atau Steam Hex..."
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2"
              >
                <option value="ALL">Semua Jabatan</option>
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2"
              >
                <option value="ALL">Semua Role</option>
                <option value="ADMIN">ADMIN</option>
                <option value="MEMBER">MEMBER</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2"
              >
                <option value="ALL">Semua Status</option>
                <option value="true">Aktif</option>
                <option value="false">Nonaktif</option>
              </select>
            </div>
          </div>

          {/* Members Table */}
          <div className="glass-card rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono border-b border-slate-800">
                  <tr>
                    <th className="p-4">Discord Name</th>
                    <th className="p-4">Jabatan</th>
                    <th className="p-4">Nama OOC</th>
                    <th className="p-4">Steam Hex ID</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="p-4"><div className="w-32 h-4 bg-slate-800/80 rounded-lg"></div></td>
                        <td className="p-4"><div className="w-24 h-4 bg-slate-800/80 rounded-lg"></div></td>
                        <td className="p-4"><div className="w-28 h-4 bg-slate-800/80 rounded-lg"></div></td>
                        <td className="p-4"><div className="w-36 h-4 bg-slate-800/80 rounded-lg"></div></td>
                        <td className="p-4"><div className="w-16 h-4 bg-slate-800/80 rounded-lg"></div></td>
                        <td className="p-4"><div className="w-16 h-4 bg-slate-800/80 rounded-lg"></div></td>
                        <td className="p-4 text-right"><div className="w-24 h-7 bg-slate-800/80 rounded-lg ml-auto"></div></td>
                      </tr>
                    ))
                  ) : members.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        Tidak ada data anggota yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    members.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-900/40">
                      <td className="p-4">
                        <div>
                          <p className="font-bold text-slate-100">{m.discord_name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">@{m.username}</p>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-brand-400">{m.position.name}</td>
                      <td className="p-4">{m.ooc_name}</td>
                      <td className="p-4 font-mono text-slate-300">{m.steam_hex}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            m.role === 'ADMIN'
                              ? 'bg-purple-950 text-purple-400 border border-purple-800/50'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {m.role}
                        </span>
                      </td>
                      <td className="p-4">
                        {m.is_active ? (
                          <span className="px-2.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800/50 rounded-full text-[10px] font-bold">
                            Aktif
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-red-950 text-red-400 border border-red-800/50 rounded-full text-[10px] font-bold">
                            Nonaktif
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenDeviceModal(m)}
                            className="px-3 py-1.5 bg-blue-950/40 hover:bg-blue-900/70 border border-blue-800/50 text-blue-400 hover:text-blue-300 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                            title="Lihat Detail Sesi Perangkat & IP"
                          >
                            <Monitor className="w-3.5 h-3.5" /> Perangkat
                          </button>
                          <button
                            onClick={() => { setKickTarget(m); setIsKickModalOpen(true); }}
                            className="px-3 py-1.5 bg-amber-950/40 hover:bg-amber-900/70 border border-amber-800/50 text-amber-400 hover:text-amber-300 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                            title="Kick sesi login user ini"
                          >
                            <LogOut className="w-3.5 h-3.5" /> Kick
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(m)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => { setDeleteTarget(m); setIsDeleteModalOpen(true); }}
                            className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900/80 border border-red-800/50 text-red-400 hover:text-red-300 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
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

      {/* Add / Edit Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-4 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100">
                {editingMember ? 'Edit Data Anggota' : 'Tambah Anggota Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-950 border border-red-800 rounded-xl text-red-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    {editingMember ? 'Password Baru (Opsional)' : 'Password'}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={!editingMember}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Nama Discord</label>
                  <input
                    type="text"
                    value={discordName}
                    onChange={(e) => setDiscordName(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Jabatan</label>
                  <select
                    value={positionId}
                    onChange={(e) => setPositionId(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100"
                  >
                    {positions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Nama OOC</label>
                  <input
                    type="text"
                    value={oocName}
                    onChange={(e) => setOocName(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Steam Hex ID (Unik)</label>
                  <input
                    type="text"
                    value={steamHex}
                    onChange={(e) => setSteamHex(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Role Akun</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100"
                  >
                    <option value="MEMBER">MEMBER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Status Keaktifan</label>
                  <select
                    value={isActive ? 'true' : 'false'}
                    onChange={(e) => setIsActive(e.target.value === 'true')}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100"
                  >
                    <option value="true">Aktif</option>
                    <option value="false">Nonaktifkan Akun</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative max-w-md w-full bg-slate-900 border border-red-800/50 rounded-3xl overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="w-10 h-10 rounded-full bg-red-950 border border-red-800/50 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Hapus Anggota</h3>
                <p className="text-xs text-slate-400">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="p-4 bg-red-950/40 border border-red-800/40 rounded-2xl space-y-2">
              <p className="text-sm text-slate-200">
                Apakah Anda yakin ingin menghapus anggota berikut?
              </p>
              <div className="text-xs space-y-1 text-slate-300">
                <p><span className="text-slate-500">Discord:</span> <span className="font-bold text-white">{deleteTarget.discord_name}</span></p>
                <p><span className="text-slate-500">Username:</span> <span className="font-mono">@{deleteTarget.username}</span></p>
                <p><span className="text-slate-500">Steam Hex:</span> <span className="font-mono">{deleteTarget.steam_hex}</span></p>
              </div>
              <p className="text-[11px] text-red-400 font-semibold mt-2">
                ⚠️ Semua data absensi, riwayat duty, dan pengajuan izin anggota ini akan ikut terhapus secara permanen.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => { setIsDeleteModalOpen(false); setDeleteTarget(null); }}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold text-xs"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-600/30 text-xs flex items-center gap-2 disabled:opacity-50 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deleting ? 'Menghapus...' : 'Ya, Hapus Permanen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kick Single Session Modal */}
      {isKickModalOpen && kickTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative max-w-md w-full bg-slate-900 border border-amber-800/50 rounded-3xl overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="w-10 h-10 rounded-full bg-amber-950 border border-amber-800/50 flex items-center justify-center">
                <UserX className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Kick Sesi Pengguna</h3>
                <p className="text-xs text-slate-400">Putuskan sesi login aktif akun ini</p>
              </div>
            </div>

            <div className="p-4 bg-amber-950/30 border border-amber-800/30 rounded-2xl space-y-2">
              <p className="text-xs text-slate-200">
                Apakah Anda yakin ingin menendang sesi login aktif untuk anggota berikut?
              </p>
              <div className="text-xs space-y-1 text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <p><span className="text-slate-500">Discord:</span> <span className="font-bold text-white">{kickTarget.discord_name}</span></p>
                <p><span className="text-slate-500">Username:</span> <span className="font-mono">@{kickTarget.username}</span></p>
                <p><span className="text-slate-500">Jabatan:</span> <span className="text-brand-400 font-bold">{kickTarget.position?.name}</span></p>
              </div>
              <p className="text-[11px] text-amber-300 font-semibold mt-2">
                ⚡ Pengguna ini akan langsung ter-logout otomatis saat melakukan aksi/refresh halaman berikutnya.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => { setIsKickModalOpen(false); setKickTarget(null); }}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold text-xs"
              >
                Batal
              </button>
              <button
                onClick={handleKickUser}
                disabled={kicking}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-600/30 text-xs flex items-center gap-2 disabled:opacity-50 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                {kicking ? 'Menendang Sesi...' : 'Ya, Kick Sesi Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kick All Sessions Modal */}
      {isKickAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative max-w-md w-full bg-slate-900 border border-red-800/60 rounded-3xl overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="w-10 h-10 rounded-full bg-red-950 border border-red-800/50 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Kick Seluruh Session (Purge All)</h3>
                <p className="text-xs text-slate-400">Tindakan Darurat Keamanan</p>
              </div>
            </div>

            <div className="p-4 bg-red-950/40 border border-red-800/40 rounded-2xl space-y-2">
              <p className="text-xs text-slate-200">
                Apakah Anda yakin ingin menendang <strong>SELURUH pengguna</strong> yang sedang login di sistem saat ini?
              </p>
              <p className="text-[11px] text-red-300 font-semibold mt-2">
                🚨 PERINGATAN: Semua anggota (termasuk Anda jika tidak Re-Login) yang sedang membuka aplikasi akan langsung dikeluarkan ke halaman Login secara serentak.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsKickAllModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold text-xs"
              >
                Batal
              </button>
              <button
                onClick={handleKickAll}
                disabled={kicking}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-600/30 text-xs flex items-center gap-2 disabled:opacity-50 transition-all"
              >
                <Zap className="w-3.5 h-3.5" />
                {kicking ? 'Memproses Purge All...' : 'Ya, Kick Semua Session'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Device Sessions Modal */}
      {isDeviceModalOpen && deviceTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative max-w-2xl w-full bg-slate-900 border border-blue-800/50 rounded-3xl overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-950 border border-blue-800/50 flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    Sesi Perangkat & IP: {deviceTarget.discord_name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">@{deviceTarget.username} • {deviceTarget.position?.name}</p>
                </div>
              </div>
              <button
                onClick={() => { setIsDeviceModalOpen(false); setDeviceTarget(null); }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-blue-950/30 border border-blue-800/30 rounded-2xl flex items-start gap-2 text-xs text-blue-300">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p>
                Menampilkan seluruh riwayat perangkat & IP Address yang digunakan untuk login. Menendang sesi perangkat tertentu akan langsung memutus akses login perangkat tersebut, dan <strong>otomatis menghentikan jam kerja (Auto Duty-Out)</strong> jika anggota sedang duty aktif.
              </p>
            </div>

            <div className="max-h-80 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono border-b border-slate-800 sticky top-0">
                  <tr>
                    <th className="p-3">Perangkat & OS</th>
                    <th className="p-3">Browser</th>
                    <th className="p-3">IP Address</th>
                    <th className="p-3">Aktif Terakhir</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {loadingSessions ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500">
                        <div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto mb-2"></div>
                        Memuat data sesi perangkat...
                      </td>
                    </tr>
                  ) : userSessions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500">
                        Belum ada data sesi login terrekam.
                      </td>
                    </tr>
                  ) : (
                    userSessions.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-900/40">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {s.deviceType === 'Mobile' ? (
                              <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
                            ) : (
                              <Monitor className="w-4 h-4 text-blue-400 shrink-0" />
                            )}
                            <div>
                              <p className="font-bold text-slate-100">{s.osName}</p>
                              <span className="text-[10px] text-slate-400 uppercase font-mono">{s.deviceType}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 font-medium text-slate-200">{s.browserName}</td>
                        <td className="p-3 font-mono text-slate-300 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-slate-400" />
                          <span>{s.ipAddress}</span>
                        </td>
                        <td className="p-3 text-slate-400 font-mono text-[11px]">
                          {new Date(s.lastActive).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}
                        </td>
                        <td className="p-3 text-right">
                          {s.isActive ? (
                            <button
                              onClick={() => handleKickSingleDevice(s.id)}
                              disabled={kicking}
                              className="px-2.5 py-1 bg-amber-950/60 hover:bg-amber-900 border border-amber-800/50 text-amber-300 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition-colors"
                            >
                              <LogOut className="w-3 h-3" /> Kick Perangkat
                            </button>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-900 text-slate-500 border border-slate-800 rounded text-[10px] font-bold">
                              Nonaktif / Kicked
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => { setIsDeviceModalOpen(false); setDeviceTarget(null); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
