import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Ambil keputusan rapat terbaru
    const latestRapat = await prisma.pengumuman.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        judul: true,
        nomorRapat: true,
        isAktif: true,
        createdAt: true,
        kategori: true,
      },
    });

    // 2. Ambil kategori suku bunga terbaru
    const latestCategories = await prisma.kategoriBunga.findMany({
      take: 2,
      include: {
        produk: {
          take: 2,
          select: { nama: true, rate: true },
        },
      },
    });

    const notifications: Array<{
      id: string;
      title: string;
      message: string;
      category: "rapat" | "suku-bunga" | "arsip" | "sistem";
      timestamp: string;
      linkTab: "hasil-rapat" | "suku-bunga" | "arsip";
      read?: boolean;
    }> = [];

    // Format notifikasi dari keputusan rapat
    latestRapat.forEach((rapat, idx) => {
      const isRecent = idx === 0;
      if (rapat.isAktif) {
        notifications.push({
          id: `rapat-${rapat.id}`,
          title: "Keputusan Rapat ALCO Baru",
          message: `${rapat.judul} telah dipublikasikan resmi oleh Maker.`,
          category: "rapat",
          timestamp: isRecent ? "Baru saja" : "1 jam yang lalu",
          linkTab: "hasil-rapat",
        });
      } else {
        notifications.push({
          id: `arsip-${rapat.id}`,
          title: "Risalah ALCO Masuk Arsip",
          message: `${rapat.judul} telah dinon-aktifkan dan dipindahkan ke arsip.`,
          category: "arsip",
          timestamp: "Kemarin",
          linkTab: "arsip",
        });
      }
    });

    // Format notifikasi suku bunga
    if (latestCategories.length > 0) {
      const firstKat = latestCategories[0];
      const prodText = firstKat.produk.map((p) => `${p.nama} (${p.rate})`).join(", ");
      notifications.push({
        id: `bunga-${firstKat.id}`,
        title: "Penetapan Suku Bunga Acuan",
        message: `Suku bunga ${firstKat.nama} telah diperbarui: ${prodText || "Ditinjau oleh Komite ALCO"}.`,
        category: "suku-bunga",
        timestamp: "3 jam yang lalu",
        linkTab: "suku-bunga",
      });
    }

    // Notifikasi sistem keamanan
    notifications.push({
      id: "sys-security-01",
      title: "Keamanan Portal & Sesi",
      message: "Proteksi CAPTCHA anti-bot dan pemantauan auto-logout 15 menit aktif.",
      category: "sistem",
      timestamp: "Hari ini",
      linkTab: "hasil-rapat",
    });

    return NextResponse.json({
      success: true,
      data: notifications,
    });
  } catch (error: any) {
    console.error("GET /api/notifikasi error:", error);
    return NextResponse.json({ error: "Gagal memuat notifikasi" }, { status: 500 });
  }
}
