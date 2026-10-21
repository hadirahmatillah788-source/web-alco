"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/Navbar";
import { ViewerManagementPanel } from "@/components/ViewerManagementPanel";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, Landmark, Lock } from "lucide-react";

export default function AdminViewersPage() {
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-[#1E3A8A]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation Breadcrumb / Back Link */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#1E3A8A] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Portal ALCO
          </Link>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Portal ALCO</span>
            <span>/</span>
            <span className="text-slate-700 font-semibold">Manajemen Pengguna</span>
          </div>
        </div>

        {/* Authorization Gate */}
        {!session ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Perlu Otorisasi Masuk</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Silakan masuk dengan akun Administrator (Maker) untuk mengakses panel manajemen data viewer.
            </p>
            <Link
              href="/login"
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E3A8A] hover:bg-blue-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              Buka Portal Login
            </Link>
          </div>
        ) : !isAdmin ? (
          <div className="bg-white rounded-3xl border border-rose-200 p-12 text-center max-w-md mx-auto shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Akses Ditolak (403 Forbidden)</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Akun Anda ({session.user.email}) memiliki hak akses <strong>Viewer (Karyawan)</strong> dan tidak diizinkan mengubah data pengguna.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Kembali ke Beranda
            </Link>
          </div>
        ) : (
          <ViewerManagementPanel />
        )}
      </main>
    </div>
  );
}
