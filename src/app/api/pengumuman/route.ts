import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { StatusPengumuman, Role } from "@prisma/client";
import { formatToViewOnlyDriveUrl } from "@/lib/drive";

export const dynamic = "force-dynamic";

// GET /api/pengumuman - List meetings with pagination, filter, search, and active/inactive status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const searchParams = request.nextUrl.searchParams;

    const query = searchParams.get("q") || "";
    const kategori = searchParams.get("kategori") || "";
    const tahunParam = searchParams.get("tahun") || "";
    const requestedStatus = searchParams.get("status") || "";
    const isAktifParam = searchParams.get("isAktif"); // "true" | "false" | "all"
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const isAdmin = session?.user?.role === Role.ADMIN;

    // Filter status: Karyawan can only see PUBLISHED
    let statusFilter: StatusPengumuman | undefined = undefined;
    if (isAdmin && requestedStatus && Object.values(StatusPengumuman).includes(requestedStatus as StatusPengumuman)) {
      statusFilter = requestedStatus as StatusPengumuman;
    } else if (!isAdmin) {
      statusFilter = StatusPengumuman.PUBLISHED;
    }

    // Filter active/inactive
    let isAktifFilter: boolean | undefined = undefined;
    if (isAktifParam === "true") isAktifFilter = true;
    if (isAktifParam === "false") isAktifFilter = false;

    // Filter tahun (menyamakan tahun yang sudah terdata di database)
    let dateFilter: any = undefined;
    if (tahunParam && tahunParam !== "Semua") {
      const yearNum = parseInt(tahunParam);
      if (!isNaN(yearNum)) {
        dateFilter = {
          gte: new Date(Date.UTC(yearNum, 0, 1, 0, 0, 0)),
          lte: new Date(Date.UTC(yearNum, 11, 31, 23, 59, 59, 999)),
        };
      }
    }

    const whereClause: any = {
      isDeleted: false,
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(isAktifFilter !== undefined ? { isAktif: isAktifFilter } : {}),
      ...(kategori && kategori !== "Semua" ? { kategori } : {}),
      ...(dateFilter ? { tanggalRapat: dateFilter } : {}),
      ...(query
        ? {
            OR: [
              { judul: { contains: query, mode: "insensitive" } },
              { nomorRapat: { contains: query, mode: "insensitive" } },
              { ringkasan: { contains: query, mode: "insensitive" } },
              { isiKeputusan: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, data, distinctDates] = await Promise.all([
      prisma.pengumuman.count({ where: whereClause }),
      prisma.pengumuman.findMany({
        where: whereClause,
        include: {
          author: {
            select: { id: true, name: true, email: true, department: true },
          },
          lampiran: {
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { tanggalRapat: "desc" },
        skip,
        take: limit,
      }),
      // Ambil seluruh tahun yang ada pada keputusan rapat yang tidak dihapus
      prisma.pengumuman.findMany({
        where: {
          isDeleted: false,
          ...(isAdmin ? {} : { status: StatusPengumuman.PUBLISHED }),
        },
        select: { tanggalRapat: true },
        orderBy: { tanggalRapat: "desc" },
      }),
    ]);

    const availableYears = Array.from(
      new Set(distinctDates.map((item) => new Date(item.tanggalRapat).getFullYear()))
    ).sort((a, b) => b - a);

    return NextResponse.json({
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      availableYears,
    });
  } catch (error) {
    console.error("GET /api/pengumuman error:", error);
    return NextResponse.json({ error: "Gagal mengambil data pengumuman" }, { status: 500 });
  }
}

// POST /api/pengumuman - Create new meeting announcement (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: "Akses ditolak: Hanya Admin yang dapat membuat risalah rapat" },
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

    if (!judul || !tanggalRapat || !isiKeputusan || !kategori) {
      return NextResponse.json(
        { error: "Judul, tanggal rapat, kategori, dan isi keputusan wajib diisi" },
        { status: 400 }
      );
    }

    // Process Google Drive links for attachments
    const formattedLampiran = Array.isArray(lampiran)
      ? lampiran
          .filter((l: any) => l.namaFile && l.fileUrl)
          .map((l: any) => {
            const { previewUrl, fileId } = formatToViewOnlyDriveUrl(l.fileUrl);
            return {
              namaFile: l.namaFile.trim(),
              fileUrl: previewUrl,
              driveFileId: fileId,
              keterangan: l.keterangan || null,
            };
          })
      : [];

    const newPengumuman = await prisma.pengumuman.create({
      data: {
        judul: judul.trim(),
        nomorRapat: nomorRapat?.trim() || null,
        tanggalRapat: new Date(tanggalRapat),
        lokasi: lokasi?.trim() || null,
        kategori: kategori.trim(),
        status: status === "PUBLISHED" ? StatusPengumuman.PUBLISHED : StatusPengumuman.DRAFT,
        isAktif: isAktif !== undefined ? Boolean(isAktif) : true,
        keteranganStatus: keteranganStatus?.trim() || null,
        ringkasan: ringkasan?.trim() || null,
        isiKeputusan: isiKeputusan.trim(),
        authorId: session.user.id,
        lampiran: {
          create: formattedLampiran,
        },
      },
      include: {
        author: { select: { id: true, name: true } },
        lampiran: true,
      },
    });

    return NextResponse.json({ message: "Risalah rapat berhasil dibuat", data: newPengumuman }, { status: 201 });
  } catch (error) {
    console.error("POST /api/pengumuman error:", error);
    return NextResponse.json({ error: "Gagal membuat pengumuman rapat" }, { status: 500 });
  }
}
