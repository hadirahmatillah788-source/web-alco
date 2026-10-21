import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

// Helper prisma any accessor for dynamic model types
const db = prisma as any;

// GET /api/kategori-rapat - Ambil semua kategori dari hasil rapat
export async function GET(request: NextRequest) {
  try {
    const list = await db.kategoriHasilRapat.findMany({
      orderBy: [{ urutan: "asc" }, { nama: "asc" }],
    });

    // Hitung juga jumlah pengumuman yang menggunakan kategori ini
    const counts = await prisma.pengumuman.groupBy({
      by: ["kategori"],
      where: { isDeleted: false },
      _count: { _all: true },
    });

    const countMap: Record<string, number> = {};
    for (const c of counts) {
      countMap[c.kategori] = c._count._all;
    }

    const dataWithCount = list.map((item: any) => ({
      ...item,
      count: countMap[item.nama] || 0,
    }));

    return NextResponse.json({ data: dataWithCount });
  } catch (error) {
    console.error("GET /api/kategori-rapat error:", error);
    return NextResponse.json({ error: "Gagal mengambil daftar kategori hasil rapat" }, { status: 500 });
  }
}

// POST /api/kategori-rapat - Tambah kategori baru (Khusus Admin/Maker)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Akses ditolak: Hanya Admin/Maker yang dapat menambah kategori" }, { status: 403 });
    }

    const body = await request.json();
    const { nama, deskripsi } = body;

    if (!nama || !nama.trim()) {
      return NextResponse.json({ error: "Nama kategori wajib diisi" }, { status: 400 });
    }

    const trimmedNama = nama.trim();

    // Periksa apakah nama kategori sudah ada
    const existing = await db.kategoriHasilRapat.findUnique({
      where: { nama: trimmedNama },
    });

    if (existing) {
      return NextResponse.json({ error: `Kategori "${trimmedNama}" sudah ada` }, { status: 400 });
    }

    // Tentukan urutan terakhir + 1
    const lastItem = await db.kategoriHasilRapat.findFirst({
      orderBy: { urutan: "desc" },
    });
    const nextUrutan = (lastItem?.urutan ?? 0) + 1;

    const newKategori = await db.kategoriHasilRapat.create({
      data: {
        nama: trimmedNama,
        deskripsi: deskripsi?.trim() || null,
        urutan: nextUrutan,
      },
    });

    return NextResponse.json({ message: "Kategori dari hasil rapat berhasil ditambahkan", data: newKategori }, { status: 201 });
  } catch (error) {
    console.error("POST /api/kategori-rapat error:", error);
    return NextResponse.json({ error: "Gagal menambahkan kategori" }, { status: 500 });
  }
}
