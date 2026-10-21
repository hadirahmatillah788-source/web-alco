import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

// PUT /api/suku-bunga/produk/[id] - Edit Produk atau Toggle Status Aktif (Maker)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Akses ditolak: Hanya Maker yang dapat mengubah produk suku bunga" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { nama, rate, tenorTiering, saldoMinimal, keterangan, isActive, urutan, kategoriId } = body;

    const dataToUpdate: any = {};
    if (nama !== undefined) dataToUpdate.nama = nama.trim();
    if (rate !== undefined) dataToUpdate.rate = rate.trim();
    if (tenorTiering !== undefined) dataToUpdate.tenorTiering = tenorTiering?.trim() || null;
    if (saldoMinimal !== undefined) dataToUpdate.saldoMinimal = saldoMinimal?.trim() || null;
    if (keterangan !== undefined) dataToUpdate.keterangan = keterangan?.trim() || null;
    if (isActive !== undefined) dataToUpdate.isActive = Boolean(isActive);
    if (urutan !== undefined) dataToUpdate.urutan = Number(urutan);
    if (kategoriId !== undefined) dataToUpdate.kategoriId = kategoriId;

    const updated = await prisma.produkBunga.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PUT /api/suku-bunga/produk/[id] error:", error);
    return NextResponse.json({ error: "Gagal memperbarui produk: " + error.message }, { status: 500 });
  }
}

// DELETE /api/suku-bunga/produk/[id] - Hapus Produk (atau Soft Delete via query ?soft=true)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Akses ditolak: Hanya Maker yang dapat menghapus produk suku bunga" }, { status: 403 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const soft = searchParams.get("soft") === "true";

    if (soft) {
      // Soft delete: tandai isActive = false
      const deactivated = await prisma.produkBunga.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({ success: true, message: "Produk dinonaktifkan", data: deactivated });
    } else {
      // Hard delete
      await prisma.produkBunga.delete({
        where: { id },
      });
      return NextResponse.json({ success: true, message: "Produk berhasil dihapus permanen" });
    }
  } catch (error: any) {
    console.error("DELETE /api/suku-bunga/produk/[id] error:", error);
    return NextResponse.json({ error: "Gagal menghapus produk: " + error.message }, { status: 500 });
  }
}
