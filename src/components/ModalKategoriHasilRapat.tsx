"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Tag,
  Check,
  AlertCircle,
  FolderPlus,
  Layers,
  FileText,
} from "lucide-react";

export interface KategoriItem {
  id: string;
  nama: string;
  deskripsi?: string | null;
  urutan: number;
  count?: number;
}

interface ModalKategoriHasilRapatProps {
  isOpen: boolean;
  onClose: () => void;
  onKategoriChanged?: () => void;
}

export function ModalKategoriHasilRapat({
  isOpen,
  onClose,
  onKategoriChanged,
}: ModalKategoriHasilRapatProps) {
  const [categories, setCategories] = useState<KategoriItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Create Mode Form
  const [newNama, setNewNama] = useState("");
  const [newDeskripsi, setNewDeskripsi] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Mode
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNama, setEditNama] = useState("");
  const [editDeskripsi, setEditDeskripsi] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await fetch("/api/kategori-rapat");
      const json = await res.json();
      if (res.ok && json.data) {
        setCategories(json.data);
      } else {
        setErrorMsg(json.error || "Gagal memuat kategori");
      }
    } catch {
      setErrorMsg("Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      setNewNama("");
      setNewDeskripsi("");
      setEditingId(null);
      setErrorMsg("");
      setSuccessMsg("");
    }
  }, [isOpen]);

  // Handle Create Kategori
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNama.trim()) return;

    try {
      setIsSubmitting(true);
      setErrorMsg("");
      setSuccessMsg("");

      const res = await fetch("/api/kategori-rapat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: newNama.trim(),
          deskripsi: newDeskripsi.trim() || null,
        }),
      });

      const json = await res.json();

      if (res.ok) {
        setSuccessMsg(`Kategori "${newNama.trim()}" berhasil ditambahkan!`);
        setNewNama("");
        setNewDeskripsi("");
        await fetchCategories();
        if (onKategoriChanged) onKategoriChanged();
      } else {
        setErrorMsg(json.error || "Gagal menambahkan kategori");
      }
    } catch {
      setErrorMsg("Terjadi kesalahan jaringan");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start Edit
  const startEdit = (kat: KategoriItem) => {
    setEditingId(kat.id);
    setEditNama(kat.nama);
    setEditDeskripsi(kat.deskripsi || "");
    setErrorMsg("");
    setSuccessMsg("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditNama("");
    setEditDeskripsi("");
  };

  // Handle Update Kategori
  const handleUpdate = async (id: string) => {
    if (!editNama.trim()) return;

    try {
      setIsUpdating(true);
      setErrorMsg("");
      setSuccessMsg("");

      const res = await fetch(`/api/kategori-rapat/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: editNama.trim(),
          deskripsi: editDeskripsi.trim() || null,
        }),
      });

      const json = await res.json();

      if (res.ok) {
        setSuccessMsg(`Kategori berhasil diperbarui menjadi "${editNama.trim()}"!`);
        cancelEdit();
        await fetchCategories();
        if (onKategoriChanged) onKategoriChanged();
      } else {
        setErrorMsg(json.error || "Gagal memperbarui kategori");
      }
    } catch {
      setErrorMsg("Terjadi kesalahan saat memperbarui data");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle Delete Kategori
  const handleDelete = async (kat: KategoriItem) => {
    if (kat.count && kat.count > 0) {
      alert(
        `Kategori "${kat.nama}" tidak dapat dihapus karena masih digunakan oleh ${kat.count} keputusan rapat. Silakan ubah kategori pada keputusan tersebut terlebih dahulu.`
      );
      return;
    }

    if (!confirm(`Hapus kategori "${kat.nama}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    try {
      setErrorMsg("");
      setSuccessMsg("");

      const res = await fetch(`/api/kategori-rapat/${kat.id}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (res.ok) {
        setSuccessMsg(`Kategori "${kat.nama}" berhasil dihapus.`);
        await fetchCategories();
        if (onKategoriChanged) onKategoriChanged();
      } else {
        setErrorMsg(json.error || "Gagal menghapus kategori");
      }
    } catch {
      setErrorMsg("Terjadi kesalahan saat menghapus");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 md:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#143265] to-[#1E4582] text-white flex items-center justify-between border-b border-blue-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <Tag className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Kelola Kategori dari Hasil Rapat
              </h3>
              <p className="text-xs text-blue-100">
                Menu Master: Tambah, edit nama/deskripsi, dan hapus kategori hasil rapat
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800">
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Form Buat Kategori Baru */}
          <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-[#143265] uppercase tracking-wider flex items-center gap-2">
              <FolderPlus className="w-4 h-4" />
              <span>Tambah Kategori dari Hasil Rapat Baru</span>
            </h4>

            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Nama Kategori *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Audit & Kepatuhan"
                    value={newNama}
                    onChange={(e) => setNewNama(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#143265] bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Deskripsi Kategori (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Risalah pengawasan kepatuhan dan audit internal"
                    value={newDeskripsi}
                    onChange={(e) => setNewDeskripsi(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#143265] bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting || !newNama.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#143265] hover:bg-[#0f244a] text-white text-xs font-bold rounded-lg shadow-xs disabled:opacity-50 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Menyimpan..." : "Tambahkan Kategori"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Daftar Kategori Terdaftar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-slate-500" />
                <span>Daftar Kategori yang Terdaftar ({categories.length})</span>
              </h4>
              <span className="text-[11px] text-slate-400">
                Kategori ini tampil pada pilihan form & filter
              </span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
                Memuat daftar kategori...
              </div>
            ) : categories.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                Belum ada kategori hasil rapat yang terdaftar. Silakan buat di atas.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                {categories.map((kat) => {
                  const isEditing = editingId === kat.id;

                  if (isEditing) {
                    return (
                      <div key={kat.id} className="p-4 bg-blue-50/60 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#143265]">
                            Edit Kategori dari Hasil Rapat
                          </span>
                          <button
                            onClick={cancelEdit}
                            className="text-xs text-slate-500 hover:text-slate-800"
                          >
                            Batal
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                              Nama Kategori
                            </label>
                            <input
                              type="text"
                              value={editNama}
                              onChange={(e) => setEditNama(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#143265] bg-white font-semibold"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                              Deskripsi
                            </label>
                            <input
                              type="text"
                              value={editDeskripsi}
                              onChange={(e) => setEditDeskripsi(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#143265] bg-white"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="px-3 py-1.5 text-xs border border-slate-300 bg-white hover:bg-slate-100 rounded-lg font-semibold text-slate-700 cursor-pointer"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdate(kat.id)}
                            disabled={isUpdating || !editNama.trim()}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isUpdating ? "Menyimpan..." : "Simpan Perubahan"}</span>
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={kat.id}
                      className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm text-slate-900">
                            {kat.nama}
                          </span>
                          {kat.count !== undefined && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                kat.count > 0
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {kat.count} Keputusan
                            </span>
                          )}
                        </div>
                        {kat.deskripsi ? (
                          <p className="text-xs text-slate-500 truncate">{kat.deskripsi}</p>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic">Tidak ada deskripsi</p>
                        )}
                      </div>

                      {/* Tombol Aksi Edit & Hapus */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => startEdit(kat)}
                          className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Kategori"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(kat)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Kategori"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
