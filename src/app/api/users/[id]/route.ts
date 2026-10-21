import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

// PUT /api/users/[id] - Edit Data Viewer / User (Hanya Admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: "Akses ditolak: Hanya Admin/Maker yang dapat mengedit data pengguna" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { name, email, password, role, department, isActive } = body;

    // Cek keberadaan user
    const targetUser = await prisma.user.findUnique({
      where: { id },
    });
    if (!targetUser) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name.trim();
    if (department !== undefined) dataToUpdate.department = department?.trim() || null;
    if (role !== undefined) dataToUpdate.role = role === "ADMIN" ? Role.ADMIN : Role.KARYAWAN;
    if (isActive !== undefined) dataToUpdate.isActive = Boolean(isActive);

    // Jika email diubah, pastikan tidak duplikat dengan akun lain
    if (email && email.toLowerCase().trim() !== targetUser.email) {
      const emailLower = email.toLowerCase().trim();
      const existingEmail = await prisma.user.findUnique({
        where: { email: emailLower },
      });
      if (existingEmail && existingEmail.id !== id) {
        return NextResponse.json(
          { error: `Alamat email "${emailLower}" sudah digunakan oleh akun lain` },
          { status: 409 }
        );
      }
      dataToUpdate.email = emailLower;
    }

    // Jika admin mengisi kata sandi baru (Reset Password)
    if (password && password.trim().length > 0) {
      if (password.trim().length < 6) {
        return NextResponse.json(
          { error: "Kata sandi baru minimal harus 6 karakter" },
          { status: 400 }
        );
      }
      dataToUpdate.password = await bcrypt.hash(password.trim(), 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Data pengguna berhasil diperbarui",
      data: updatedUser,
    });
  } catch (error: any) {
    console.error("PUT /api/users/[id] error:", error);
    return NextResponse.json({ error: "Gagal memperbarui pengguna: " + error.message }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Hapus Pengguna (Hanya Admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: "Akses ditolak: Hanya Admin/Maker yang dapat menghapus pengguna" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Cegah admin menghapus dirinya sendiri
    if (session.user.id === id) {
      return NextResponse.json(
        { error: "Anda tidak dapat menghapus akun Anda sendiri saat sedang masuk" },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });
    if (!targetUser) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Pengguna "${targetUser.name}" (${targetUser.email}) berhasil dihapus`,
    });
  } catch (error: any) {
    console.error("DELETE /api/users/[id] error:", error);
    return NextResponse.json({ error: "Gagal menghapus pengguna: " + error.message }, { status: 500 });
  }
}
