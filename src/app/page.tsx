"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function PortalTreasuryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#cbe5fb] via-[#edf4fc] to-[#fdeed9] flex flex-col justify-between items-center py-10 sm:py-14 px-4 sm:px-6 lg:px-8 selection:bg-[#143265] selection:text-white relative overflow-hidden">
      {/* Decorative Subtle Ambient Blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-200/25 rounded-full blur-3xl pointer-events-none translate-x-1/3 translate-y-1/3" />

      {/* Top Header Section */}
      <div className="w-full max-w-5xl mx-auto text-center z-10 space-y-3 pt-2 sm:pt-4">
        {/* Logo Bank Kalsel */}
        <div className="inline-block bg-white/90 backdrop-blur-xs px-4 py-2 rounded-2xl shadow-xs border border-white/60 mb-1 transition-transform hover:scale-105">
          <img
            src="/bank-kalsel-logo.png"
            alt="Logo Bank Kalsel"
            className="h-9 sm:h-11 w-auto object-contain mx-auto"
          />
        </div>

        {/* Main Title (Sesuai Gambar) */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#143265] tracking-tight uppercase">
          PORTAL TREASURY BANK KALSEL
        </h1>

        {/* Subtitle (Sesuai Gambar) */}
        <p className="text-sm sm:text-base text-slate-600 font-normal max-w-lg mx-auto">
          Silakan pilih dashboard yang ingin Anda akses hari ini.
        </p>
      </div>

      {/* 3 Floating Cards (Sesuai Desain Foto) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl w-full mx-auto my-8 sm:my-10 z-10">
        {/* CARD 1: Dashboard ALCO */}
        <div className="bg-white rounded-3xl p-7 sm:p-8 pt-9 pb-8 shadow-xl shadow-blue-900/5 border border-slate-100 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl group">
          {/* Blue Squircle Icon */}
          <div className="w-16 h-16 rounded-2xl bg-[#1462D6] text-white flex items-center justify-center shadow-lg shadow-blue-500/30 mb-6 group-hover:scale-110 transition-transform">
            <svg
              className="w-8 h-8 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 20V10" />
              <path d="M12 20V4" />
              <path d="M6 20v-6" />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 tracking-tight">
            Dashboard ALCO
          </h2>

          {/* Description */}
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-8 flex-1 min-h-[56px] max-w-[240px]">
            Sistem manajemen data ALCO, laporan, persetujuan, dan pencarian dokumen.
          </p>

          {/* Action Button */}
          <Link
            href="/alco"
            className="w-full max-w-[200px] py-2.5 px-5 rounded-full text-xs sm:text-sm font-bold bg-[#EBF3FE] hover:bg-[#d8e8fc] text-[#1462D6] transition-all inline-flex items-center justify-center gap-2 group-hover:shadow-sm"
          >
            <span>Akses Dashboard</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* CARD 2: Laporan TREASURY BANK KALSEL */}
        <div className="bg-white rounded-3xl p-7 sm:p-8 pt-9 pb-8 shadow-xl shadow-emerald-900/5 border border-slate-100 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl group">
          {/* Green Squircle Icon */}
          <div className="w-16 h-16 rounded-2xl bg-[#00A651] text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-6 group-hover:scale-110 transition-transform">
            <svg
              className="w-8 h-8 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M15 9.5c0-1.38-1.34-2.5-3-2.5s-3 1.12-3 2.5 1.34 2.5 3 2.5 3 1.12 3 2.5-1.34 2.5-3 2.5-3-1.12-3-2.5" />
              <path d="M12 5.5v13" />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 leading-tight tracking-tight uppercase">
            Laporan TREASURY<br />BANK KALSEL
          </h2>

          {/* Description */}
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-8 flex-1 min-h-[56px] max-w-[240px]">
            Dashboard utama untuk memantau aktivitas dan laporan Treasury Bank Kalsel.
          </p>

          {/* Action Button */}
          <a
            href="https://portofolio-treasury.ai.studio"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full max-w-[200px] py-2.5 px-5 rounded-full text-xs sm:text-sm font-bold bg-[#E8F8F0] hover:bg-[#d0f3df] text-[#00A651] transition-all inline-flex items-center justify-center gap-2 group-hover:shadow-sm"
          >
            <span>Akses Dashboard</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>

        {/* CARD 3: Laporan DANA IDLE TREASURY BANK KALSEL */}
        <div className="bg-white rounded-3xl p-7 sm:p-8 pt-9 pb-8 shadow-xl shadow-purple-900/5 border border-slate-100 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl group">
          {/* Purple Squircle Icon */}
          <div className="w-16 h-16 rounded-2xl bg-[#7C3AED] text-white flex items-center justify-center shadow-lg shadow-purple-500/30 mb-6 group-hover:scale-110 transition-transform">
            <svg
              className="w-8 h-8 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
              <path d="M22 12A10 10 0 0 0 12 2v10z" />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 leading-tight tracking-tight uppercase">
            Laporan DANA IDLE<br />TREASURY BANK KALSEL
          </h2>

          {/* Description */}
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-8 flex-1 min-h-[56px] max-w-[240px]">
            Pemantauan spesifik untuk dana idle (menganggur) pada divisi Treasury.
          </p>

          {/* Action Button */}
          <a
            href="https://likuiditas-harian.ai.studio"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full max-w-[200px] py-2.5 px-5 rounded-full text-xs sm:text-sm font-bold bg-[#F3ECFD] hover:bg-[#e4d4fb] text-[#7C3AED] transition-all inline-flex items-center justify-center gap-2 group-hover:shadow-sm"
          >
            <span>Akses Dashboard</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="w-full text-center text-xs text-slate-400 z-10 pt-4">
        <p className="font-medium">
          PT BPD Kalimantan Selatan (Perseroda) &bull; Divisi Treasury &bull; &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
