"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { CorporateTrustRatesWidget } from "@/components/CorporateTrustRatesWidget";
import { CorporateMeetingDecisionCard } from "@/components/CorporateMeetingDecisionCard";
import { ViewerManagementPanel } from "@/components/ViewerManagementPanel";
import { ModalFormRapat } from "@/components/ModalFormRapat";
import { ModalKategoriHasilRapat } from "@/components/ModalKategoriHasilRapat";
import { GoogleDriveViewerModal } from "@/components/GoogleDriveViewerModal";
import {
  FileText,
  Archive,
  Users,
  Plus,
  Search,
  Sparkles,
  History,
  AlertCircle,
  TrendingUp,
  Tag,
  Filter,
  X,
} from "lucide-react";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isAdmin = session?.user?.role === "ADMIN";

  // Wajib Login: Alihkan ke /login jika belum terautentikasi
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=/alco");
    }
  }, [status, router]);

  // Sub-Navigation Tabs: "hasil-rapat" vs "suku-bunga" vs "arsip" vs "viewers"
  const [activeTab, setActiveTab] = useState<"hasil-rapat" | "suku-bunga" | "arsip" | "viewers">("hasil-rapat");

  // Rapat State
  const [rapatList, setRapatList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter State: Kategori dari Hasil Rapat & Tahun
  const [selectedKategori, setSelectedKategori] = useState("");
  const [selectedTahun, setSelectedTahun] = useState("");
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);

  // Pagination State (Maksimal 20 keputusan per halaman)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;

  // Modals State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [formInitialData, setFormInitialData] = useState<any | null>(null);
  const [driveViewerDoc, setDriveViewerDoc] = useState<any | null>(null);

  // Fetch Kategori List
  const fetchKategoriList = async () => {
    try {
      const res = await fetch("/api/kategori-rapat");
      const json = await res.json();
      if (res.ok && json.data) {
        setCategoriesList(json.data);
      }
    } catch (err) {
      console.error("Error fetching kategori list:", err);
    }
  };

  useEffect(() => {
    fetchKategoriList();
  }, []);

  // Fetch Pengumuman
  const fetchPengumuman = async (page = currentPage) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (selectedKategori && selectedKategori !== "Semua") params.set("kategori", selectedKategori);
      if (selectedTahun && selectedTahun !== "Semua") params.set("tahun", selectedTahun);
      params.set("page", page.toString());
      params.set("limit", itemsPerPage.toString());

      // Saring berdasarkan tab: hasil-rapat = aktif, arsip = non-aktif
      if (activeTab === "hasil-rapat") {
        params.set("isAktif", "true");
      } else if (activeTab === "arsip") {
        params.set("isAktif", "false");
      }

      const res = await fetch(`/api/pengumuman?${params.toString()}`);
      const json = await res.json();
      if (res.ok) {
        setRapatList(json.data || []);
        if (json.pagination) {
          setTotalPages(json.pagination.totalPages || 1);
          setTotalCount(json.pagination.total || 0);
        }
        if (json.availableYears && Array.isArray(json.availableYears)) {
          setAvailableYears(json.availableYears);
        }
      }
    } catch (err) {
      console.error("Error fetching pengumuman:", err);
    } finally {
      setLoading(false);
    }
  };

  // Reset halaman ke 1 saat berganti tab atau kriteria pencarian/filter
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, selectedKategori, selectedTahun]);

  useEffect(() => {
    if (activeTab === "hasil-rapat" || activeTab === "arsip") {
      fetchPengumuman(currentPage);
    }
  }, [searchQuery, activeTab, selectedKategori, selectedTahun, currentPage]);

  // Quick toggle active / inactive (Status Toggle button in screenshot)
  const handleToggleAktif = async (rapat: any) => {
    const nextAktif = !rapat.isAktif;
    const actionLabel = nextAktif
      ? "mengaktifkan kembali keputusan ini dan menampilkannya di Hasil Rapat?"
      : "menandai keputusan ini sebagai NON-AKTIF (memindahkannya ke Arsip)?";

    let catatan = rapat.keteranganStatus || "";
    if (!nextAktif) {
      const inputCatatan = prompt(
        "Keterangan pembaruan (misal: Telah diperbarui oleh Risalah ALCO No. 014/X/2026):",
        catatan || "Telah diperbarui oleh keputusan rapat terbaru."
      );
      if (inputCatatan === null) return; // Cancelled
      catatan = inputCatatan;
    }

    if (!confirm(`Apakah Anda yakin ingin ${actionLabel}`)) return;

    try {
      const res = await fetch(`/api/pengumuman/${rapat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isAktif: nextAktif,
          keteranganStatus: nextAktif ? null : catatan,
        }),
      });

      if (res.ok) {
        fetchPengumuman();
      } else {
        alert("Gagal memperbarui status masa berlaku");
      }
    } catch (err) {
      alert("Terjadi kesalahan saat mengubah status");
    }
  };

  const handleEditRapat = (rapat: any) => {
    setFormInitialData(rapat);
    setIsFormModalOpen(true);
  };

  const handleCreateNew = () => {
    setFormInitialData(null);
    setIsFormModalOpen(true);
  };

  const handleOpenDriveDoc = (lampiran: any) => {
    setDriveViewerDoc({
      title: lampiran.namaFile,
      url: lampiran.fileUrl,
      keterangan: lampiran.keterangan,
    });
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F4F7]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-[#143265] rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Memeriksa sesi login...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated" || !session) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F3F4F7] text-slate-800">
      {/* Top Header Banner (PAPAN PENGUMUMAN HASIL RAPAT) */}
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />

      {/* Sub-Navigation Bar: Hasil Rapat | Arsip | Manajemen Viewer (Sesuai Gambar) */}
      <nav className="bg-white border-b border-slate-200/90 shadow-2xs sticky top-14 sm:top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center gap-6 sm:gap-8 h-full">
              <button
                onClick={() => setActiveTab("hasil-rapat")}
                className={`h-full px-1 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  activeTab === "hasil-rapat"
                    ? "border-[#143265] text-[#143265] font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <span>Hasil Rapat</span>
              </button>

              <button
                onClick={() => setActiveTab("suku-bunga")}
                className={`h-full px-1 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  activeTab === "suku-bunga"
                    ? "border-[#143265] text-[#143265] font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <span>Suku Bunga</span>
              </button>

              <button
                onClick={() => setActiveTab("arsip")}
                className={`h-full px-1 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  activeTab === "arsip"
                    ? "border-[#143265] text-[#143265] font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <span>Arsip</span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => setActiveTab("viewers")}
                  className={`h-full px-1 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                    activeTab === "viewers"
                      ? "border-[#143265] text-[#143265] font-bold"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-blue-800" />
                  <span>Manajemen Viewer</span>
                </button>
              )}
            </div>

            {/* Quick Action for Maker */}
            {isAdmin && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCategoryManagerOpen(true)}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#143265] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
                  title="Menu Kategori: Buat, Edit, Hapus Kategori dari Hasil Rapat"
                >
                  <Tag className="w-3.5 h-3.5 text-[#143265]" />
                  <span>Menu Kategori</span>
                </button>

                {activeTab === "hasil-rapat" && (
                  <button
                    onClick={handleCreateNew}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#143265] hover:bg-[#0f244a] rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Keputusan Rapat</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Body Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5 sm:space-y-6">
        {/* TAB 1: HASIL RAPAT (Hanya Hasil Keputusan Rapat ALCO) */}
        {activeTab === "hasil-rapat" && (
          <div className="space-y-5">
            {/* Filter Bar: Kategori dari Hasil Rapat & Tahun */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#143265] shrink-0" />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Filter:
                  </span>
                </div>

                {/* Filter Kategori dari Hasil Rapat */}
                <div className="flex items-center gap-1.5 min-w-[220px]">
                  <label htmlFor="filter-kategori-aktif" className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                    Kategori dari Hasil Rapat:
                  </label>
                  <select
                    id="filter-kategori-aktif"
                    value={selectedKategori}
                    onChange={(e) => setSelectedKategori(e.target.value)}
                    className="w-full text-xs font-semibold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#143265] transition-colors cursor-pointer"
                  >
                    <option value="">Semua Kategori</option>
                    {categoriesList.map((kat) => (
                      <option key={kat.id} value={kat.nama}>
                        {kat.nama}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filter Tahun (menyamakan tahun yang sudah terdata) */}
                <div className="flex items-center gap-1.5 min-w-[140px]">
                  <label htmlFor="filter-tahun-aktif" className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                    Tahun:
                  </label>
                  <select
                    id="filter-tahun-aktif"
                    value={selectedTahun}
                    onChange={(e) => setSelectedTahun(e.target.value)}
                    className="w-full text-xs font-semibold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#143265] transition-colors cursor-pointer"
                  >
                    <option value="">Semua Tahun</option>
                    {availableYears.map((yr) => (
                      <option key={yr} value={yr.toString()}>
                        Tahun {yr}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reset Filter Button */}
                {(selectedKategori || selectedTahun) && (
                  <button
                    onClick={() => {
                      setSelectedKategori("");
                      setSelectedTahun("");
                    }}
                    className="text-xs font-semibold text-red-600 hover:text-red-800 px-2.5 py-1 rounded-md hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reset Filter</span>
                  </button>
                )}
              </div>

              {/* Action Maker Mobile */}
              {isAdmin && (
                <div className="flex sm:hidden items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setIsCategoryManagerOpen(true)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#143265] bg-blue-50 border border-blue-200 rounded-lg"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>Menu Kategori</span>
                  </button>
                  <button
                    onClick={handleCreateNew}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#143265] rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Buat Rapat</span>
                  </button>
                </div>
              )}
            </div>
            {loading ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse">
                <div className="h-6 w-3/4 bg-slate-200 rounded" />
                <div className="h-4 w-1/4 bg-slate-200 rounded" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div className="space-y-3">
                    <div className="h-4 bg-slate-100 rounded" />
                    <div className="h-4 bg-slate-100 rounded" />
                    <div className="h-4 w-4/5 bg-slate-100 rounded" />
                  </div>
                  <div className="h-36 bg-slate-100 rounded-xl" />
                </div>
              </div>
            ) : rapatList.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
                <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  Tidak Ada Hasil Keputusan Rapat Aktif
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {searchQuery
                    ? `Tidak ditemukan hasil rapat dengan kata kunci "${searchQuery}".`
                    : "Semua keputusan saat ini berstatus arsip atau belum ada keputusan yang dipublikasikan."}
                </p>
                {isAdmin && (
                  <button
                    onClick={handleCreateNew}
                    className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#143265] text-white text-xs font-bold rounded-lg shadow-xs hover:bg-[#0f244a]"
                  >
                    <Plus className="w-3.5 h-3.5" /> Buat Keputusan Rapat Baru
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                {rapatList.map((rapat) => (
                  <CorporateMeetingDecisionCard
                    key={rapat.id}
                    rapat={rapat}
                    isMaker={isAdmin}
                    onEdit={handleEditRapat}
                    onToggleAktif={handleToggleAktif}
                    onOpenDrive={handleOpenDriveDoc}
                  />
                ))}

                {/* Pagination jika keputusan lebih dari 20 */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 bg-white p-4 rounded-xl border">
                    <p className="text-xs text-slate-500 font-medium">
                      Menampilkan <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> - <strong>{Math.min(currentPage * itemsPerPage, totalCount)}</strong> dari <strong>{totalCount}</strong> keputusan rapat
                    </p>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors cursor-pointer"
                      >
                        &larr; Sebelumnya
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            pageNum === currentPage
                              ? "bg-[#143265] text-white shadow-2xs"
                              : "bg-white hover:bg-slate-100 border border-slate-200 text-slate-700"
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}

                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage >= totalPages}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors cursor-pointer"
                      >
                        Selanjutnya &rarr;
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SUKU BUNGA (Hanya Widget & Panel Suku Bunga Theme 1) */}
        {activeTab === "suku-bunga" && (
          <div className="space-y-5">
            <CorporateTrustRatesWidget onRefreshNeeded={fetchPengumuman} />
          </div>
        )}

        {/* TAB 2: ARSIP (Keputusan Non-Aktif / Tergantikan) */}
        {activeTab === "arsip" && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                  <Archive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Arsip Keputusan Rapat (Non-Aktif / Riwayat)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Daftar keputusan rapat komite ALCO terdahulu yang masa berlakunya telah usai atau telah digantikan oleh risalah terbaru.
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                {totalCount} Arsip
              </span>
            </div>

            {/* Filter Bar: Kategori dari Hasil Rapat & Tahun untuk Arsip */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#143265] shrink-0" />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Filter Arsip:
                  </span>
                </div>

                {/* Filter Kategori dari Hasil Rapat */}
                <div className="flex items-center gap-1.5 min-w-[220px]">
                  <label htmlFor="filter-kategori-arsip" className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                    Kategori dari Hasil Rapat:
                  </label>
                  <select
                    id="filter-kategori-arsip"
                    value={selectedKategori}
                    onChange={(e) => setSelectedKategori(e.target.value)}
                    className="w-full text-xs font-semibold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#143265] transition-colors cursor-pointer"
                  >
                    <option value="">Semua Kategori</option>
                    {categoriesList.map((kat) => (
                      <option key={kat.id} value={kat.nama}>
                        {kat.nama}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filter Tahun */}
                <div className="flex items-center gap-1.5 min-w-[140px]">
                  <label htmlFor="filter-tahun-arsip" className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                    Tahun:
                  </label>
                  <select
                    id="filter-tahun-arsip"
                    value={selectedTahun}
                    onChange={(e) => setSelectedTahun(e.target.value)}
                    className="w-full text-xs font-semibold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#143265] transition-colors cursor-pointer"
                  >
                    <option value="">Semua Tahun</option>
                    {availableYears.map((yr) => (
                      <option key={yr} value={yr.toString()}>
                        Tahun {yr}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reset Filter Button */}
                {(selectedKategori || selectedTahun) && (
                  <button
                    onClick={() => {
                      setSelectedKategori("");
                      setSelectedTahun("");
                    }}
                    className="text-xs font-semibold text-red-600 hover:text-red-800 px-2.5 py-1 rounded-md hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reset Filter</span>
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse">
                <div className="h-6 w-3/4 bg-slate-200 rounded" />
                <div className="h-32 bg-slate-100 rounded-xl" />
              </div>
            ) : rapatList.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-2">
                <p className="text-xs text-slate-500">Tidak ada arsip keputusan rapat non-aktif.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {rapatList.map((rapat) => (
                  <CorporateMeetingDecisionCard
                    key={rapat.id}
                    rapat={rapat}
                    isMaker={isAdmin}
                    onEdit={handleEditRapat}
                    onToggleAktif={handleToggleAktif}
                    onOpenDrive={handleOpenDriveDoc}
                  />
                ))}

                {/* Pagination jika arsip lebih dari 20 */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 bg-white p-4 rounded-xl border">
                    <p className="text-xs text-slate-500 font-medium">
                      Menampilkan <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> - <strong>{Math.min(currentPage * itemsPerPage, totalCount)}</strong> dari <strong>{totalCount}</strong> arsip
                    </p>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors cursor-pointer"
                      >
                        &larr; Sebelumnya
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            pageNum === currentPage
                              ? "bg-[#143265] text-white shadow-2xs"
                              : "bg-white hover:bg-slate-100 border border-slate-200 text-slate-700"
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}

                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage >= totalPages}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors cursor-pointer"
                      >
                        Selanjutnya &rarr;
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MANAJEMEN DATA VIEWER (Admin / Maker) */}
        {activeTab === "viewers" && isAdmin && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <ViewerManagementPanel />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/90 bg-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400">
          Dashboard Keputusan ALCO Bank Kalsel &copy; {new Date().getFullYear()} &bull; PT BPD Kalimantan Selatan (Perseroda)
        </div>
      </footer>

      {/* Form Modal for Creating / Editing Decision */}
      <ModalFormRapat
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={() => {
          setIsFormModalOpen(false);
          fetchPengumuman();
        }}
        initialData={formInitialData}
      />

      {/* Modal Kelola Kategori dari Hasil Rapat (CRUD Kategori) */}
      <ModalKategoriHasilRapat
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        onKategoriChanged={() => {
          fetchKategoriList();
          fetchPengumuman();
        }}
      />

      {/* Google Drive View-Only Modal */}
      {driveViewerDoc && (
        <GoogleDriveViewerModal
          isOpen={!!driveViewerDoc}
          onClose={() => setDriveViewerDoc(null)}
          documentTitle={driveViewerDoc.title}
          previewUrl={driveViewerDoc.url}
          keterangan={driveViewerDoc.keterangan}
        />
      )}
    </div>
  );
}
