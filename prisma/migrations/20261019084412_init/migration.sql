-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'KARYAWAN');

-- CreateEnum
CREATE TYPE "StatusPengumuman" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TipeSukuBunga" AS ENUM ('KONVENSIONAL', 'SYARIAH');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'KARYAWAN',
    "department" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pengumuman" (
    "id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "nomorRapat" TEXT,
    "tanggalRapat" TIMESTAMP(3) NOT NULL,
    "lokasi" TEXT,
    "kategori" TEXT NOT NULL,
    "status" "StatusPengumuman" NOT NULL DEFAULT 'DRAFT',
    "ringkasan" TEXT,
    "isiKeputusan" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "pengumuman_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lampiran" (
    "id" TEXT NOT NULL,
    "namaFile" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "driveFileId" TEXT,
    "keterangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pengumumanId" TEXT NOT NULL,

    CONSTRAINT "lampiran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_tab_produk" (
    "id" TEXT NOT NULL,
    "tipe" "TipeSukuBunga" NOT NULL DEFAULT 'KONVENSIONAL',
    "nama" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "deskripsi" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sub_tab_produk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "baris_suku_bunga" (
    "id" TEXT NOT NULL,
    "subTabId" TEXT NOT NULL,
    "namaProduk" TEXT NOT NULL,
    "tenorTiering" TEXT NOT NULL,
    "ratePersen" TEXT NOT NULL,
    "saldoMinimal" TEXT,
    "keterangan" TEXT,
    "tanggalBerlaku" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "baris_suku_bunga_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "pengumuman_tanggalRapat_idx" ON "pengumuman"("tanggalRapat");

-- CreateIndex
CREATE INDEX "pengumuman_kategori_idx" ON "pengumuman"("kategori");

-- CreateIndex
CREATE INDEX "pengumuman_status_idx" ON "pengumuman"("status");

-- CreateIndex
CREATE UNIQUE INDEX "sub_tab_produk_tipe_slug_key" ON "sub_tab_produk"("tipe", "slug");

-- AddForeignKey
ALTER TABLE "pengumuman" ADD CONSTRAINT "pengumuman_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lampiran" ADD CONSTRAINT "lampiran_pengumumanId_fkey" FOREIGN KEY ("pengumumanId") REFERENCES "pengumuman"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baris_suku_bunga" ADD CONSTRAINT "baris_suku_bunga_subTabId_fkey" FOREIGN KEY ("subTabId") REFERENCES "sub_tab_produk"("id") ON DELETE CASCADE ON UPDATE CASCADE;
