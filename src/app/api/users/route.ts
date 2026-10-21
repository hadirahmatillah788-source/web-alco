import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET /api/users - Mengambil daftar seluruh viewer & admin (Hanya Admin)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: "Akses ditolak: Hanya Admin/Maker yang dapat mengakses data pengguna" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("q") || "";
    const roleParam = searchParams.get("role") || "";

    const whereClause: any = {};
    if (search.trim()) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { department: { contains: search, mode: "insensitive" } },
      ];
    }

    if (roleParam === "KARYAWAN" || roleParam === "ADMIN") {
      whereClause.role = roleParam as Role;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { pengumuman: true },
        },
      },
      orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({
      success: true,
      data: users,
      total: users.length,
    });
  } catch (error: any) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ error: "Gagal mengambil data pengguna: " + error.message }, { status: 500 });
  }
}

// POST /api/users - Tambah Viewer / User Baru (Hanya Admin)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: "Akses ditolak: Hanya Admin/Maker yang dapat menambahkan pengguna baru" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, password, role, department, isActive } = body;

    // Validasi input
    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json(
        { error: "Nama lengkap, alamat email, dan kata sandi wajib diisi" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Kata sandi minimal harus 6 karakter" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Cek apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: `Alamat email "${cleanEmail}" sudah terdaftar dalam sistem` },
        { status: 409 }
      );
    }

    // Hash kata sandi dengan bcryptjs
    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        password: passwordHash,
        role: role === "ADMIN" ? Role.ADMIN : Role.KARYAWAN,
        department: department?.trim() || "Pemasaran & Operasional Cabang",
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Pengguna baru berhasil ditambahkan",
        data: newUser,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/users error:", error);
    return NextResponse.json({ error: "Gagal membuat pengguna baru: " + error.message }, { status: 500 });
  }
}
