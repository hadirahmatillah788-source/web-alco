import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

// Helper prisma any accessor for dynamic model types
const db = prisma as any;

// PUT /api/kategori-rapat/[id] - Edit nama / deskripsi kategori
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Akses ditolak: Hanya Admin/Maker yang dapat mengedit kategori" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { nama, deskripsi } = body;

    if (!nama || !nama.trim()) {
      return NextResponse.json({ error: "Nama kategori wajib diisi" }, { status: 400 });
    }

    const trimmedNama = nama.trim();

    // Pastikan kategori ada
    const current = await db.kategoriHasilRapat.findUnique({
      where: { id },
    });

    if (!current) {
      return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
    }

    // Jika nama berubah, cek apakah nama baru sudah dipakai
    if (trimmedNama !== current.nama) {
      const duplicate = await db.kategoriHasilRapat.findUnique({
        where: { nama: trimmedNama },
      });
      if (duplicate) {
        return NextResponse.json({ error: `Kategori "${trimmedNama}" sudah ada` }, { status: 400 });
      }
    }

    // Update kategori
    const updated = await prisma.$transaction(async (tx: any) => {
      // Jika nama berubah, sinkronkan juga data pengumuman yang memakai nama lama
      if (trimmedNama !== current.nama) {
        await tx.pengumuman.updateMany({
          where: { kategori: current.nama },
          data: { kategori: trimmedNama },
        });
      }

      return tx.kategoriHasilRapat.update({
        where: { id },
        data: {
          nama: trimmedNama,
          deskripsi: deskripsi !== undefined ? (deskripsi?.trim() || null) : current.deskripsi,
        },
      });
    });

    return NextResponse.json({ message: "Kategori berhasil diperbarui", data: updated });
  } catch (error) {
    console.error("PUT /api/kategori-rapat/[id] error:", error);
    return NextResponse.json({ error: "Gagal memperbarui kategori" }, { status: 500 });
  }
}

// DELETE /api/kategori-rapat/[id] - Hapus kategori
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Akses ditolak: Hanya Admin/Maker yang dapat menghapus kategori" }, { status: 403 });
    }

    const { id } = await params;

    const current = await db.kategoriHasilRapat.findUnique({
      where: { id },
    });

    if (!current) {
      return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
    }

    // Cek apakah ada pengumuman yang menggunakan kategori ini
    const countUsed = await prisma.pengumuman.count({
      where: { kategori: current.nama, isDeleted: false },
    });

    if (countUsed > 0) {
      return NextResponse.json(
        {
          error: `Kategori "${current.nama}" tidak dapat dihapus karena masih digunakan oleh ${countUsed} keputusan rapat. Silakan ubah kategori keputusan rapat tersebut terlebih dahulu.`,
        },
        { status: 400 }
      );
    }

    await db.kategoriHasilRapat.delete({
      where: { id },
    });

    return NextResponse.json({ message: `Kategori "${current.nama}" berhasil dihapus` });
  } catch (error) {
    console.error("DELETE /api/kategori-rapat/[id] error:", error);
    return NextResponse.json({ error: "Gagal menghapus kategori" }, { status: 500 });
  }
}
