"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  AlertCircle,
  TrendingUp,
  Folder,
  Layers,
  Percent,
  CheckCircle2,
  Clock,
  Sparkles,
  Printer,
} from "lucide-react";
import { PrintSukuBungaModal } from "@/components/PrintSukuBungaModal";

interface ProdukBungaItem {
  id: string;
  nama: string;
  rate: string;
  tenorTiering?: string | null;
  saldoMinimal?: string | null;
  keterangan?: string | null;
  isActive: boolean;
  urutan: number;
}

interface KategoriBungaItem {
  id: string;
  nama: string;
  slug: string;
  deskripsi?: string | null;
  urutan: number;
  produk: ProdukBungaItem[];
}

interface JenisBungaGroup {
  id: string;
  jenis: string;
  kode: "KONVENSIONAL" | "SYARIAH";
  deskripsi?: string | null;
  kategori: KategoriBungaItem[];
}

interface CorporateTrustRatesWidgetProps {
  onRefreshNeeded?: () => void;
}

export function CorporateTrustRatesWidget({ onRefreshNeeded }: CorporateTrustRatesWidgetProps) {
  const { data: session } = useSession();
  const isMaker = session?.user?.role === "ADMIN";

  const [activeTab, setActiveTab] = useState<"konvensional" | "syariah">("konvensional");
  const [groups, setGroups] = useState<JenisBungaGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // Sub-menu kategori terpilih (ID Kategori aktif)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  // Maker Modals
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProdukBungaItem | null>(null);

  // Form states for Category
  const [categoryName, setCategoryName] = useState("");
  const [categoryDesc, setCategoryDesc] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);

  // Form states for Product
  const [productName, setProductName] = useState("");
  const [productRate, setProductRate] = useState("");
  const [productTenor, setProductTenor] = useState("");
  const [productKeterangan, setProductKeterangan] = useState("");
  const [savingProduct, setSavingProduct] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/suku-bunga?includeInactive=true");
      const json = await res.json();
      if (res.ok && json.data) {
        setGroups(json.data);

        // Pilih kategori pertama secara default jika belum ada yang terpilih
        const currentGroup = json.data.find(
          (g: JenisBungaGroup) => g.kode === (activeTab === "konvensional" ? "KONVENSIONAL" : "SYARIAH")
        );
        if (currentGroup && currentGroup.kategori && currentGroup.kategori.length > 0) {
          setSelectedCategoryId((prev) => {
            const exists = currentGroup.kategori.some((k: KategoriBungaItem) => k.id === prev);
            return exists ? prev : currentGroup.kategori[0].id;
          });
        }
      }
    } catch (e) {
      console.error("Gagal memuat suku bunga:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Saat berpindah jenis (Konven vs Syariah), update kategori terpilih
  const handleTabChange = (tab: "konvensional" | "syariah") => {
    setActiveTab(tab);
    const targetGroup = groups.find(
      (g) => g.kode === (tab === "konvensional" ? "KONVENSIONAL" : "SYARIAH")
    );
    if (targetGroup && targetGroup.kategori && targetGroup.kategori.length > 0) {
      setSelectedCategoryId(targetGroup.kategori[0].id);
    } else {
      setSelectedCategoryId("");
    }
  };

  const currentGroup = groups.find(
    (g) => g.kode === (activeTab === "konvensional" ? "KONVENSIONAL" : "SYARIAH")
  );
  const categories = currentGroup?.kategori || [];

  // Kategori aktif berdasarkan sub-menu yang diklik
  const activeCategory =
    categories.find((k) => k.id === selectedCategoryId) || (categories.length > 0 ? categories[0] : null);

  // Open add product modal
  const handleOpenAddProduct = () => {
    if (!activeCategory) return;
    setEditingProduct(null);
    setProductName("");
    setProductRate("");
    setProductTenor("");
    setProductKeterangan("");
    setIsProductModalOpen(true);
  };

  // Open edit product modal
  const handleOpenEditProduct = (prod: ProdukBungaItem) => {
    setEditingProduct(prod);
    setProductName(prod.nama);
    setProductRate(prod.rate);
    setProductTenor(prod.tenorTiering || "");
    setProductKeterangan(prod.keterangan || "");
    setIsProductModalOpen(true);
  };

  // Delete product
  const handleDeleteProduct = async (id: string, nama: string) => {
    if (!confirm(`Hapus produk suku bunga "${nama}"?`)) return;
    try {
      const res = await fetch(`/api/suku-bunga/produk/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchData();
        if (onRefreshNeeded) onRefreshNeeded();
      } else {
        alert("Gagal menghapus produk");
      }
    } catch {
      alert("Terjadi kesalahan saat menghapus");
    }
  };

  // Save product (Add or Edit)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCategory || !productName.trim() || !productRate.trim()) return;

    try {
      setSavingProduct(true);
      const url = editingProduct
        ? `/api/suku-bunga/produk/${editingProduct.id}`
        : "/api/suku-bunga/produk";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kategoriId: activeCategory.id,
          nama: productName.trim(),
          rate: productRate.trim(),
          tenorTiering: productTenor.trim() || null,
          keterangan: productKeterangan.trim() || null,
        }),
      });

      if (res.ok) {
        setIsProductModalOpen(false);
        await fetchData();
        if (onRefreshNeeded) onRefreshNeeded();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menyimpan produk");
      }
    } catch {
      alert("Terjadi kesalahan saat menyimpan produk");
    } finally {
      setSavingProduct(false);
    }
  };

  // Save category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim() || !currentGroup) return;

    try {
      setSavingCategory(true);
      const res = await fetch("/api/suku-bunga/kategori", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jenisId: currentGroup.id,
          nama: categoryName.trim(),
          deskripsi: categoryDesc.trim() || null,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setIsCategoryModalOpen(false);
        setCategoryName("");
        setCategoryDesc("");
        await fetchData();
        if (json.data?.id) {
          setSelectedCategoryId(json.data.id);
        }
        if (onRefreshNeeded) onRefreshNeeded();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menambah kategori");
      }
    } catch {
      alert("Terjadi kesalahan");
    } finally {
      setSavingCategory(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 transition-all space-y-5">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Suku Bunga & Nisbah Acuan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Publikasi suku bunga simpanan, pinjaman, dan bagi hasil resmi hasil keputusan ALCO.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto flex-wrap">
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            title="Cetak seluruh kategori dan produk suku bunga ke format print/PDF resmi"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print All Kategori</span>
          </button>

          {isMaker && (
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="bg-[#143265] hover:bg-[#0f244a] text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Kategori</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub Tabs Jenis: Konvensional vs Syariah */}
      <div className="flex items-center gap-6 border-b border-slate-200">
        <button
          onClick={() => handleTabChange("konvensional")}
          className={`pb-2.5 text-xs sm:text-sm font-semibold transition-all relative cursor-pointer ${
            activeTab === "konvensional"
              ? "text-slate-900 font-bold border-b-2 border-[#143265]"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Suku Bunga Konvensional
        </button>

        <button
          onClick={() => handleTabChange("syariah")}
          className={`pb-2.5 text-xs sm:text-sm font-semibold transition-all relative cursor-pointer ${
            activeTab === "syariah"
              ? "text-slate-900 font-bold border-b-2 border-[#143265]"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Suku Bunga Syariah (Menyusul)
        </button>
      </div>

      {/* Sub Menu Bar untuk Setiap Kategori */}
      {loading ? (
        <div className="h-10 bg-slate-100 animate-pulse rounded-xl" />
      ) : categories.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          Belum ada kategori terdaftar pada jenis ini.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Sub Menu Horizontal Pills/Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 border-b border-slate-100 scrollbar-thin">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
              Kategori:
            </span>
            {categories.map((kat) => {
              const isSelected = activeCategory?.id === kat.id;
              const productCount = kat.produk?.length || 0;

              return (
                <button
                  key={kat.id}
                  onClick={() => setSelectedCategoryId(kat.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer select-none ${
                    isSelected
                      ? "bg-[#143265] text-white shadow-xs ring-2 ring-[#143265]/20"
                      : "bg-slate-100/80 hover:bg-slate-200/80 text-slate-700"
                  }`}
                >
                  <span>{kat.nama}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-slate-200/90 text-slate-600"
                    }`}
                  >
                    {productCount}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Panel Konten Kategori Terpilih */}
          {activeCategory && (
            <div className="border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
              {/* Header Kategori Terpilih */}
              <div className="p-4 bg-slate-50/80 border-b border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-4 bg-[#143265] rounded-full inline-block" />
                    Kategori: {activeCategory.nama}
                  </h3>
                  {activeCategory.deskripsi && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {activeCategory.deskripsi}
                    </p>
                  )}
                </div>

                {/* Maker Action: Tambah Produk ke Kategori ini */}
                {isMaker && (
                  <button
                    onClick={handleOpenAddProduct}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#143265] hover:bg-[#0f244a] rounded-lg shadow-2xs transition-colors cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Produk ke {activeCategory.nama}</span>
                  </button>
                )}
              </div>

              {/* TABEL SUKU BUNGA KORPORAT: Nama Produk | Jangka Waktu | Suku Bunga | Keterangan */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-3 px-4 w-12 text-center text-[11px]">No.</th>
                      <th className="py-3 px-4 text-[11px]">Nama Produk</th>
                      <th className="py-3 px-4 text-[11px]">Jangka Waktu</th>
                      <th className="py-3 px-4 text-[11px]">Suku Bunga</th>
                      <th className="py-3 px-4 text-[11px]">Keterangan</th>
                      {isMaker && <th className="py-3 px-4 w-24 text-center text-[11px]">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {activeCategory.produk && activeCategory.produk.length > 0 ? (
                      activeCategory.produk.map((prod, pIdx) => (
                        <tr
                          key={prod.id}
                          className={
                            pIdx % 2 === 0
                              ? "bg-white hover:bg-slate-50 transition-colors"
                              : "bg-slate-50/40 hover:bg-slate-50 transition-colors"
                          }
                        >
                          {/* No. */}
                          <td className="py-3 px-4 text-center font-medium text-slate-400">
                            {pIdx + 1}
                          </td>

                          {/* 1. Nama Produk */}
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {prod.nama}
                            {prod.saldoMinimal && (
                              <span className="block text-[10px] text-slate-400 font-normal">
                                {prod.saldoMinimal}
                              </span>
                            )}
                          </td>

                          {/* 2. Jangka Waktu (Tenor / Tiering) */}
                          <td className="py-3 px-4 text-slate-700 font-medium">
                            {prod.tenorTiering ? (
                              <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md text-[11px] text-slate-700">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {prod.tenorTiering}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">-</span>
                            )}
                          </td>

                          {/* 3. Suku Bunga (Rate) */}
                          <td className="py-3 px-4">
                            <span className="font-extrabold text-[#143265] text-xs sm:text-sm bg-blue-50/70 border border-blue-200/60 px-2 py-0.5 rounded-md inline-block">
                              {prod.rate}
                            </span>
                          </td>

                          {/* 4. Keterangan */}
                          <td className="py-3 px-4 text-slate-600 leading-relaxed text-[11px]">
                            {prod.keterangan || <span className="text-slate-400 italic">-</span>}
                          </td>

                          {/* Aksi Maker */}
                          {isMaker && (
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditProduct(prod)}
                                  className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Edit Produk"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(prod.id, prod.nama)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Hapus Produk"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={isMaker ? 6 : 5}
                          className="py-10 text-center text-xs text-slate-400 italic"
                        >
                          Belum ada produk suku bunga terdaftar pada kategori {activeCategory.nama}.
                          {isMaker && (
                            <div className="mt-2">
                              <button
                                onClick={handleOpenAddProduct}
                                className="inline-flex items-center gap-1 text-xs font-bold text-[#143265] hover:underline"
                              >
                                <Plus className="w-3 h-3" /> Tambah Produk Sekarang
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Maker: Tambah / Edit Kategori */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#143265] text-white p-4 flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                Tambah Kategori Suku Bunga
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-blue-200 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Kategori Baru
                </label>
                <input
                  type="text"
                  placeholder="Misal: Tabungan, Deposito, Kredit Produktif..."
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#143265] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deskripsi / Keterangan Kategori
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan singkat cakupan produk kategori ini..."
                  value={categoryDesc}
                  onChange={(e) => setCategoryDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#143265] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingCategory}
                  className="px-4 py-1.5 text-xs bg-[#143265] hover:bg-[#0f244a] text-white font-bold rounded-lg shadow-xs disabled:opacity-50"
                >
                  {savingCategory ? "Menyimpan..." : "Simpan Kategori"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Maker: Tambah / Edit Produk */}
      {isProductModalOpen && activeCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#143265] text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Plus className="w-4 h-4 text-amber-400" />
                  {editingProduct ? "Edit Produk Suku Bunga" : "Tambah Produk Suku Bunga"}
                </h3>
                <p className="text-[11px] text-blue-200 mt-0.5">
                  Kategori: <strong className="text-white">{activeCategory.nama}</strong>
                </p>
              </div>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-blue-200 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Nama Produk
                </label>
                <input
                  type="text"
                  placeholder="Misal: Tabungan Simpedes, Deposito 1 Bulan, Kredit Modal Kerja..."
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#143265] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    2. Jangka Waktu
                  </label>
                  <input
                    type="text"
                    placeholder="Misal: 1 Bulan, 1 - 3 Tahun, Saldo > Rp 100 Jt..."
                    value={productTenor}
                    onChange={(e) => setProductTenor(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#143265] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    3. Suku Bunga
                  </label>
                  <input
                    type="text"
                    placeholder="Misal: 2.5% p.a., 4.8% p.a...."
                    value={productRate}
                    onChange={(e) => setProductRate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#143265] focus:outline-none font-bold text-[#143265]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  4. Keterangan
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan ketentuan, fasilitas ARO, bunga harian, syarat, dll..."
                  value={productKeterangan}
                  onChange={(e) => setProductKeterangan(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#143265] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="px-4 py-1.5 text-xs bg-[#143265] hover:bg-[#0f244a] text-white font-bold rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {savingProduct ? "Menyimpan..." : editingProduct ? "Perbarui Produk" : "Tambahkan ke Kategori"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cetak Seluruh Kategori Suku Bunga */}
      <PrintSukuBungaModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        groups={groups}
      />
    </div>
  );
}
