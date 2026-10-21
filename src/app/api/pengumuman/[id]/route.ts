import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Role, StatusPengumuman } from "@prisma/client";
import { formatToViewOnlyDriveUrl } from "@/lib/drive";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/pengumuman/[id]
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === Role.ADMIN;

    const pengumuman = await prisma.pengumuman.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, email: true, department: true } },
        lampiran: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!pengumuman || pengumuman.isDeleted) {
      return NextResponse.json({ error: "Risalah rapat tidak ditemukan" }, { status: 404 });
    }

    // Karyawan cannot view DRAFT meetings
    if (!isAdmin && pengumuman.status !== StatusPengumuman.PUBLISHED) {
      return NextResponse.json({ error: "Anda tidak memiliki akses ke dokumen draft ini" }, { status: 403 });
    }

    return NextResponse.json({ data: pengumuman });
  } catch (error) {
    console.error("GET /api/pengumuman/[id] error:", error);
    return NextResponse.json({ error: "Gagal mengambil detail rapat" }, { status: 500 });
  }
}

// PUT /api/pengumuman/[id] - Update meeting (Admin only)
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: "Akses ditolak: Hanya Admin yang dapat memperbarui risalah rapat" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      judul,
      nomorRapat,
      tanggalRapat,
      lokasi,
      kategori,
      status,
      isAktif,
      keteranganStatus,
      ringkasan,
      isiKeputusan,
      lampiran,
    } = body;

    const existing = await prisma.pengumuman.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) {
      return NextResponse.json({ error: "Risalah rapat tidak ditemukan" }, { status: 404 });
    }

    // Format new attachments if provided
    let lampiranUpdate: any = undefined;
    if (Array.isArray(lampiran)) {
      // Delete existing attachments and recreate
      await prisma.lampiran.deleteMany({ where: { pengumumanId: id } });

      lampiranUpdate = {
        create: lampiran
          .filter((l: any) => l.namaFile && l.fileUrl)
          .map((l: any) => {
            const { previewUrl, fileId } = formatToViewOnlyDriveUrl(l.fileUrl);
            return {
              namaFile: l.namaFile.trim(),
              fileUrl: previewUrl,
              driveFileId: fileId,
              keterangan: l.keterangan || null,
            };
          }),
      };
    }

    const updated = await prisma.pengumuman.update({
      where: { id },
      data: {
        ...(judul ? { judul: judul.trim() } : {}),
        ...(nomorRapat !== undefined ? { nomorRapat: nomorRapat?.trim() || null } : {}),
        ...(tanggalRapat ? { tanggalRapat: new Date(tanggalRapat) } : {}),
        ...(lokasi !== undefined ? { lokasi: lokasi?.trim() || null } : {}),
        ...(kategori ? { kategori: kategori.trim() } : {}),
        ...(status ? { status: status as StatusPengumuman } : {}),
        ...(isAktif !== undefined ? { isAktif: Boolean(isAktif) } : {}),
        ...(keteranganStatus !== undefined ? { keteranganStatus: keteranganStatus?.trim() || null } : {}),
        ...(ringkasan !== undefined ? { ringkasan: ringkasan?.trim() || null } : {}),
        ...(isiKeputusan ? { isiKeputusan: isiKeputusan.trim() } : {}),
        ...(lampiranUpdate ? { lampiran: lampiranUpdate } : {}),
      },
      include: {
        author: { select: { id: true, name: true } },
        lampiran: true,
      },
    });

    return NextResponse.json({ message: "Risalah rapat berhasil diperbarui", data: updated });
  } catch (error) {
    console.error("PUT /api/pengumuman/[id] error:", error);
    return NextResponse.json({ error: "Gagal memperbarui risalah rapat" }, { status: 500 });
  }
}

// DELETE /api/pengumuman/[id] - Delete meeting (Admin only)
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: "Akses ditolak: Hanya Admin yang dapat menghapus risalah rapat" },
        { status: 403 }
      );
    }

    // Cascade delete pengumuman (attachments will cascade delete due to schema onDelete: Cascade)
    await prisma.pengumuman.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Risalah rapat berhasil dihapus" });
  } catch (error) {
    console.error("DELETE /api/pengumuman/[id] error:", error);
    return NextResponse.json({ error: "Gagal menghapus risalah rapat" }, { status: 500 });
  }
}
