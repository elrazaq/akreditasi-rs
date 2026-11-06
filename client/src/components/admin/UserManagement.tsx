import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, Role } from '../../types';
import {
  UserPlus,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  Edit2,
} from 'lucide-react';

interface UserManagementProps {
  currentUser: User;
}

interface PokjaOption {
  id: string;
  kode: string;
  nama: string;
}

export const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [pokjaList, setPokjaList] = useState<PokjaOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    password: '',
    role: 'POKJA' as Role,
    assignedPokjaId: '',
  });
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Gagal memuat daftar pengguna.');
      }
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memuat data pengguna.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPokjas = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/pokja', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const options: PokjaOption[] = (data.pokjas || []).map((p: any) => ({
          id: p.id,
          kode: p.kode,
          nama: p.nama,
        }));
        setPokjaList(options);
      }
    } catch (err) {
      console.error('Failed to load pokja options', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchPokjas();
  }, []);

  const openAddModal = () => {
    setFormData({
      nama: '',
      email: '',
      password: '',
      role: 'POKJA',
      assignedPokjaId: pokjaList.length > 0 ? pokjaList[0].id : '',
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      nama: user.nama,
      email: user.email,
      password: '',
      role: user.role,
      assignedPokjaId: user.assignedPokjaId || (pokjaList.length > 0 ? pokjaList[0].id : ''),
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setFormError(null);
    setIsDeleteModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFormSubmitting(true);
      setFormError(null);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nama: formData.nama.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: formData.role,
          assignedPokjaId: formData.role === 'POKJA' ? formData.assignedPokjaId : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menambahkan pengguna.');
      }

      setIsAddModalOpen(false);
      setSuccessMessage('Pengguna baru berhasil ditambahkan.');
      setTimeout(() => setSuccessMessage(null), 4000);
      fetchUsers();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan data.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      setFormSubmitting(true);
      setFormError(null);
      const token = localStorage.getItem('token');
      const payload: Record<string, any> = {
        nama: formData.nama.trim(),
        email: formData.email.trim(),
        role: formData.role,
        assignedPokjaId: formData.role === 'POKJA' ? formData.assignedPokjaId : null,
      };
      if (formData.password.trim()) {
        payload.password = formData.password.trim();
      }

      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memperbarui pengguna.');
      }

      setIsEditModalOpen(false);
      setSuccessMessage('Data pengguna berhasil diperbarui.');
      setTimeout(() => setSuccessMessage(null), 4000);
      fetchUsers();
    } catch (err: any) {
      setFormError(err.message || 'Gagal memperbarui data.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedUser) return;
    try {
      setFormSubmitting(true);
      setFormError(null);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menghapus pengguna.');
      }

      setIsDeleteModalOpen(false);
      setSuccessMessage('Pengguna berhasil dihapus dari sistem.');
      setTimeout(() => setSuccessMessage(null), 4000);
      fetchUsers();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menghapus pengguna.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.assignedPokja?.kode || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-slate-200/80 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200">
              Super Admin Panel
            </span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Manajemen Pengguna Sistem</h1>
          <p className="text-xs text-slate-500 mt-1 font-normal">
            Kelola hak akses, peranan staf akreditasi, dan penugasan 16 Pokja RSUD Bintan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-glow-teal transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Pengguna Baru</span>
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-diffuse">
          <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">Total Akun</div>
          <div className="text-2xl font-semibold font-mono text-slate-900 mt-1">{users.length}</div>
        </div>
        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-diffuse">
          <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">Super Administrator</div>
          <div className="text-2xl font-semibold font-mono text-slate-900 mt-1">
            {users.filter((u) => u.role === 'SUPERADMIN').length}
          </div>
        </div>
        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-diffuse">
          <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">Verifikator Mutu</div>
          <div className="text-2xl font-semibold font-mono text-slate-900 mt-1">
            {users.filter((u) => u.role === 'VERIFIKATOR').length}
          </div>
        </div>
        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-diffuse">
          <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">PIC Pokja Terdaftar</div>
          <div className="text-2xl font-semibold font-mono text-slate-900 mt-1">
            {users.filter((u) => u.role === 'POKJA').length}
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-white border border-slate-200/80 rounded-2xl shadow-diffuse">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Cari nama, email, atau kode pokja..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
          />
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Peran:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition cursor-pointer"
          >
            <option value="ALL">Semua Peran</option>
            <option value="SUPERADMIN">SUPERADMIN</option>
            <option value="VERIFIKATOR">VERIFIKATOR</option>
            <option value="POKJA">POKJA</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-diffuse overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Memuat basis data pengguna...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">Tidak ada data pengguna yang sesuai kriteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/70 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Nama Lengkap & Email</th>
                  <th className="py-3 px-4 w-36">Peran Akun</th>
                  <th className="py-3 px-4">Pokja Penugasan</th>
                  <th className="py-3 px-4 w-36">Dibuat Pada</th>
                  <th className="py-3 px-4 w-32 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u, idx) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{u.nama}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">{u.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      {u.role === 'SUPERADMIN' && (
                        <span className="inline-block px-2.5 py-0.5 text-[10px] font-semibold bg-slate-900 text-white rounded-lg">
                          SUPERADMIN
                        </span>
                      )}
                      {u.role === 'VERIFIKATOR' && (
                        <span className="inline-block px-2.5 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 rounded-lg">
                          VERIFIKATOR
                        </span>
                      )}
                      {u.role === 'POKJA' && (
                        <span className="inline-block px-2.5 py-0.5 text-[10px] font-semibold bg-teal-50 text-teal-800 border border-teal-200 rounded-lg">
                          PIC POKJA
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {u.assignedPokja ? (
                        <div>
                          <span className="font-semibold text-teal-800 font-mono mr-1.5">{u.assignedPokja.kode}</span>
                          <span className="text-slate-600 text-[11px]">{u.assignedPokja.nama}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">Semua Pokja / Lintas Unit</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] font-mono">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => openEditModal(u)}
                        title="Ubah Data / Ganti Sandi"
                        className="px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:text-teal-700 bg-slate-100 hover:bg-teal-50 rounded-xl transition cursor-pointer"
                      >
                        Edit
                      </button>
                      {u.id !== currentUser.id && (
                        <button
                          onClick={() => openDeleteModal(u)}
                          title="Hapus Akun Pengguna"
                          className="px-3 py-1.5 text-[11px] font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-xl transition cursor-pointer"
                        >
                          Hapus
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tambah Pengguna */}
      {isAddModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
            style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsAddModalOpen(false);
            }}
          >
            <div className="bg-white rounded-2xl shadow-modal border border-slate-200/90 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 relative">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-teal-600" />
                  <span>Tambah Akun Pengguna Baru</span>
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1.5">
                    Nama Lengkap <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Mis: dr. Ahmad Suryadi, Sp.A"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    className="w-full text-xs px-3.5 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1.5">
                    Alamat Email <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="nama@rsudbintan.id"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full text-xs px-3.5 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1.5">
                    Kata Sandi Sementara <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Minimal 8 karakter"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full text-xs px-3.5 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1.5">
                    Peran Akun <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                    className="w-full text-xs px-3.5 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white transition cursor-pointer"
                  >
                    <option value="POKJA">PIC Pokja Akreditasi</option>
                    <option value="VERIFIKATOR">Verifikator Mutu RS</option>
                    <option value="SUPERADMIN">Super Administrator</option>
                  </select>
                </div>

                {formData.role === 'POKJA' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1.5">
                      Pokja Penugasan <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={formData.assignedPokjaId}
                      onChange={(e) => setFormData({ ...formData, assignedPokjaId: e.target.value })}
                      className="w-full text-xs px-3.5 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white transition cursor-pointer"
                    >
                      {pokjaList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.kode} - {p.nama}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-5 py-2 text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 rounded-xl shadow-glow-teal transition cursor-pointer disabled:opacity-50"
                  >
                    {formSubmitting ? 'Menyimpan...' : 'Simpan Akun'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Modal Edit Pengguna & Reset Password */}
      {isEditModalOpen &&
        selectedUser &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
            style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsEditModalOpen(false);
            }}
          >
            <div className="bg-white rounded-2xl shadow-modal border border-slate-200/90 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 relative">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-teal-600" />
                  <span>Edit Akun Pengguna</span>
                </h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1.5">
                    Nama Lengkap <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    className="w-full text-xs px-3.5 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1.5">
                    Alamat Email <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full text-xs px-3.5 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1.5">
                    Ganti Kata Sandi (Opsional)
                  </label>
                  <input
                    type="password"
                    placeholder="Biarkan kosong jika tidak diubah"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full text-xs px-3.5 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1.5">
                    Peran Akun <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                    className="w-full text-xs px-3.5 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white transition cursor-pointer"
                  >
                    <option value="POKJA">PIC Pokja Akreditasi</option>
                    <option value="VERIFIKATOR">Verifikator Mutu RS</option>
                    <option value="SUPERADMIN">Super Administrator</option>
                  </select>
                </div>

                {formData.role === 'POKJA' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1.5">
                      Pokja Penugasan <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={formData.assignedPokjaId}
                      onChange={(e) => setFormData({ ...formData, assignedPokjaId: e.target.value })}
                      className="w-full text-xs px-3.5 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white transition cursor-pointer"
                    >
                      {pokjaList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.kode} - {p.nama}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-5 py-2 text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 rounded-xl shadow-glow-teal transition cursor-pointer disabled:opacity-50"
                  >
                    {formSubmitting ? 'Memperbarui...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Modal Hapus Pengguna */}
      {isDeleteModalOpen &&
        selectedUser &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
            style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsDeleteModalOpen(false);
            }}
          >
            <div className="bg-white rounded-2xl shadow-modal border border-slate-200/90 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150 relative">
              <div className="px-6 py-4 bg-rose-50 border-b border-rose-100 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3 className="text-sm font-semibold text-rose-900">Konfirmasi Hapus Akun</h3>
              </div>
              <div className="p-6 space-y-3.5">
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}
                <p className="text-xs text-slate-700 leading-relaxed font-normal">
                  Apakah Anda yakin ingin menghapus akun pengguna <strong className="text-slate-900 font-semibold">{selectedUser.nama}</strong> ({selectedUser.email})?
                </p>
                <p className="text-[11px] text-slate-500 font-normal">
                  Tindakan ini permanen. Akun yang telah membuat berkas akreditasi tidak dapat dihapus demi integritas jejak audit rumah sakit.
                </p>
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteSubmit}
                    disabled={formSubmitting}
                    className="px-5 py-2 text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 rounded-xl shadow-diffuse transition cursor-pointer disabled:opacity-50"
                  >
                    {formSubmitting ? 'Menghapus...' : 'Ya, Hapus Akun'}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
