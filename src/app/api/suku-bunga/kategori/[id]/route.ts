import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

// PUT /api/suku-bunga/kategori/[id] - Edit Kategori
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Akses ditolak: Hanya Maker yang dapat mengubah kategori" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { nama, deskripsi, urutan } = body;

    const updated = await prisma.kategoriBunga.update({
      where: { id },
      data: {
        nama: nama?.trim(),
        deskripsi: deskripsi !== undefined ? (deskripsi?.trim() || null) : undefined,
        urutan: urutan !== undefined ? Number(urutan) : undefined,
      },
      include: {
        produk: true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PUT /api/suku-bunga/kategori/[id] error:", error);
    return NextResponse.json({ error: "Gagal memperbarui kategori: " + error.message }, { status: 500 });
  }
}

// DELETE /api/suku-bunga/kategori/[id] - Hapus Kategori beserta produknya
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Akses ditolak: Hanya Maker yang dapat menghapus kategori" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.kategoriBunga.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Kategori berhasil dihapus" });
  } catch (error: any) {
    console.error("DELETE /api/suku-bunga/kategori/[id] error:", error);
    return NextResponse.json({ error: "Gagal menghapus kategori: " + error.message }, { status: 500 });
  }
}
