"use client";

import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Search, Users, LogOut, ChevronDown, User, LayoutGrid } from "lucide-react";
import { NotificationDropdown } from "@/components/NotificationDropdown";

interface NavbarProps {
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  onNavigateTab?: (tab: "hasil-rapat" | "suku-bunga" | "arsip" | "viewers") => void;
}

export function Navbar({ searchQuery = "", setSearchQuery, onNavigateTab }: NavbarProps) {
  const { data: session, status } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN";
  const userName = session?.user?.name || "Tamu";
  const shortName = userName.split(" ")[0];
  const roleLabel = isAdmin ? "Maker" : "Viewer";

  return (
    <header className="sticky top-0 z-50 bg-[#143265] text-white shadow-md border-b border-blue-950/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-4">
          {/* Logo & Judul Dashboard Utama */}
          <a href="/" className="flex items-center gap-3 shrink-0 group select-none">
            {/* Logo Bank Kalsel */}
            <div className="bg-white px-2.5 py-1 rounded-xl shadow-xs flex items-center justify-center border border-white/20 transition-transform group-hover:scale-105 shrink-0">
              <img
                src="/bank-kalsel-logo.png"
                alt="Bank Kalsel Logo"
                className="h-7 sm:h-8 w-auto object-contain"
              />
            </div>

            {/* Judul: Dashboard Keputusan ALCO Bank Kalsel */}
            <div className="flex flex-col">
              <h1 className="text-sm sm:text-base md:text-lg font-black tracking-tight text-white leading-tight">
                Dashboard Keputusan ALCO Bank Kalsel
              </h1>
              <span className="text-[10px] sm:text-[11px] font-medium text-blue-200/90 tracking-wide">
                PT BPD Kalimantan Selatan (Perseroda)
              </span>
            </div>
          </a>

          {/* Right Section: Portal Link, Search Bar, Bell Icon, User Pill */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Tombol Kembali ke Portal Treasury */}
            <a
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white bg-blue-900/50 hover:bg-blue-800/80 border border-blue-400/40 transition-all shadow-xs cursor-pointer"
              title="Kembali ke Portal Treasury Bank Kalsel"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-blue-200" />
              <span className="hidden sm:inline">Portal Treasury</span>
            </a>
            {/* Search Pill Input */}
            <div className="relative hidden md:block w-48 lg:w-64">
              <Search className="w-3.5 h-3.5 text-blue-200/70 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari keputusan / risalah..."
                value={searchQuery}
                onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-full bg-blue-900/40 border border-blue-400/30 text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:bg-blue-900/60 transition-all"
              />
            </div>

            {/* Interactive Notification Bell Dropdown */}
            <NotificationDropdown onNavigateTab={onNavigateTab} />

            {/* User Pill Badge */}
            {status === "loading" ? (
              <div className="h-8 w-28 bg-blue-900/50 animate-pulse rounded-full" />
            ) : session?.user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-blue-900/50 hover:bg-blue-900/80 border border-blue-400/40 text-white transition-all shadow-xs cursor-pointer"
                >
                  {/* Golden Amber Circle Avatar */}
                  <div className="w-6 h-6 rounded-full bg-[#E5A93C] text-slate-900 font-extrabold text-xs flex items-center justify-center shadow-xs">
                    {shortName.charAt(0)}
                  </div>
                  <span className="text-xs font-semibold text-slate-100">
                    {shortName} ({roleLabel})
                  </span>
                  <ChevronDown className="w-3 h-3 text-blue-200" />
                </button>

                {/* Dropdown Menu (Hanya Profile Info, Menu Manajemen Viewer bagi Admin, dan Logout) */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-[11px] text-slate-400">Masuk sebagai</p>
                      <p className="text-xs font-bold text-slate-900 truncate">{session.user.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono truncate">{session.user.email}</p>
                      <span
                        className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isAdmin ? "bg-purple-100 text-purple-800" : "bg-sky-100 text-sky-800"
                        }`}
                      >
                        {isAdmin ? "Maker (Admin ALCO)" : "Viewer (Karyawan)"}
                      </span>
                    </div>

                    {/* Khusus Admin: Menu Manajemen Viewer */}
                    {isAdmin && (
                      <div className="px-2 py-1.5 border-b border-slate-100">
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            if (onNavigateTab) {
                              onNavigateTab("viewers");
                            } else {
                              window.location.href = "/admin/viewers";
                            }
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[#143265] hover:bg-blue-50 rounded-xl transition-colors font-bold cursor-pointer text-left"
                        >
                          <Users className="w-4 h-4 text-blue-700" />
                          <span>Menu Manajemen Viewer</span>
                        </button>
                      </div>
                    )}

                    {/* Tombol Logout Sesi */}
                    <div className="px-2 pt-1">
                      <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-semibold cursor-pointer text-left"
                      >
                        <LogOut className="w-4 h-4 text-rose-600" />
                        <span>Keluar Sesi (Logout)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
