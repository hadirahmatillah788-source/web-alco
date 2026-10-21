import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Role, TipeSukuBunga } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET /api/suku-bunga
// Mengembalikan struktur nested JSON (Jenis -> Kategori -> Produk) dalam satu kali kueri Prisma (include)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const isMaker = session?.user?.role === Role.ADMIN;

    const { searchParams } = new URL(request.url);
    const jenisParam = searchParams.get("jenis"); // e.g. "Konvensional", "Syariah", "KONVENSIONAL", "SYARIAH"
    const includeInactiveParam = searchParams.get("includeInactive") === "true";

    // Maker can see inactive products if requested or logged in
    const shouldShowInactive = isMaker || includeInactiveParam;

    const whereJenis: any = {};
    if (jenisParam) {
      const upper = jenisParam.toUpperCase();
      if (upper === "KONVENSIONAL" || upper === "SYARIAH") {
        whereJenis.kode = upper as TipeSukuBunga;
      }
    }

    const jenisData = await prisma.jenisBunga.findMany({
      where: whereJenis,
      orderBy: { urutan: "asc" },
      include: {
        kategori: {
          orderBy: { urutan: "asc" },
          include: {
            produk: {
              where: shouldShowInactive ? undefined : { isActive: true },
              orderBy: [{ urutan: "asc" }, { createdAt: "asc" }],
            },
          },
        },
      },
    });

    // Format output sesuai spesifikasi
    // Jika requested satu jenis spesifik, kembalikan object dengan format { jenis, kategori: [...] }
    // atau kembalikan array jenis dengan format nested yang sama
    const formatted = jenisData.map((j) => ({
      id: j.id,
      jenis: j.nama,
      kode: j.kode,
      deskripsi: j.deskripsi,
      kategori: j.kategori.map((k) => ({
        id: k.id,
        nama: k.nama,
        slug: k.slug,
        deskripsi: k.deskripsi,
        urutan: k.urutan,
        produk: k.produk.map((p) => ({
          id: p.id,
          nama: p.nama,
          rate: p.rate,
          tenorTiering: p.tenorTiering,
          saldoMinimal: p.saldoMinimal,
          keterangan: p.keterangan,
          isActive: p.isActive,
          urutan: p.urutan,
        })),
      })),
    }));

    // Jika filter jenis diberikan dan hanya ada 1 jenis yang cocok, kita sertakan baik root jenis maupun list
    const singleResult = jenisParam && formatted.length === 1 ? formatted[0] : null;

    return NextResponse.json({
      success: true,
      data: formatted,
      single: singleResult,
    });
  } catch (error: any) {
    console.error("GET /api/suku-bunga error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data suku bunga: " + error.message },
      { status: 500 }
    );
  }
}
