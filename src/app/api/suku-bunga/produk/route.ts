import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

// POST /api/suku-bunga/produk - Tambah Produk Suku Bunga Baru (Maker / Admin)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Akses ditolak: Hanya Maker yang dapat menambah produk suku bunga" }, { status: 403 });
    }

    const body = await request.json();
    const { kategoriId, nama, rate, tenorTiering, saldoMinimal, keterangan, isActive } = body;

    if (!kategoriId || !nama?.trim() || !rate?.trim()) {
      return NextResponse.json({ error: "Kategori, nama produk, dan persentase suku bunga/rate wajib diisi" }, { status: 400 });
    }

    // Cek keberadaan kategori
    const kategori = await prisma.kategoriBunga.findUnique({
      where: { id: kategoriId },
    });
    if (!kategori) {
      return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
    }

    const lastProduct = await prisma.produkBunga.findFirst({
      where: { kategoriId },
      orderBy: { urutan: "desc" },
    });
    const nextUrutan = (lastProduct?.urutan ?? 0) + 1;

    const produk = await prisma.produkBunga.create({
      data: {
        kategoriId,
        nama: nama.trim(),
        rate: rate.trim(),
        tenorTiering: tenorTiering?.trim() || null,
        saldoMinimal: saldoMinimal?.trim() || null,
        keterangan: keterangan?.trim() || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        urutan: nextUrutan,
      },
    });

    return NextResponse.json({ success: true, data: produk }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/suku-bunga/produk error:", error);
    return NextResponse.json({ error: "Gagal membuat produk suku bunga: " + error.message }, { status: 500 });
  }
}
