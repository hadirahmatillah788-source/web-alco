"use client";

import React, { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  Edit2,
  ChevronDown,
  ChevronUp,
  FileText,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Lock,
  Tag,
} from "lucide-react";
import { DecisionContentRenderer } from "@/components/DecisionContentRenderer";

interface LampiranItem {
  id: string;
  namaFile: string;
  fileUrl: string;
  driveFileId?: string | null;
  keterangan?: string | null;
}

interface RapatItem {
  id: string;
  judul: string;
  nomorRapat: string;
  tanggalRapat: string | Date;
  kategori?: string;
  status: string;
  isAktif: boolean;
  keteranganStatus?: string | null;
  ringkasan?: string | null;
  isiKeputusan: string;
  lampiran?: LampiranItem[];
}

interface CorporateMeetingDecisionCardProps {
  rapat: RapatItem;
  defaultExpanded?: boolean;
  isMaker?: boolean;
  onEdit?: (rapat: RapatItem) => void;
  onToggleAktif?: (rapat: RapatItem) => void;
  onOpenDrive?: (lampiran: LampiranItem) => void;
}

export function CorporateMeetingDecisionCard({
  rapat,
  defaultExpanded = false,
  isMaker: isMakerProp,
  onEdit,
  onToggleAktif,
  onOpenDrive,
}: CorporateMeetingDecisionCardProps) {
  const { data: session } = useSession();
  const isMaker = isMakerProp !== undefined ? isMakerProp : session?.user?.role === "ADMIN";

  // State untuk expand/collapse: defaultnya hanya menampilkan sedikit review
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Format tanggal: misal "20 Des 2026"
  const formattedDate = useMemo(() => {
    try {
      const d = new Date(rapat.tanggalRapat);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "20 Des 2026";
    }
  }, [rapat.tanggalRapat]);

  // Cuplikan review singkat (review snippet)
  const reviewText = useMemo(() => {
    if (rapat.ringkasan && rapat.ringkasan.trim().length > 0) {
      return rapat.ringkasan.trim();
    }
    // Jika tidak ada ringkasan terpisah, ambil ~180 karakter pertama dari isiKeputusan
    const cleanText = (rapat.isiKeputusan || "")
      .replace(/[#*|`-]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    return cleanText.length > 200 ? cleanText.slice(0, 197) + "..." : cleanText;
  }, [rapat.ringkasan, rapat.isiKeputusan]);

  const primaryDoc = rapat.lampiran && rapat.lampiran.length > 0 ? rapat.lampiran[0] : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-sm transition-all overflow-hidden">
      {/* Card Header */}
      <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {rapat.isAktif ? (
              <span className="inline-flex items-center gap-1 bg-[#106F38] text-white text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full tracking-wider uppercase shadow-2xs">
                AKTIF
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-amber-600 text-white text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full tracking-wider uppercase shadow-2xs">
                NON-AKTIF / ARSIP
              </span>
            )}

            {rapat.kategori && (
              <span
                className="inline-flex items-center gap-1 bg-blue-50 text-[#143265] text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-md border border-blue-200 shadow-2xs"
                title="Kategori dari Hasil Rapat"
              >
                <Tag className="w-3 h-3 text-[#143265]" />
                <span>{rapat.kategori}</span>
              </span>
            )}

            <span className="text-xs text-slate-500 font-medium">
              Published: {formattedDate}
            </span>

            {rapat.nomorRapat && (
              <span className="text-xs text-slate-400 font-mono">
                &bull; No: {rapat.nomorRapat}
              </span>
            )}

            {rapat.keteranganStatus && (
              <span className="text-xs text-amber-700 italic bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                ({rapat.keteranganStatus})
              </span>
            )}
          </div>

          <h3
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-base sm:text-lg font-bold text-slate-900 leading-snug cursor-pointer hover:text-blue-900 transition-colors"
          >
            {rapat.judul}
          </h3>
        </div>

        {/* Action Buttons (Edit & Status Toggle) */}
        {isMaker && (
          <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
            <button
              onClick={() => onEdit && onEdit(rapat)}
              className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit</span>
            </button>

            <button
              onClick={() => onToggleAktif && onToggleAktif(rapat)}
              className="bg-[#143265] hover:bg-[#0f244a] text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              Status Toggle
            </button>
          </div>
        )}
      </div>

      {/* Review Ringkas (Preview Mode saat tertutup) */}
      {!isExpanded && (
        <div
          onClick={() => setIsExpanded(true)}
          className="p-5 sm:p-6 pt-4 bg-slate-50/40 hover:bg-slate-50/80 transition-colors cursor-pointer select-none group"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Ringkasan Keputusan:
              </span>
              <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed text-justify line-clamp-2">
                {reviewText || "Klik untuk membaca keputusan rapat ini selengkapnya."}
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-[#143265] group-hover:text-blue-700 bg-white group-hover:bg-blue-50 border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs transition-all whitespace-nowrap">
              <span>Buka Keputusan</span>
              <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:translate-y-0.5" />
            </div>
          </div>
        </div>
      )}

      {/* Isi Keseluruhan Keputusan (Expanded Mode: Menurun ke bawah paragraf - tabel - paragraf - dsb.) */}
      {isExpanded && (
        <div className="p-5 sm:p-6 pt-4 space-y-6 animate-in fade-in duration-200">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100 flex items-center gap-2">
              <span className="w-2 h-4 bg-[#143265] rounded-full inline-block" />
              Isi Keputusan Rapat
            </h4>

            {/* Konten Mengalir Menurun ke Bawah: Paragraf - Tabel - Paragraf - Tabel - Paragraf */}
            <div className="prose max-w-none text-xs sm:text-[13px] text-slate-700 leading-relaxed">
              <DecisionContentRenderer content={rapat.isiKeputusan} />
            </div>
          </div>

          {/* Bagian Dokumen Asli */}
          {primaryDoc && (
            <div className="pt-2 border-t border-slate-100">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 mb-2">
                Dokumen Asli
              </h4>

              <button
                type="button"
                onClick={() => onOpenDrive && onOpenDrive(primaryDoc)}
                className="w-full sm:w-auto inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-400 text-xs text-slate-800 hover:text-[#143265] font-semibold shadow-2xs transition-all group text-left cursor-pointer"
              >
                <div className="w-5 h-5 rounded flex items-center justify-center shrink-0">
                  <span className="text-base">📁</span>
                </div>
                <span className="group-hover:underline">
                  {primaryDoc.keterangan || "Buka Dokumen Asli (Google Drive Share - Hanya Lihat)"}
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full ml-1">
                  View-Only
                </span>
              </button>
            </div>
          )}

          {/* Tombol Tutup Kembali ke Ringkasan */}
          <div className="pt-3 border-t border-slate-100 flex justify-center">
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Tutup Keputusan Rapat</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
