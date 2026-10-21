import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Role, TipeSukuBunga } from "@prisma/client";

export const dynamic = "force-dynamic";

// Helper slug generator
function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

// POST /api/suku-bunga/kategori - Tambah Kategori Baru (Maker / Admin)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Akses ditolak: Hanya Maker/Admin yang dapat menambah kategori" }, { status: 403 });
    }

    const body = await request.json();
    const { jenisId, kodeJenis, nama, deskripsi } = body;

    if (!nama || (!jenisId && !kodeJenis)) {
      return NextResponse.json({ error: "Nama kategori dan jenis suku bunga wajib diisi" }, { status: 400 });
    }

    // Cari ID jenis jika hanya kode yang dikirim
    let targetJenisId = jenisId;
    if (!targetJenisId && kodeJenis) {
      const j = await prisma.jenisBunga.findUnique({
        where: { kode: kodeJenis.toUpperCase() as TipeSukuBunga },
      });
      if (!j) {
        return NextResponse.json({ error: "Jenis suku bunga tidak ditemukan" }, { status: 404 });
      }
      targetJenisId = j.id;
    }

    let slug = slugify(nama);
    const existingSlug = await prisma.kategoriBunga.findUnique({
      where: {
        jenisId_slug: {
          jenisId: targetJenisId,
          slug,
        },
      },
    });

    if (existingSlug) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const lastItem = await prisma.kategoriBunga.findFirst({
      where: { jenisId: targetJenisId },
      orderBy: { urutan: "desc" },
    });
    const nextUrutan = (lastItem?.urutan ?? 0) + 1;

    const kategori = await prisma.kategoriBunga.create({
      data: {
        jenisId: targetJenisId,
        nama: nama.trim(),
        slug,
        deskripsi: deskripsi?.trim() || null,
        urutan: nextUrutan,
      },
      include: {
        produk: true,
      },
    });

    return NextResponse.json({ success: true, data: kategori }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/suku-bunga/kategori error:", error);
    return NextResponse.json({ error: "Gagal membuat kategori: " + error.message }, { status: 500 });
  }
}
