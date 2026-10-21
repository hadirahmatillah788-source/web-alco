import { PrismaClient, StatusPengumuman } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) return;

  // Check if historical meeting exists
  const exists = await prisma.pengumuman.findFirst({
    where: { nomorRapat: "ALCO/BA/2026/VII/008" },
  });

  if (!exists) {
    await prisma.pengumuman.create({
      data: {
        judul: "Risalah Rapat Komite ALCO Q3 - Penetapan Suku Bunga Acuan DPK Periode Juli - September 2026",
        nomorRapat: "ALCO/BA/2026/VII/008",
        tanggalRapat: new Date("2026-07-15T09:00:00Z"),
        lokasi: "Boardroom Lt. 8",
        kategori: "ALCO / Treasury",
        status: StatusPengumuman.PUBLISHED,
        isAktif: false, // NON-AKTIF / Telah Diperbarui
        keteranganStatus: "Telah diperbarui oleh Risalah Rapat Komite ALCO No. ALCO/BA/2026/X/014 (Efektif 1 Nov 2026)",
        ringkasan: "Penetapan suku bunga DPK periode Q3 2026 (status: TIDAK BERLAKU LAGI / Digantikan oleh tarif Q4).",
        isiKeputusan: `### Status Ketetapan: TIDAK BERLAKU
> **PEMBERITAHUAN:** Seluruh keputusan suku bunga dalam risalah ini telah **TIDAK AKTIF** dan diperbarui oleh **Ketetapan Komite ALCO No. ALCO/BA/2026/X/014** tanggal 15 Oktober 2026.

### Matriks Suku Bunga Masa Berlaku Q3 2026 (Historis)
| Segmen Produk | Tenor / Tiering | Suku Bunga Lama (Q2) | Suku Bunga Q3 (Lama) | Masa Berlaku |
| :--- | :--- | :--- | :--- | :--- |
| Deposito Rupiah | 1 Bulan | 4.00% p.a. | 4.25% p.a. | 01 Jul - 31 Okt 2026 |
| Deposito Rupiah | 3 Bulan | 4.50% p.a. | 4.75% p.a. | 01 Jul - 31 Okt 2026 |
| Tabungan Bisnis Prima | Tiering > 500 Jt | 2.25% p.a. | 2.50% p.a. | 01 Jul - 31 Okt 2026 |

*Dokumen ini disimpan sebagai arsip historis audit komite.*`,
        authorId: admin.id,
        lampiran: {
          create: [
            {
              namaFile: "Arsip_Risalah_ALCO_Q3_2026.pdf",
              fileUrl: "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/preview",
              driveFileId: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs",
              keterangan: "Dokumen Arsip Historis (Mode Hanya Lihat)",
            },
          ],
        },
      },
    });
    console.log("Historical non-active meeting created.");
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
