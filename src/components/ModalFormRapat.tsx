"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Table, AlignLeft, Eye, Edit3, Link as LinkIcon, Check, AlertCircle } from "lucide-react";
import { DecisionContentRenderer } from "@/components/DecisionContentRenderer";

interface LampiranInput {
  namaFile: string;
  fileUrl: string;
  keterangan?: string;
}

interface ModalFormRapatProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any; // If editing
}

export function ModalFormRapat({ isOpen, onClose, onSuccess, initialData }: ModalFormRapatProps) {
  const [judul, setJudul] = useState("");
  const [nomorRapat, setNomorRapat] = useState("");
  const [tanggalRapat, setTanggalRapat] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [kategori, setKategori] = useState("ALCO / Treasury");
  const [availableCategories, setAvailableCategories] = useState<{ id: string; nama: string }[]>([]);
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("PUBLISHED");
  const [isAktif, setIsAktif] = useState(true);
  const [keteranganStatus, setKeteranganStatus] = useState("");
  const [ringkasan, setRingkasan] = useState("");
  const [isiKeputusan, setIsiKeputusan] = useState("");
  const [lampiranList, setLampiranList] = useState<LampiranInput[]>([]);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch Kategori dari Hasil Rapat
  useEffect(() => {
    if (isOpen) {
      fetch("/api/kategori-rapat")
        .then((res) => res.json())
        .then((json) => {
          if (json.data && Array.isArray(json.data) && json.data.length > 0) {
            setAvailableCategories(json.data);
          }
        })
        .catch((err) => console.error("Error fetching categories:", err));
    }
  }, [isOpen]);

  // New attachment inputs
  const [newLampiranName, setNewLampiranName] = useState("");
  const [newLampiranUrl, setNewLampiranUrl] = useState("");
  const [newLampiranKet, setNewLampiranKet] = useState("");

  useEffect(() => {
    if (initialData) {
      setJudul(initialData.judul || "");
      setNomorRapat(initialData.nomorRapat || "");
      setTanggalRapat(
        initialData.tanggalRapat
          ? new Date(initialData.tanggalRapat).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0]
      );
      setLokasi(initialData.lokasi || "");
      setKategori(initialData.kategori || "ALCO / Treasury");
      setStatus(initialData.status || "PUBLISHED");
      setIsAktif(initialData.isAktif !== undefined ? Boolean(initialData.isAktif) : true);
      setKeteranganStatus(initialData.keteranganStatus || "");
      setRingkasan(initialData.ringkasan || "");
      setIsiKeputusan(initialData.isiKeputusan || "");
      setLampiranList(
        Array.isArray(initialData.lampiran)
          ? initialData.lampiran.map((l: any) => ({
              namaFile: l.namaFile,
              fileUrl: l.fileUrl,
              keterangan: l.keterangan || "",
            }))
          : []
      );
    } else {
      setJudul("");
      setNomorRapat("");
      setTanggalRapat(new Date().toISOString().split("T")[0]);
      setLokasi("Boardroom Lt. 8 / Hybrid");
      setKategori("ALCO / Treasury");
      setStatus("PUBLISHED");
      setIsAktif(true);
      setKeteranganStatus("");
      setRingkasan("");
      setIsiKeputusan(
        "### Pembahasan Utama\nUraikan latar belakang dan dasar pertimbangan keputusan rapat di sini.\n\n### Keputusan Rapat\nBerikut adalah matriks ketetapan resmi komite:\n\n| No | Parameter / Produk | Keputusan Sebelumnya | Keputusan Baru | Keterangan |\n| :--- | :--- | :--- | :--- | :--- |\n| 1 | Suku Bunga Deposito 1 Bln | 4.25% p.a. | 4.50% p.a. | Efektif awal bulan |\n| 2 | Suku Bunga Deposito 3 Bln | 4.75% p.a. | 5.00% p.a. | Tiering standar |\n\n### Tindak Lanjut\n1. Seluruh cabang melakukan update brosur dan media promosi.\n2. Divisi TI mengupdate parameter suku bunga di Core Banking."
      );
      setLampiranList([]);
    }
    setErrorMessage("");
    setActiveTab("edit");
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // Insert template helpers
  const handleInsertTable = () => {
    const tableTemplate = `\n\n| Parameter / Segmen | Suku Bunga / Tarif Lama | Suku Bunga / Tarif Baru | Berlaku Efektif | Catatan |\n| :--- | :--- | :--- | :--- | :--- |\n| Deposito 1 Bulan | 4.25% p.a. | 4.50% p.a. | 01 Nov 2026 | Counter Rate |\n| Deposito 3 Bulan | 4.75% p.a. | 5.00% p.a. | 01 Nov 2026 | Nominal < 1 M |\n`;
    setIsiKeputusan((prev) => prev + tableTemplate);
  };

  const handleInsertParagraph = () => {
    const pTemplate = `\n\n### Sub-Judul Paragraf Baru\nTuliskan narasi penjelasan dan uraian detail keputusan di sini.\n`;
    setIsiKeputusan((prev) => prev + pTemplate);
  };

  const handleAddLampiran = () => {
    if (!newLampiranName.trim() || !newLampiranUrl.trim()) {
      alert("Nama dokumen dan URL Google Drive wajib diisi");
      return;
    }
    setLampiranList((prev) => [
      ...prev,
      {
        namaFile: newLampiranName.trim(),
        fileUrl: newLampiranUrl.trim(),
        keterangan: newLampiranKet.trim() || "Mode Hanya Lihat (View-Only)",
      },
    ]);
    setNewLampiranName("");
    setNewLampiranUrl("");
    setNewLampiranKet("");
  };

  const handleRemoveLampiran = (index: number) => {
    setLampiranList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim() || !isiKeputusan.trim()) {
      setErrorMessage("Judul rapat dan isi keputusan wajib diisi");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const payload = {
        judul,
        nomorRapat,
        tanggalRapat,
        lokasi,
        kategori,
        status,
        isAktif,
        keteranganStatus,
        ringkasan,
        isiKeputusan,
        lampiran: lampiranList,
      };

      const url = initialData?.id ? `/api/pengumuman/${initialData.id}` : `/api/pengumuman`;
      const method = initialData?.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan pengumuman");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan saat menyimpan data");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 md:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-blue-400" />
              {initialData?.id ? "Edit Risalah Keputusan Rapat" : "Buat Risalah & Keputusan Rapat Baru"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Kelola dokumen risalah, status aktif/non-aktif, format tabel keputusan, dan tautan Google Drive
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Grid Informasi Umum */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Judul Rapat / Ketetapan Resmi *
              </label>
              <input
                type="text"
                required
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                placeholder="Contoh: Risalah Rapat Komite ALCO - Penetapan Penyesuaian Suku Bunga Q4"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nomor Berita Acara / Risalah
              </label>
              <input
                type="text"
                value={nomorRapat}
                onChange={(e) => setNomorRapat(e.target.value)}
                placeholder="Contoh: ALCO/BA/2026/X/014"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Tanggal Rapat *
              </label>
              <input
                type="date"
                required
                value={tanggalRapat}
                onChange={(e) => setTanggalRapat(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Kategori dari Hasil Rapat *
              </label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#143265] text-sm bg-white font-medium text-slate-800"
              >
                {availableCategories.length > 0 ? (
                  availableCategories.map((cat) => (
                    <option key={cat.id} value={cat.nama}>
                      {cat.nama}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="ALCO / Treasury">ALCO / Treasury</option>
                    <option value="Kredit & Risiko">Kredit & Risiko</option>
                    <option value="Manajemen & Bisnis">Manajemen & Bisnis</option>
                    <option value="Operasional Cabang">Operasional Cabang</option>
                    <option value="SDM & Umum">SDM & Umum</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Status Publikasi
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-slate-800"
              >
                <option value="PUBLISHED">Published (Dapat Dilihat Seluruh Karyawan)</option>
                <option value="DRAFT">Draft (Hanya Terlihat Oleh Admin)</option>
              </select>
            </div>

            {/* Masa Berlaku Keputusan (Aktif vs Non-Aktif / Diperbarui) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Status Masa Berlaku Keputusan
              </label>
              <select
                value={isAktif ? "aktif" : "non-aktif"}
                onChange={(e) => setIsAktif(e.target.value === "aktif")}
                className={`w-full px-3 py-2 rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 ${
                  isAktif
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800 focus:ring-emerald-500"
                    : "border-amber-300 bg-amber-50 text-amber-800 focus:ring-amber-500"
                }`}
              >
                <option value="aktif">● Keputusan Aktif (Sedang Berlaku / Terbaru)</option>
                <option value="non-aktif">○ Keputusan Non-Aktif (Telah Diperbarui / Kedaluwarsa)</option>
              </select>
            </div>

            {!isAktif ? (
              <div>
                <label className="block text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1">
                  Catatan Pembaruan / Pengganti
                </label>
                <input
                  type="text"
                  value={keteranganStatus}
                  onChange={(e) => setKeteranganStatus(e.target.value)}
                  placeholder="Contoh: Telah diperbarui oleh Risalah ALCO No. 014/X/2026"
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-amber-50/50 text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>
            ) : (
              <div className="flex items-center text-xs text-slate-500 italic pt-6">
                Keputusan ini saat ini berstatus aktif dan menjadi acuan operasional.
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Ringkasan Eksekutif (Singkat)
              </label>
              <input
                type="text"
                value={ringkasan}
                onChange={(e) => setRingkasan(e.target.value)}
                placeholder="Ringkasan 1-2 kalimat untuk preview di beranda"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Isi Keputusan dengan Tombol Paragraf & Tabel */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
            <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 mr-2">
                  Isi Keputusan Rapat:
                </span>
                <button
                  type="button"
                  onClick={handleInsertParagraph}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium shadow-2xs transition-colors"
                >
                  <AlignLeft className="w-3.5 h-3.5 text-blue-600" /> + Paragraf Baru
                </button>
                <button
                  type="button"
                  onClick={handleInsertTable}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium shadow-2xs transition-colors"
                >
                  <Table className="w-3.5 h-3.5 text-emerald-600" /> + Sisipkan Tabel Keputusan
                </button>
              </div>

              {/* Tab Switcher: Edit vs Preview */}
              <div className="flex items-center rounded-lg bg-slate-200 p-0.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setActiveTab("edit")}
                  className={`px-3 py-1 rounded-md transition-all ${
                    activeTab === "edit" ? "bg-white text-slate-900 shadow-xs font-semibold" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Editor Teks
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={`px-3 py-1 rounded-md transition-all flex items-center gap-1 ${
                    activeTab === "preview" ? "bg-white text-slate-900 shadow-xs font-semibold" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 text-blue-600" /> Pratinjau Tampilan
                </button>
              </div>
            </div>

            <div className="p-4">
              {activeTab === "edit" ? (
                <div>
                  <textarea
                    rows={12}
                    required
                    value={isiKeputusan}
                    onChange={(e) => setIsiKeputusan(e.target.value)}
                    placeholder="Tuliskan paragraf keputusan dan tabel Markdown di sini..."
                    className="w-full p-3 font-mono text-xs leading-relaxed bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                  <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                    <span className="font-semibold">Tips:</span> Gunakan tombol di atas untuk menyisipkan paragraf sub-bab atau tabel keputusan secara instan.
                  </p>
                </div>
              ) : (
                <div className="bg-white p-5 rounded-xl border border-slate-200 min-h-[250px]">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Pratinjau Hasil Format Paragraf & Tabel:
                  </p>
                  <DecisionContentRenderer content={isiKeputusan} />
                </div>
              )}
            </div>
          </div>

          {/* Lampiran Dokumen: Google Drive Link (View-Only) */}
          <div className="border border-slate-200 rounded-2xl p-5 bg-white">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-blue-600" />
                  Lampiran Dokumen Google Drive (Mode Hanya Lihat)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lampiran disajikan dalam mode penampil aman (tanpa izin unduh, cetak, atau edit).
                </p>
              </div>
            </div>

            {/* List Existing Lampiran */}
            {lampiranList.length > 0 && (
              <div className="space-y-2 mb-4">
                {lampiranList.map((lamp, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="font-semibold text-slate-800 truncate">{lamp.namaFile}</p>
                      <p className="text-[11px] text-blue-600 truncate">{lamp.fileUrl}</p>
                      {lamp.keterangan && <p className="text-[11px] text-slate-500">{lamp.keterangan}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveLampiran(index)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                      title="Hapus lampiran"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Form Input Tambah Lampiran */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 border border-dashed border-slate-300">
              <div>
                <input
                  type="text"
                  placeholder="Nama Dokumen (e.g. Risalah_ALCO_Signed.pdf)"
                  value={newLampiranName}
                  onChange={(e) => setNewLampiranName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Tautan Google Drive (file/d/...)"
                  value={newLampiranUrl}
                  onChange={(e) => setNewLampiranUrl(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Keterangan (Opsional)"
                  value={newLampiranKet}
                  onChange={(e) => setNewLampiranKet(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddLampiran}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah
                </button>
              </div>
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                "Menyimpan..."
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {initialData?.id ? "Simpan Perubahan Risalah" : "Terbitkan Risalah Rapat"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
