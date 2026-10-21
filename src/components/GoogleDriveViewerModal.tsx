"use client";

import React, { useEffect } from "react";
import { Eye, ShieldAlert, X, ExternalLink, FileText, Lock } from "lucide-react";

interface GoogleDriveViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  previewUrl: string;
  keterangan?: string | null;
}

export function GoogleDriveViewerModal({
  isOpen,
  onClose,
  documentTitle,
  previewUrl,
  keterangan,
}: GoogleDriveViewerModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-3 md:p-6 animate-in fade-in duration-200"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="bg-white w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-blue-600/30 text-blue-400 border border-blue-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h3 className="font-semibold text-sm md:text-base text-white truncate">{documentTitle}</h3>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-300">
                <span className="inline-flex items-center gap-1 text-emerald-400 font-medium bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-800">
                  <Lock className="w-3 h-3" /> Mode Hanya Lihat (View-Only)
                </span>
                {keterangan && <span className="truncate hidden sm:inline text-slate-400">• {keterangan}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Tutup penampil"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Security Alert Banner */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Perlindungan Dokumen:</strong> Opsi cetak, unduh, dan modifikasi dinonaktifkan sesuai otorisasi rapat ALCO.
            </span>
          </div>
          <span className="text-amber-700 font-mono hidden md:inline">Google Drive Secure Embed</span>
        </div>

        {/* Document Iframe Viewer */}
        <div className="flex-1 bg-slate-100 relative">
          {previewUrl ? (
            <iframe
              src={previewUrl}
              className="w-full h-full border-0 select-none"
              allow="autoplay"
              title={documentTitle}
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
              <FileText className="w-12 h-12 text-slate-400" />
              <p className="text-sm">Tautan dokumen tidak valid atau belum disetel.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Hak Akses: Karyawan & Manajemen Internal</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
