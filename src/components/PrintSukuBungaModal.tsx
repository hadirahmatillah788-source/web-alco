"use client";

import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Printer, X } from "lucide-react";

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
  nama?: string;
  jenis?: string;
  kode: "KONVENSIONAL" | "SYARIAH";
  deskripsi?: string | null;
  kategori: KategoriBungaItem[];
}

interface PrintSukuBungaModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: JenisBungaGroup[];
}

export function PrintSukuBungaModal({ isOpen, onClose, groups }: PrintSukuBungaModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDateFormatted = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const modalContent = (
    <div
      id="print-portal-root"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-2 sm:p-4 md:p-6 overflow-y-auto"
    >
      {/* Global Print Style for A4 Multi-Page without Blank Space */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm 12mm 10mm;
          }

          html,
          body {
            background: white !important;
            color: #0f172a !important;
            font-size: 9.5pt !important;
            line-height: 1.25 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          }

          /* Hilangkan SELURUH elemen aplikasi di luar print portal */
          body > *:not(#print-portal-root) {
            display: none !important;
          }

          /* Tampilkan portal print tepat di paling atas halaman (0px space kosong) */
          #print-portal-root {
            display: block !important;
            position: static !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          #print-suku-bunga-modal-container {
            position: static !important;
            display: block !important;
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
          }

          #print-suku-bunga-scroll-body {
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }

          #print-suku-bunga-area {
            position: static !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
            overflow: visible !important;
          }

          .no-print {
            display: none !important;
          }

          /* Aliran tabel A4 multi-halaman bersambung otomatis */
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            page-break-inside: auto !important;
            break-inside: auto !important;
            margin-bottom: 0 !important;
          }

          thead {
            display: table-header-group !important; /* Ulangi judul kolom di halaman selanjutnya */
          }

          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          th, td {
            padding: 4px 6px !important;
            border: 1px solid #cbd5e1 !important;
          }

          .kategori-block {
            page-break-inside: auto !important;
            break-inside: auto !important;
            margin-bottom: 10px !important;
          }

          .kategori-header {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
        }
      `}</style>

      <div
        id="print-suku-bunga-modal-container"
        className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Modal Top Bar (Screen View Only) */}
        <div className="no-print px-5 sm:px-6 py-3.5 bg-gradient-to-r from-[#143265] to-[#1E4582] text-white flex items-center justify-between border-b border-blue-900 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Printer className="w-4 h-4 text-blue-200" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Pratinjau Cetak Suku Bunga - PT BPD Kalimantan Selatan (Perseroda)
              </h3>
              <p className="text-[11px] text-blue-100">
                Format kertas A4 Portrait resmi &bull; Bersambung otomatis ke halaman berikutnya jika lebih dari 1 halaman
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Sekarang (Print / PDF)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div id="print-suku-bunga-scroll-body" className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-slate-100/60">
          <div
            id="print-suku-bunga-area"
            ref={printAreaRef}
            className="bg-white p-5 sm:p-7 rounded-xl shadow-xs border border-slate-200 max-w-4xl mx-auto space-y-4"
          >
            {/* Header Resmi: PT BPD Kalimantan Selatan (Perseroda) */}
            <div className="border-b-2 border-slate-900 pb-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase leading-snug">
                    PT BPD KALIMANTAN SELATAN (PERSERODA)
                  </h1>
                  <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                    KOMITE MANAJEMEN ASET & LIABILITAS (ALCO COMMITTEE)
                  </p>
                  <h2 className="text-xs sm:text-sm font-black text-[#143265] uppercase tracking-wide mt-0.5">
                    DAFTAR RESMI SUKU BUNGA & NISBAH ACUAN PERBANKAN
                  </h2>
                </div>

                <div className="text-left sm:text-right text-[11px] text-slate-600 space-y-0.5 border-t sm:border-t-0 pt-1.5 sm:pt-0 border-slate-200">
                  <p>Tanggal Berlaku: <span className="font-bold text-slate-900">{currentDateFormatted}</span></p>
                  <p className="font-semibold text-emerald-800">STATUS: AKTIF & RESMI BERLAKU</p>
                </div>
              </div>
            </div>

            {/* Loop Data Suku Bunga (Konvensional & Syariah) */}
            {groups.map((group) => {
              const activeCategories = (group.kategori || []).filter(
                (kat) => kat.produk && kat.produk.filter((p) => p.isActive).length > 0
              );

              if (activeCategories.length === 0) return null;

              return (
                <div key={group.id} className="space-y-3">
                  {/* Banner Jenis Bunga */}
                  <div className="bg-[#143265] text-white px-3 py-1.5 rounded flex items-center justify-between kategori-header">
                    <span className="font-bold text-xs tracking-wide uppercase">
                      SUKU BUNGA {group.nama || group.kode}
                    </span>
                    <span className="text-[10px] text-blue-200 font-medium">
                      {activeCategories.length} Kategori
                    </span>
                  </div>

                  {/* Loop Kategori dalam Jenis ini */}
                  {activeCategories.map((kat, katIdx) => {
                    const activeProducts = kat.produk.filter((p) => p.isActive);

                    return (
                      <div
                        key={kat.id}
                        className="kategori-block space-y-1 border border-slate-300 rounded overflow-hidden"
                      >
                        {/* Header Kategori */}
                        <div className="bg-slate-100 px-3 py-1 border-b border-slate-300 flex items-center justify-between kategori-header">
                          <div className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-[#143265] text-white text-[9px] font-bold flex items-center justify-center">
                              {katIdx + 1}
                            </span>
                            <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-wide">
                              Kategori: {kat.nama}
                            </h3>
                          </div>
                          {kat.deskripsi && (
                            <span className="text-[10px] text-slate-500 italic max-w-sm text-right truncate hidden sm:inline">
                              {kat.deskripsi}
                            </span>
                          )}
                        </div>

                        {/* Tabel Data Suku Bunga Murni (Rapi & Padat) */}
                        <table className="w-full text-left text-[11px] border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-slate-800 font-bold border-b border-slate-300">
                              <th className="py-1 px-2 w-8 text-center border-r border-slate-300">No</th>
                              <th className="py-1 px-2.5 border-r border-slate-300">Nama Produk</th>
                              <th className="py-1 px-2.5 text-right border-r border-slate-300 w-36 whitespace-nowrap">
                                Suku Bunga / Nisbah
                              </th>
                              <th className="py-1 px-2.5 border-r border-slate-300 w-44">
                                Jangka Waktu / Tenor
                              </th>
                              <th className="py-1 px-2.5">Keterangan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {activeProducts.map((prod, prodIdx) => (
                              <tr
                                key={prod.id}
                                className={prodIdx % 2 === 0 ? "bg-white" : "bg-slate-50/70"}
                              >
                                <td className="py-1.5 px-2 text-center text-slate-500 font-mono text-[10px] border-r border-slate-200">
                                  {prodIdx + 1}
                                </td>
                                <td className="py-1.5 px-2.5 font-bold text-slate-900 border-r border-slate-200">
                                  {prod.nama}
                                </td>
                                <td className="py-1.5 px-2.5 text-right font-black text-[#143265] text-xs whitespace-nowrap border-r border-slate-200">
                                  {prod.rate}
                                </td>
                                <td className="py-1.5 px-2.5 text-slate-700 border-r border-slate-200">
                                  {prod.tenorTiering || "-"}
                                </td>
                                <td className="py-1.5 px-2.5 text-slate-600 text-[10px] leading-relaxed">
                                  {prod.keterangan || "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Bottom Actions (Screen View Only) */}
        <div className="no-print px-5 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            * Ukuran kertas diatur otomatis ke <strong>A4 Portrait</strong> tanpa margin kosong berlebih di bagian atas.
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#143265] hover:bg-[#0f244a] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak (Print All)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
