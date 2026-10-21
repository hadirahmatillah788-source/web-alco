"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Shield,
  User,
  Search,
  Edit2,
  Trash2,
  Lock,
  Mail,
  Building,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
  EyeOff,
  Filter,
  RefreshCw,
  KeyRound,
  ShieldAlert,
} from "lucide-react";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "KARYAWAN";
  department?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  _count?: {
    pengumuman: number;
  };
}

export function ViewerManagementPanel() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Modal State: Tambah / Edit Viewer
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<"KARYAWAN" | "ADMIN">("KARYAWAN");
  const [formDepartment, setFormDepartment] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Fetch Users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (selectedRole !== "ALL") params.set("role", selectedRole);

      const res = await fetch(`/api/users?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memuat data pengguna");

      setUsers(json.data || []);
    } catch (err: any) {
      setError(err.message || "Gagal mengambil data viewer");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, selectedRole]);

  // Handler Open Modal Tambah
  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("KARYAWAN");
    setFormDepartment("Pemasaran & Operasional Cabang");
    setFormIsActive(true);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  // Handler Open Modal Edit
  const handleOpenEdit = (user: UserItem) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPassword(""); // Kosongkan saat edit kecuali admin ingin menggantinya
    setFormRole(user.role);
    setFormDepartment(user.department || "");
    setFormIsActive(user.isActive !== false);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  // Handler Save (Create or Update)
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      alert("Nama lengkap dan alamat email wajib diisi.");
      return;
    }

    if (!editingUser && (!formPassword || formPassword.length < 6)) {
      alert("Kata sandi akun baru minimal 6 karakter.");
      return;
    }

    if (editingUser && formPassword && formPassword.length < 6) {
      alert("Kata sandi baru minimal 6 karakter.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingUser) {
        // Update user
        const payload: any = {
          name: formName.trim(),
          email: formEmail.trim(),
          role: formRole,
          department: formDepartment.trim() || null,
          isActive: formIsActive,
        };
        if (formPassword.trim()) {
          payload.password = formPassword.trim();
        }

        const res = await fetch(`/api/users/${editingUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Gagal memperbarui pengguna");
      } else {
        // Create user
        const res = await fetch(`/api/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            email: formEmail.trim(),
            password: formPassword.trim(),
            role: formRole,
            department: formDepartment.trim() || null,
            isActive: formIsActive,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Gagal membuat pengguna baru");
      }

      setIsModalOpen(false);
      await fetchUsers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Fast Toggle Status Aktif / Non-Aktif
  const handleToggleActive = async (user: UserItem) => {
    if (user.id === currentUserId) {
      alert("Anda tidak dapat menonaktifkan akun yang sedang digunakan saat ini.");
      return;
    }

    const nextStatus = !user.isActive;
    const actionLabel = nextStatus ? "mengaktifkan kembali" : "menonaktifkan (suspend)";
    if (!confirm(`Apakah Anda yakin ingin ${actionLabel} akun "${user.name}"?`)) return;

    // Optimistic UI update
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, isActive: nextStatus } : u))
    );

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextStatus }),
      });
      if (!res.ok) throw new Error("Gagal mengubah status pengguna");
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
      fetchUsers();
    }
  };

  // Handler Delete User
  const handleDeleteUser = async (user: UserItem) => {
    if (user.id === currentUserId) {
      alert("Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.");
      return;
    }

    if (!confirm(`Hapus permanen akun "${user.name}" (${user.email})? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menghapus pengguna");
      await fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (selectedStatus === "ACTIVE" && !u.isActive) return false;
      if (selectedStatus === "INACTIVE" && u.isActive) return false;
      return true;
    });
  }, [users, selectedStatus]);

  // Metrics Summary
  const metrics = useMemo(() => {
    const total = users.length;
    const totalViewer = users.filter((u) => u.role === "KARYAWAN").length;
    const totalAdmin = users.filter((u) => u.role === "ADMIN").length;
    const totalActive = users.filter((u) => u.isActive !== false).length;
    const totalInactive = users.filter((u) => u.isActive === false).length;
    return { total, totalViewer, totalAdmin, totalActive, totalInactive };
  }, [users]);

  const departmentPresets = [
    "Pemasaran & Operasional Cabang",
    "ALCO / Treasury & Manajemen",
    "Kredit & Risiko Pembiayaan",
    "Kepatuhan & Hukum (Compliance)",
    "Audit Internal",
    "SDM & Organisasi (HR)",
    "Teknologi Informasi & Digital Banking",
    "Akuntansi & Keuangan",
  ];

  return (
    <div className="space-y-6">
      {/* 1. HEADER & METRICS SUMMARY */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shadow-xs">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                  Manajemen Data Viewer & Pengguna Internal
                </h2>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                  Khusus Admin
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Otorisasi akun staf/karyawan yang berhak membaca risalah rapat komite ALCO dan publikasi suku bunga resmi.
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1E3A8A] hover:bg-blue-900 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-900/10 transition-all shrink-0"
          >
            <UserPlus className="w-4 h-4" /> Tambah Viewer Baru
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-5">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs text-slate-500 font-medium block">Total Pengguna</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{metrics.total} Akun</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200/80">
            <span className="text-xs text-sky-700 font-medium block">Viewer (Karyawan)</span>
            <span className="text-2xl font-extrabold text-sky-900 mt-1 block">{metrics.totalViewer} Orang</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/80">
            <span className="text-xs text-purple-700 font-medium block">Maker / Admin ALCO</span>
            <span className="text-2xl font-extrabold text-purple-900 mt-1 block">{metrics.totalAdmin} Notulen</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
            <span className="text-xs text-emerald-700 font-medium block">Status Aktif Berizin</span>
            <span className="text-2xl font-extrabold text-emerald-800 mt-1 block">{metrics.totalActive} Akun</span>
          </div>
        </div>
      </div>

      {/* 2. TOOLBAR PENCARIAN & FILTER */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, email, atau divisi viewer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] bg-slate-50/50 focus:bg-white"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
          >
            <option value="ALL">Semua Peran (Role)</option>
            <option value="KARYAWAN">Viewer (Karyawan Saja)</option>
            <option value="ADMIN">Maker (Admin Saja)</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
          >
            <option value="ALL">Semua Status Akun</option>
            <option value="ACTIVE">Hanya Akun Aktif</option>
            <option value="INACTIVE">Hanya Akun Non-Aktif (Suspend)</option>
          </select>

          <button
            onClick={fetchUsers}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
            title="Muat ulang data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. TABEL DATA VIEWER & USER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-[#1E3A8A] mb-3" />
            <p className="text-xs text-slate-500 font-medium">Memuat data pengguna & viewer...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center bg-slate-50/50">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Tidak ada data viewer yang cocok</p>
            <p className="text-xs text-slate-500 mt-1">
              Coba sesuaikan kata kunci pencarian atau tambah viewer baru.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-xs uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4">Nama Lengkap & Akun</th>
                  <th className="py-3.5 px-4">Departemen / Divisi</th>
                  <th className="py-3.5 px-4">Hak Akses (Role)</th>
                  <th className="py-3.5 px-4">Status Akun</th>
                  <th className="py-3.5 px-4">Terdaftar</th>
                  <th className="py-3.5 px-4 text-center w-36">Aksi (Admin)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredUsers.map((user, index) => {
                  const isSelf = user.id === currentUserId;
                  const isActive = user.isActive !== false;

                  return (
                    <tr
                      key={user.id}
                      className={`transition-colors ${
                        !isActive
                          ? "bg-slate-100/60 opacity-60 hover:opacity-100"
                          : index % 2 === 0
                          ? "bg-white hover:bg-sky-50/40"
                          : "bg-slate-50/40 hover:bg-sky-50/40"
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center font-medium text-slate-400">{index + 1}</td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-2xs ${
                              user.role === "ADMIN"
                                ? "bg-gradient-to-tr from-purple-700 to-indigo-600"
                                : "bg-gradient-to-tr from-blue-700 to-sky-500"
                            }`}
                          >
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                              <span>{user.name}</span>
                              {isSelf && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold border border-amber-300">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/80 font-medium">
                          <Building className="w-3 h-3 text-slate-400" />
                          {user.department || "Internal Bank"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {user.role === "ADMIN" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 font-bold">
                            <Shield className="w-3.5 h-3.5 text-purple-600" />
                            Maker (Admin)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-200 font-bold">
                            <User className="w-3.5 h-3.5 text-sky-600" />
                            Viewer (Karyawan)
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Aktif Berizin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 font-semibold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Non-Aktif (Suspend)
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {new Date(user.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Toggle Status Aktif / Non-Aktif */}
                          <button
                            onClick={() => handleToggleActive(user)}
                            disabled={isSelf}
                            className={`p-1.5 rounded-lg text-xs font-semibold transition-all border disabled:opacity-30 ${
                              isActive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                : "bg-slate-200 text-slate-600 border-slate-300 hover:bg-slate-300"
                            }`}
                            title={
                              isSelf
                                ? "Tidak dapat menonaktifkan akun sendiri"
                                : isActive
                                ? "Klik untuk menonaktifkan akun (Suspend)"
                                : "Klik untuk mengaktifkan kembali akun"
                            }
                          >
                            {isActive ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                          </button>

                          {/* Edit Data User */}
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                            title="Edit data viewer & reset kata sandi"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Hapus User */}
                          <button
                            onClick={() => handleDeleteUser(user)}
                            disabled={isSelf}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200 disabled:opacity-20"
                            title={isSelf ? "Tidak dapat menghapus akun sendiri" : "Hapus akun pengguna"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. MODAL FORM: TAMBAH / EDIT DATA VIEWER */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-[#1E3A8A] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-800/80 flex items-center justify-center text-blue-200">
                  <UserPlus className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">
                    {editingUser ? "Edit Data Viewer / Karyawan" : "Tambah Viewer Baru"}
                  </h3>
                  <p className="text-[11px] text-blue-200">
                    {editingUser ? `ID: ${editingUser.id}` : "Hak akses intranet perbankan ALCO"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-300 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dewi Lestari, S.E."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-semibold"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Alamat Email Resmi *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="nama.staf@company.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>
              </div>

              {/* Departemen / Divisi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Departemen / Divisi Unit Kerja
                </label>
                <input
                  type="text"
                  list="dept-presets"
                  placeholder="Pilih atau ketik nama divisi..."
                  value={formDepartment}
                  onChange={(e) => setFormDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
                <datalist id="dept-presets">
                  {departmentPresets.map((dept) => (
                    <option key={dept} value={dept} />
                  ))}
                </datalist>
              </div>

              {/* Role Hak Akses */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Tingkat Hak Akses *
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as any)}
                    className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] bg-white text-slate-800"
                  >
                    <option value="KARYAWAN">Viewer (Hanya-Baca)</option>
                    <option value="ADMIN">Maker / Admin (CRUD Penuh)</option>
                  </select>
                </div>

                {/* Status Aktif */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Status Akun
                  </label>
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-300 bg-slate-50">
                    <span className="text-xs font-bold text-slate-700">
                      {formIsActive ? "Aktif" : "Non-Aktif"}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formIsActive}
                        onChange={(e) => setFormIsActive(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Kata Sandi (Password) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                    {editingUser ? "Ganti / Reset Kata Sandi (Opsional)" : "Kata Sandi Akun *"}
                  </label>
                  {editingUser && (
                    <span className="text-[10px] text-slate-400 italic">
                      Kosongkan jika tidak diubah
                    </span>
                  )}
                </div>

                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required={!editingUser}
                    placeholder={editingUser ? "Masukkan kata sandi baru untuk mereset..." : "Minimal 6 karakter..."}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold bg-[#1E3A8A] hover:bg-blue-900 text-white rounded-xl shadow-xs transition-colors"
                >
                  {submitting
                    ? "Menyimpan..."
                    : editingUser
                    ? "Perbarui Data Viewer"
                    : "Simpan Viewer Baru"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
