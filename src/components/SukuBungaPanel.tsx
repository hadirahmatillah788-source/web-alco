"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  Percent,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  Layers,
  Sparkles,
  Info,
  Check,
  X,
  AlertCircle,
  TrendingUp,
  Landmark,
  Eye,
  EyeOff,
  Search,
  CheckCircle2,
  HelpCircle,
  ChevronsUpDown,
  SlidersHorizontal,
} from "lucide-react";

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

export function SukuBungaPanel() {
  const { data: session } = useSession();
  const isMaker = session?.user?.role === "ADMIN";

  // Tab utama: Konvensional vs Syariah
  const [activeJenis, setActiveJenis] = useState<"KONVENSIONAL" | "SYARIAH">("KONVENSIONAL");
  const [jenisGroups, setJenisGroups] = useState<JenisBungaGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [showInactiveOnly, setShowInactiveOnly] = useState(false);

  // Accordion State: menyimpan ID kategori yang sedang terbuka (Multi-expand didukung)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // CMS Maker Modals
  // 1. Kategori Modal
  const [isKategoriModalOpen, setIsKategoriModalOpen] = useState(false);
  const [editingKategori, setEditingKategori] = useState<KategoriBungaItem | null>(null);
  const [kategoriNama, setKategoriNama] = useState("");
  const [kategoriDeskripsi, setKategoriDeskripsi] = useState("");
  const [submittingKategori, setSubmittingKategori] = useState(false);

  // 2. Produk Modal
  const [isProdukModalOpen, setIsProdukModalOpen] = useState(false);
  const [targetKategoriId, setTargetKategoriId] = useState<string>("");
  const [targetKategoriNama, setTargetKategoriNama] = useState<string>("");
  const [editingProduk, setEditingProduk] = useState<ProdukBungaItem | null>(null);
  const [produkNama, setProdukNama] = useState("");
  const [produkRate, setProdukRate] = useState("");
  const [produkTenor, setProdukTenor] = useState("");
  const [produkSaldoMin, setProdukSaldoMin] = useState("");
  const [produkKeterangan, setProdukKeterangan] = useState("");
  const [produkIsActive, setProdukIsActive] = useState(true);
  const [submittingProduk, setSubmittingProduk] = useState(false);

  // Fetch Data Suku Bunga (Nested JSON)
  const fetchData = async () => {
    try {
      setLoading(true);
      // Sertakan inactive jika user adalah Maker
      const res = await fetch(`/api/suku-bunga?includeInactive=true`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memuat suku bunga");

      const list: JenisBungaGroup[] = json.data || [];
      setJenisGroups(list);

      // Secara default, buka kategori pertama untuk pengalaman yang nyaman
      const currentGroup = list.find((g) => g.kode === activeJenis);
      if (currentGroup && currentGroup.kategori.length > 0) {
        setExpandedCategories((prev) => {
          // Jika belum ada yang dibuka, buka kategori pertama
          if (Object.keys(prev).length === 0) {
            const initial: Record<string, boolean> = {};
            currentGroup.kategori.forEach((k, idx) => {
              initial[k.id] = idx === 0; // buka kategori pertama
            });
            return initial;
          }
          return prev;
        });
      }
    } catch (err: any) {
      setError(err.message || "Gagal mengambil data suku bunga");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Ambil group aktif saat ini
  const currentJenisGroup = useMemo(() => {
    return jenisGroups.find((g) => g.kode === activeJenis) || null;
  }, [jenisGroups, activeJenis]);

  // Handler toggle accordion kategori
  const toggleAccordion = (kategoriId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [kategoriId]: !prev[kategoriId],
    }));
  };

  // Buka semua / tutup semua
  const handleToggleAllAccordions = (expand: boolean) => {
    if (!currentJenisGroup) return;
    const nextState: Record<string, boolean> = {};
    currentJenisGroup.kategori.forEach((k) => {
      nextState[k.id] = expand;
    });
    setExpandedCategories(nextState);
  };

  // Toggle Cepat Status Aktif/Non-Aktif Produk (Maker Only)
  const handleFastToggleActive = async (produk: ProdukBungaItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isMaker) return;

    const nextStatus = !produk.isActive;
    // Optimistic UI update
    setJenisGroups((prevGroups) =>
      prevGroups.map((group) => ({
        ...group,
        kategori: group.kategori.map((kat) => ({
          ...kat,
          produk: kat.produk.map((p) =>
            p.id === produk.id ? { ...p, isActive: nextStatus } : p
          ),
        })),
      }))
    );

    try {
      const res = await fetch(`/api/suku-bunga/produk/${produk.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextStatus }),
      });
      if (!res.ok) throw new Error("Gagal memperbarui status");
    } catch (err: any) {
      alert("Gagal mengubah status: " + err.message);
      // Revert on failure
      fetchData();
    }
  };

  // Handler Modal Kategori
  const handleOpenAddKategori = () => {
    setEditingKategori(null);
    setKategoriNama("");
    setKategoriDeskripsi("");
    setIsKategoriModalOpen(true);
  };

  const handleOpenEditKategori = (kategori: KategoriBungaItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingKategori(kategori);
    setKategoriNama(kategori.nama);
    setKategoriDeskripsi(kategori.deskripsi || "");
    setIsKategoriModalOpen(true);
  };

  const handleSaveKategori = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kategoriNama.trim() || !currentJenisGroup) return;

    setSubmittingKategori(true);
    try {
      if (editingKategori) {
        // Update Kategori
        const res = await fetch(`/api/suku-bunga/kategori/${editingKategori.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nama: kategoriNama.trim(),
            deskripsi: kategoriDeskripsi.trim() || null,
          }),
        });
        if (!res.ok) throw new Error("Gagal mengupdate kategori");
      } else {
        // Create Kategori
        const res = await fetch(`/api/suku-bunga/kategori`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jenisId: currentJenisGroup.id,
            nama: kategoriNama.trim(),
            deskripsi: kategoriDeskripsi.trim() || null,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Gagal membuat kategori baru");
        if (json.data?.id) {
          // Buka accordion kategori baru
          setExpandedCategories((prev) => ({ ...prev, [json.data.id]: true }));
        }
      }

      setIsKategoriModalOpen(false);
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingKategori(false);
    }
  };

  const handleDeleteKategori = async (kategoriId: string, nama: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Hapus kategori "${nama}" beserta seluruh produk di dalamnya?`)) return;

    try {
      const res = await fetch(`/api/suku-bunga/kategori/${kategoriId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus kategori");
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handler Modal Produk
  const handleOpenAddProduk = (kategori: KategoriBungaItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTargetKategoriId(kategori.id);
    setTargetKategoriNama(kategori.nama);
    setEditingProduk(null);
    setProdukNama("");
    setProdukRate(activeJenis === "SYARIAH" ? "Nisbah 45 : 55 (Eq. 5.10%)" : "5.00% p.a.");
    setProdukTenor("");
    setProdukSaldoMin("");
    setProdukKeterangan("");
    setProdukIsActive(true);
    setIsProdukModalOpen(true);

    // Otomatis buka accordion kategori tujuan
    setExpandedCategories((prev) => ({ ...prev, [kategori.id]: true }));
  };

  const handleOpenEditProduk = (kategori: KategoriBungaItem, produk: ProdukBungaItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setTargetKategoriId(kategori.id);
    setTargetKategoriNama(kategori.nama);
    setEditingProduk(produk);
    setProdukNama(produk.nama);
    setProdukRate(produk.rate);
    setProdukTenor(produk.tenorTiering || "");
    setProdukSaldoMin(produk.saldoMinimal || "");
    setProdukKeterangan(produk.keterangan || "");
    setProdukIsActive(produk.isActive);
    setIsProdukModalOpen(true);
  };

  const handleSaveProduk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!produkNama.trim() || !produkRate.trim() || !targetKategoriId) {
      alert("Nama produk dan suku bunga/rate wajib diisi.");
      return;
    }

    setSubmittingProduk(true);
    try {
      if (editingProduk) {
        // Update Produk
        const res = await fetch(`/api/suku-bunga/produk/${editingProduk.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nama: produkNama.trim(),
            rate: produkRate.trim(),
            tenorTiering: produkTenor.trim() || null,
            saldoMinimal: produkSaldoMin.trim() || null,
            keterangan: produkKeterangan.trim() || null,
            isActive: produkIsActive,
          }),
        });
        if (!res.ok) throw new Error("Gagal mengupdate produk suku bunga");
      } else {
        // Create Produk
        const res = await fetch(`/api/suku-bunga/produk`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kategoriId: targetKategoriId,
            nama: produkNama.trim(),
            rate: produkRate.trim(),
            tenorTiering: produkTenor.trim() || null,
            saldoMinimal: produkSaldoMin.trim() || null,
            keterangan: produkKeterangan.trim() || null,
            isActive: produkIsActive,
          }),
        });
        if (!res.ok) throw new Error("Gagal menambahkan produk suku bunga");
      }

      setIsProdukModalOpen(false);
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingProduk(false);
    }
  };

  const handleDeleteProduk = async (produkId: string, nama: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Hapus produk suku bunga "${nama}" secara permanen?`)) return;

    try {
      const res = await fetch(`/api/suku-bunga/produk/${produkId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus produk");
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Hitung metrik ringkasan
  const summaryMetrics = useMemo(() => {
    if (!currentJenisGroup) return { totalKategori: 0, totalProduk: 0, totalAktif: 0, totalNonAktif: 0 };
    let totalKategori = currentJenisGroup.kategori.length;
    let totalProduk = 0;
    let totalAktif = 0;
    let totalNonAktif = 0;

    currentJenisGroup.kategori.forEach((k) => {
      totalProduk += k.produk.length;
      k.produk.forEach((p) => {
        if (p.isActive) totalAktif++;
        else totalNonAktif++;
      });
    });

    return { totalKategori, totalProduk, totalAktif, totalNonAktif };
  }, [currentJenisGroup]);

  return (
    <div className="space-y-6">
      {/* 1. SISTEM TAB UTAMA: KONVENSIONAL VS SYARIAH */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveJenis("KONVENSIONAL")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-6 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeJenis === "KONVENSIONAL"
                ? "bg-white text-[#1E3A8A] shadow-md border border-slate-200/80 font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <TrendingUp className="w-4 h-4 text-[#1E3A8A]" />
            Suku Bunga Konvensional
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-[#1E3A8A] font-semibold">
              Live
            </span>
          </button>

          <button
            onClick={() => setActiveJenis("SYARIAH")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-6 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeJenis === "SYARIAH"
                ? "bg-white text-emerald-800 shadow-md border border-slate-200/80 font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Landmark className="w-4 h-4 text-emerald-600" />
            Bagi Hasil & Nisbah Syariah
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
              iB Live
            </span>
          </button>
        </div>

        {/* Status Indikator ALCO & Maker Control */}
        <div className="flex items-center gap-3 text-xs text-slate-500 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-200/70 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Berlaku Efektif Keputusan Komite ALCO Terakhir</span>
          </div>

          {isMaker && (
            <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg font-bold border border-indigo-200 uppercase tracking-wider text-[11px]">
              Mode Maker
            </span>
          )}
        </div>
      </div>

      {/* 2. METRICS WIDGET BAR (Tema 1 Ringkasan) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1E3A8A]">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Kategori Layanan</div>
            <div className="text-xl font-extrabold text-slate-900">{summaryMetrics.totalKategori} Kategori</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Produk Aktif Terbit</div>
            <div className="text-xl font-extrabold text-slate-900">{summaryMetrics.totalAktif} Produk</div>
          </div>
        </div>

        {isMaker && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
              <EyeOff className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Produk Non-Aktif (Arsip)</div>
              <div className="text-xl font-extrabold text-slate-700">{summaryMetrics.totalNonAktif} Produk</div>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-br from-[#1E3A8A] to-blue-950 text-white rounded-2xl p-4 shadow-xs flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <div className="text-[11px] text-blue-200 uppercase tracking-wider font-semibold">Status ALCO</div>
            <div className="text-sm font-bold mt-0.5">Penetapan Q4 2026</div>
          </div>
          <Sparkles className="w-5 h-5 text-amber-300" />
        </div>
      </div>

      {/* 3. TOOLBAR PENCARIAN & KONTROL CMS MAKER */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama produk (misal: Simpeda, Deposito, KPR)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
          />
        </div>

        {/* Filter Controls & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Accordion Toggle */}
          <div className="flex items-center rounded-xl border border-slate-200 p-0.5 bg-slate-50 text-xs">
            <button
              onClick={() => handleToggleAllAccordions(true)}
              className="px-2.5 py-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-white transition-all font-medium"
              title="Buka semua kartu accordion"
            >
              Buka Semua
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={() => handleToggleAllAccordions(false)}
              className="px-2.5 py-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-white transition-all font-medium"
              title="Tutup semua kartu accordion"
            >
              Tutup Semua
            </button>
          </div>

          {/* Maker Only: Filter Non-Aktif */}
          {isMaker && (
            <button
              onClick={() => setShowInactiveOnly(!showInactiveOnly)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 ${
                showInactiveOnly
                  ? "bg-amber-100 text-amber-800 border-amber-300"
                  : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {showInactiveOnly ? "Menampilkan Non-Aktif" : "Semua Status"}
            </button>
          )}

          {/* Maker Only: Tambah Kategori Baru */}
          {isMaker && (
            <button
              onClick={handleOpenAddKategori}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1E3A8A] hover:bg-blue-900 text-white rounded-xl text-xs font-bold shadow-xs transition-all shrink-0"
            >
              <Plus className="w-4 h-4" /> Tambah Kategori
            </button>
          )}
        </div>
      </div>

      {/* 4. TEMA 1: ACCORDION / DROPDOWN CARDS */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-[#1E3A8A] mb-3" />
          <p className="text-xs text-slate-500 font-medium">Memuat data suku bunga relasional...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="text-xs">{error}</span>
        </div>
      ) : (
        <div className="space-y-4">
          {currentJenisGroup?.kategori.map((kategori) => {
            const isExpanded = !!expandedCategories[kategori.id];

            // Filter produk berdasarkan search & filter status
            const filteredProducts = kategori.produk.filter((p) => {
              // Jika viewer, sembunyikan yang non-aktif
              if (!isMaker && !p.isActive) return false;
              // Jika filter showInactiveOnly aktif untuk Maker
              if (isMaker && showInactiveOnly && p.isActive) return false;
              // Filter search
              if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchNama = p.nama.toLowerCase().includes(q);
                const matchRate = p.rate.toLowerCase().includes(q);
                const matchTenor = p.tenorTiering?.toLowerCase().includes(q) || false;
                return matchNama || matchRate || matchTenor;
              }
              return true;
            });

            const activeCount = kategori.produk.filter((p) => p.isActive).length;

            return (
              <div
                key={kategori.id}
                className="bg-white rounded-2xl border-2 border-[#1E3A8A] shadow-sm overflow-hidden transition-all duration-200"
              >
                {/* HEADER ACCORDION (Tema 1: Border Biru Tua #1E3A8A) */}
                <div
                  onClick={() => toggleAccordion(kategori.id)}
                  className={`px-5 py-4 cursor-pointer select-none flex items-center justify-between gap-4 transition-colors ${
                    isExpanded ? "bg-slate-50/80 border-b border-slate-200" : "bg-white hover:bg-slate-50/60"
                  }`}
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    {/* Expand Indicator Icon */}
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center transition-transform duration-200 shrink-0 ${
                        isExpanded ? "rotate-180 bg-[#1E3A8A] text-white" : "bg-blue-50 text-[#1E3A8A]"
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-sm sm:text-base font-extrabold text-[#1E3A8A] tracking-tight">
                          {kategori.nama}
                        </h2>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-[#1E3A8A] border border-blue-200">
                          {activeCount} Produk Aktif
                        </span>
                        {isMaker && kategori.produk.some((p) => !p.isActive) && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                            {kategori.produk.filter((p) => !p.isActive).length} Non-Aktif
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {kategori.deskripsi || "Ketentuan tarif suku bunga acuan ALCO"}
                      </p>
                    </div>
                  </div>

                  {/* Header Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isMaker && (
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleOpenAddProduk(kategori, e)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#1E3A8A] hover:bg-blue-900 text-white rounded-lg text-xs font-semibold shadow-2xs transition-all"
                          title="Tambah produk suku bunga pada kategori ini"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Tambah Produk</span>
                        </button>

                        <button
                          onClick={(e) => handleOpenEditKategori(kategori, e)}
                          className="p-1.5 text-slate-500 hover:text-[#1E3A8A] hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit nama/deskripsi kategori"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {currentJenisGroup.kategori.length > 1 && (
                          <button
                            onClick={(e) => handleDeleteKategori(kategori.id, kategori.nama, e)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus kategori ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* ACCORDION CONTENT (Tema 1: Latar Putih #FFFFFF) */}
                {isExpanded && (
                  <div className="bg-white p-4 sm:p-5 space-y-3">
                    {filteredProducts.length === 0 ? (
                      <div className="p-8 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
                        <Percent className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
                        <p className="text-xs font-semibold text-slate-600">
                          {searchQuery
                            ? "Tidak ada produk yang cocok dengan pencarian."
                            : "Belum ada produk suku bunga di kategori ini."}
                        </p>
                        {isMaker && (
                          <button
                            onClick={() => handleOpenAddProduk(kategori)}
                            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-[#1E3A8A] hover:bg-blue-100 rounded-lg text-xs font-semibold"
                          >
                            <Plus className="w-3.5 h-3.5" /> Tambah Produk Pertama
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-900 text-white text-xs uppercase tracking-wider font-semibold">
                              <th className="py-3 px-4 w-12 text-center">No</th>
                              <th className="py-3 px-4">Nama Produk</th>
                              <th className="py-3 px-4">Tenor / Tiering Saldo</th>
                              <th className="py-3 px-4">
                                {activeJenis === "KONVENSIONAL" ? "Suku Bunga (% p.a.)" : "Nisbah / Bagi Hasil (Eq.)"}
                              </th>
                              <th className="py-3 px-4">Ketentuan Saldo</th>
                              <th className="py-3 px-4">Keterangan ALCO</th>
                              {isMaker && <th className="py-3 px-4 text-center w-36">Status & Aksi</th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs">
                            {filteredProducts.map((p, idx) => (
                              <tr
                                key={p.id}
                                className={`transition-colors ${
                                  !p.isActive
                                    ? "bg-slate-100/70 opacity-70 hover:opacity-100"
                                    : idx % 2 === 0
                                    ? "bg-white hover:bg-sky-50/50"
                                    : "bg-slate-50/40 hover:bg-sky-50/50"
                                }`}
                              >
                                <td className="py-3.5 px-4 text-center font-medium text-slate-400">{idx + 1}</td>
                                
                                <td className="py-3.5 px-4">
                                  <div className="font-bold text-slate-900 text-xs sm:text-sm">{p.nama}</div>
                                  {!p.isActive && (
                                    <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.2 rounded-md bg-amber-100 text-amber-800 border border-amber-300">
                                      Non-Aktif (Arsip)
                                    </span>
                                  )}
                                </td>

                                <td className="py-3.5 px-4 font-medium text-slate-600">
                                  {p.tenorTiering ? (
                                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/80 font-semibold text-slate-700">
                                      {p.tenorTiering}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 italic">-</span>
                                  )}
                                </td>

                                {/* Rate Display (Tema 1: Menonjol dengan teks bold) */}
                                <td className="py-3.5 px-4">
                                  <span
                                    className={`inline-block px-3 py-1 rounded-xl font-extrabold text-xs sm:text-sm shadow-2xs border ${
                                      activeJenis === "KONVENSIONAL"
                                        ? "text-[#1E3A8A] bg-blue-50 border-blue-200"
                                        : "text-emerald-800 bg-emerald-50 border-emerald-200"
                                    }`}
                                  >
                                    {p.rate}
                                  </span>
                                </td>

                                <td className="py-3.5 px-4 text-slate-600">
                                  {p.saldoMinimal || <span className="text-slate-400 italic">-</span>}
                                </td>

                                <td className="py-3.5 px-4 text-slate-500 max-w-xs">
                                  {p.keterangan || <span className="text-slate-400 italic">-</span>}
                                </td>

                                {/* Maker Action Controls */}
                                {isMaker && (
                                  <td className="py-3.5 px-4 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      {/* Quick Toggle Status Aktif / Non-Aktif */}
                                      <button
                                        onClick={(e) => handleFastToggleActive(p, e)}
                                        className={`p-1.5 rounded-lg text-xs font-semibold transition-all border ${
                                          p.isActive
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                            : "bg-slate-200 text-slate-600 border-slate-300 hover:bg-slate-300"
                                        }`}
                                        title={
                                          p.isActive
                                            ? "Klik untuk menonaktifkan produk ini (Soft Delete)"
                                            : "Klik untuk mengaktifkan kembali produk ini"
                                        }
                                      >
                                        {p.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                      </button>

                                      {/* Edit Produk */}
                                      <button
                                        onClick={(e) => handleOpenEditProduk(kategori, p, e)}
                                        className="p-1.5 text-slate-600 hover:text-[#1E3A8A] hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                                        title="Edit data suku bunga produk ini"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>

                                      {/* Hapus Produk */}
                                      <button
                                        onClick={(e) => handleDeleteProduk(p.id, p.nama, e)}
                                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                                        title="Hapus produk ini"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {currentJenisGroup?.kategori.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">Belum ada kategori untuk {activeJenis}</h3>
              <p className="text-xs text-slate-500 mt-1">
                Gunakan tombol "Tambah Kategori" untuk membuat kategori layanan baru.
              </p>
              {isMaker && (
                <button
                  onClick={handleOpenAddKategori}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#1E3A8A] text-white rounded-xl text-xs font-semibold"
                >
                  <Plus className="w-4 h-4" /> Tambah Kategori Baru
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. MODAL FORM: TAMBAH / EDIT KATEGORI (MAKER) */}
      {isKategoriModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-[#1E3A8A] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-300" />
                {editingKategori ? "Edit Kategori Layanan" : `Tambah Kategori (${activeJenis})`}
              </h3>
              <button
                onClick={() => setIsKategoriModalOpen(false)}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveKategori} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Kategori *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kredit Korporasi / Sukuk Ritel / Tabungan"
                  value={kategoriNama}
                  onChange={(e) => setKategoriNama(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Deskripsi Singkat (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Keterangan singkat kelompok produk"
                  value={kategoriDeskripsi}
                  onChange={(e) => setKategoriDeskripsi(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsKategoriModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingKategori}
                  className="px-5 py-2 text-xs font-bold bg-[#1E3A8A] hover:bg-blue-900 text-white rounded-xl shadow-xs transition-colors"
                >
                  {submittingKategori ? "Menyimpan..." : "Simpan Kategori"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL FORM: TAMBAH / EDIT PRODUK SUKU BUNGA (MAKER) */}
      {isProdukModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-[#1E3A8A] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Percent className="w-4 h-4 text-emerald-400" />
                  {editingProduk ? "Edit Produk Suku Bunga" : "Tambah Produk Suku Bunga"}
                </h3>
                <div className="text-[11px] text-blue-200 mt-0.5 font-medium">
                  Kategori: <span className="text-white font-bold">{targetKategoriNama}</span>
                </div>
              </div>
              <button
                onClick={() => setIsProdukModalOpen(false)}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduk} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Produk *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Tabungan Simpeda / Deposito 1 Bulan / KMK"
                  value={produkNama}
                  onChange={(e) => setProdukNama(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    {activeJenis === "KONVENSIONAL" ? "Persentase Rate * (% p.a.)" : "Nisbah / Bagi Hasil *"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 2.50% p.a. atau 60 : 40"
                    value={produkRate}
                    onChange={(e) => setProdukRate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-extrabold text-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Tenor / Tiering Saldo
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 1 - 3 Tahun / > Rp 100 Jt"
                    value={produkTenor}
                    onChange={(e) => setProdukTenor(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Saldo Minimal / Ketentuan Nominal
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Setoran awal Rp 100.000 / Min. Rp 10.000.000"
                  value={produkSaldoMin}
                  onChange={(e) => setProdukSaldoMin(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Keterangan & Catatan Khusus ALCO
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Bebas biaya admin / Review Komite ALCO semesteran"
                  value={produkKeterangan}
                  onChange={(e) => setProdukKeterangan(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              {/* Status Aktif / Non-Aktif (Soft Delete) */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Status Publikasi Produk</span>
                  <span className="text-[11px] text-slate-500">
                    {produkIsActive
                      ? "Produk aktif dan dapat dilihat oleh seluruh viewer"
                      : "Produk disembunyikan dari viewer (hanya tampil di arsip Maker)"}
                  </span>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={produkIsActive}
                    onChange={(e) => setProdukIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProdukModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingProduk}
                  className="px-5 py-2 text-xs font-bold bg-[#1E3A8A] hover:bg-blue-900 text-white rounded-xl shadow-xs transition-colors"
                >
                  {submittingProduk ? "Menyimpan..." : "Simpan Suku Bunga"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
