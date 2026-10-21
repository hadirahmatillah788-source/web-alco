"use client";

import React, { useState } from "react";
import { X, Calendar, MapPin, Tag, User, FileText, Lock, Eye, Building2, CheckCircle2, AlertTriangle } from "lucide-react";
import { DecisionContentRenderer } from "@/components/DecisionContentRenderer";
import { GoogleDriveViewerModal } from "@/components/GoogleDriveViewerModal";

interface ModalDetailRapatProps {
  isOpen: boolean;
  onClose: () => void;
  rapat: any;
}

export function ModalDetailRapat({ isOpen, onClose, rapat }: ModalDetailRapatProps) {
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

  if (!isOpen || !rapat) return null;

  const formattedDate = new Date(rapat.tanggalRapat).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const isAktif = rapat.isAktif !== false;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 md:p-6 overflow-y-auto">
        <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-start justify-between border-b border-slate-800">
            <div className="pr-4">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30" title="Kategori dari Hasil Rapat">
                  Kategori: {rapat.kategori}
                </span>
                {rapat.nomorRapat && (
                  <span className="font-mono text-xs text-slate-300 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700">
                    {rapat.nomorRapat}
                  </span>
                )}
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full tracking-wider ${
                    isAktif
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40"
                      : "bg-amber-500/20 text-amber-300 border border-amber-400/40"
                  }`}
                >
                  {isAktif ? "● Keputusan Aktif" : "○ Telah Diperbarui (Non-Aktif)"}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    rapat.status === "PUBLISHED"
                      ? "bg-slate-700/80 text-slate-300 border border-slate-600"
                      : "bg-amber-950/70 text-amber-300 border border-amber-700"
                  }`}
                >
                  {rapat.status}
                </span>
              </div>
              <h2 className="text-lg md:text-xl font-bold text-white leading-snug">{rapat.judul}</h2>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Meta Info Bar */}
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>{formattedDate}</span>
            </div>
            {rapat.lokasi && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-500" />
                <span>{rapat.lokasi}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 ml-auto">
              <User className="w-4 h-4 text-slate-500" />
              <span>
                Notulis: <strong>{rapat.author?.name || "Sekretariat"}</strong>
              </span>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Non-Aktif Notice */}
            {!isAktif && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                <p className="font-bold flex items-center gap-1.5 text-amber-800 text-sm mb-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  Keputusan Ini Sudah Tidak Aktif / Telah Diperbarui
                </p>
                <p className="leading-relaxed">
                  {rapat.keteranganStatus ||
                    "Ketetapan ini disimpan untuk kebutuhan arsip dan telah digantikan oleh ketetapan ALCO yang lebih baru."}
                </p>
              </div>
            )}

            {/* Ringkasan Box */}
            {rapat.ringkasan && (
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/70">
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-800 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" /> Ringkasan Eksekutif
                </p>
                <p className="text-xs md:text-sm text-slate-700 leading-relaxed font-medium">
                  {rapat.ringkasan}
                </p>
              </div>
            )}

            {/* Isi Keputusan (Paragraf & Tabel) */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Ketetapan & Hasil Keputusan Resmi
              </h3>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <DecisionContentRenderer content={rapat.isiKeputusan} />
              </div>
            </div>

            {/* Lampiran Dokumen (Google Drive View-Only) */}
            {rapat.lampiran && rapat.lampiran.length > 0 && (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" /> Lampiran Dokumen Resmi ({rapat.lampiran.length})
                  </h3>
                  <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-medium flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Mode Hanya Lihat (View-Only)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {rapat.lampiran.map((lamp: any) => (
                    <div
                      key={lamp.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 hover:border-blue-300 transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0 font-bold text-xs">
                          PDF
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                            {lamp.namaFile}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {lamp.keterangan || "Google Drive Secured Document"}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedDoc(lamp)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" /> Buka
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>Diterbitkan resmi oleh Komite ALCO & Manajemen Internal</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold transition-colors"
            >
              Tutup Risalah
            </button>
          </div>
        </div>
      </div>

      {/* Google Drive View-Only Modal */}
      {selectedDoc && (
        <GoogleDriveViewerModal
          isOpen={!!selectedDoc}
          onClose={() => setSelectedDoc(null)}
          documentTitle={selectedDoc.namaFile}
          previewUrl={selectedDoc.fileUrl}
          keterangan={selectedDoc.keterangan}
        />
      )}
    </>
  );
}
