import { PrismaClient, Role, StatusPengumuman, TipeSukuBunga } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database ALCO Papan Rapat & Suku Bunga...");

  // 1. Create Users
  const passwordHash = await bcrypt.hash("admin123", 10);
  const karyawanPasswordHash = await bcrypt.hash("karyawan123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@company.com" },
    update: {
      name: "Robi (Maker)",
    },
    create: {
      email: "admin@company.com",
      name: "Robi (Maker)",
      password: passwordHash,
      role: Role.ADMIN,
      department: "ALCO / Treasury & Manajemen",
    },
  });

  const karyawan = await prisma.user.upsert({
    where: { email: "karyawan@company.com" },
    update: {},
    create: {
      email: "karyawan@company.com",
      name: "Budi Santoso (Viewer)",
      password: karyawanPasswordHash,
      role: Role.KARYAWAN,
      department: "Pemasaran & Operasional Cabang",
    },
  });

  console.log(`Users verified: ${admin.email} (ADMIN/MAKER), ${karyawan.email} (VIEWER)`);

  // 2. Clear & Seed KategoriHasilRapat
  const defaultKategori = [
    { nama: "ALCO / Treasury", deskripsi: "Keputusan terkait suku bunga acuan, likuiditas, dan pasar uang", urutan: 1 },
    { nama: "Kredit & Risiko", deskripsi: "Kebijakan portofolio kredit, plafon, NPL, dan manajemen risiko", urutan: 2 },
    { nama: "Manajemen & Bisnis", deskripsi: "Arah strategis perusahaan, target laba, dan ekspansi pasar", urutan: 3 },
    { nama: "Operasional Cabang", deskripsi: "SOP layanan cabang, kepatuhan, dan efisiensi operasional", urutan: 4 },
    { nama: "SDM & Umum", deskripsi: "Pengembangan talenta, remunerasi, dan tata kelola internal", urutan: 5 },
  ];

  for (const kat of defaultKategori) {
    await prisma.kategoriHasilRapat.upsert({
      where: { nama: kat.nama },
      update: { deskripsi: kat.deskripsi, urutan: kat.urutan },
      create: kat,
    });
  }
  console.log("KategoriHasilRapat seeded.");

  // 3. Clear & Seed Pengumuman ALCO
  await prisma.lampiran.deleteMany();
  await prisma.pengumuman.deleteMany();

  const isiKeputusan1 = `Berdasarkan hasil rapat komite ALCO kuartal III 2026, Komite menyepakati target alokasi likuiditas, batas maksimal penyaluran kredit produktif, dan penetapan suku bunga acuan baru bagi seluruh unit kerja dan kantor cabang.

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exxand niamon exermitat nisl ut aliquip oquot consequis nosusa oci commodo consequat.

### Target & Realisasi Anggaran Divisi Q3
| Divisi | Target (Miliar IDR) | Realisasi (Miliar IDR) | Pencapaian (%) | Status |
| :--- | :--- | :--- | :--- | :--- |
| Divisi Komersial & Korporasi | 120 | 96.0 | 80% | On Track |
| Divisi UMKM & Retail | 150 | 105.0 | 70% | Memerlukan Akselerasi |
| Divisi Konsumer & KPR | 150 | 75.0 | 50% | Penyesuaian Program |
| Divisi Treasury & ALCO | 50 | 50.0 | 100% | Target Tercapai |

Komite juga menegaskan kewajiban bagi seluruh pimpinan kantor wilayah untuk meningkatkan rasio dana murah (CASA) serta menjaga tingkat Loan to Deposit Ratio (LDR) pada kisaran 82% hingga 88% sesuai batas aman regulasi OJK dan Bank Indonesia.

Pelaksanaan monitoring portofolio kredit berisiko tinggi wajib dilaporkan secara mingguan ke Komite Risiko dan ALCO guna mengantisipasi volatilitas suku bunga global.

### Rencana Alokasi Likuiditas Antar Cabang
| Wilayah Operasional | Likuiditas Minimum (Miliar IDR) | Batas Maksimum Penyaluran |
| :--- | :--- | :--- |
| Wilayah I (Jakarta Pusat & Barat) | 250 | 85% |
| Wilayah II (Jawa Barat & Banten) | 180 | 80% |
| Wilayah III (Jawa Tengah & Timur) | 200 | 82% |
| Wilayah Luar Jawa | 120 | 75% |

Seluruh ketetapan ini berlaku efektif terhitung sejak tanggal penetapan sampai dengan adanya evaluasi berkala pada kuartal berikutnya.`;

  // Decision 1 (Utama)
  await prisma.pengumuman.create({
    data: {
      judul: "Hasil Keputusan Rapat - Evaluasi Kinerja & Anggaran Q3 2026",
      nomorRapat: "ALCO/BA/2026/XII/020",
      tanggalRapat: new Date("2026-12-20T10:00:00Z"),
      lokasi: "Boardroom Utama Lt. 8 & Zoom Teleconference",
      kategori: "ALCO / Treasury",
      status: StatusPengumuman.PUBLISHED,
      isAktif: true,
      ringkasan: "Evaluasi kinerja keuangan dan penetapan target serta realisasi anggaran per divisi Q3 2026.",
      isiKeputusan: isiKeputusan1,
      authorId: admin.id,
      lampiran: {
        create: [
          {
            namaFile: "Dokumen_Hasil_Keputusan_Rapat_Q3_2026_Signed.pdf",
            fileUrl: "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/preview",
            driveFileId: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs",
            keterangan: "Dokumen Asli (Google Drive Share - Hanya Lihat)",
          },
        ],
      },
    },
  });

  // Tambahkan keputusan 2 hingga 22 untuk menguji fitur pagination (> 20 halaman selanjutnya)
  for (let i = 2; i <= 22; i++) {
    const padded = String(i).padStart(2, "0");
    await prisma.pengumuman.create({
      data: {
        judul: `Risalah Keputusan ALCO No. ${padded} - Pengelolaan Likuiditas dan Kebijakan Portofolio`,
        nomorRapat: `ALCO/BA/2026/XI/${padded}`,
        tanggalRapat: new Date(Date.now() - (i * 86400000 * 3)),
        lokasi: "Boardroom Utama Lt. 8",
        kategori: i % 2 === 0 ? "ALCO / Treasury" : "Kredit & Risiko",
        status: StatusPengumuman.PUBLISHED,
        isAktif: true,
        ringkasan: `Ringkasan risalah evaluasi kebijakan komite ALCO periode minggu ke-${i} tahun 2026.`,
        isiKeputusan: `Komite ALCO menetapkan arahan kebijakan lanjutan No. ${padded} terkait pemantauan eksposur risiko pasar dan mitigasi suku bunga acuan.\n\n### Parameter Monitoring ALCO\n| Parameter | Batas Toleransi | Posisi Terkini |\n| :--- | :--- | :--- |\n| Liquidity Coverage Ratio (LCR) | Min. 100% | 134.5% |\n| Net Stable Funding Ratio (NSFR) | Min. 100% | 112.8% |\n\nEvaluasi akan dilakukan secara berkala pada pertemuan komite mingguan mendatang.`,
        authorId: admin.id,
      },
    });
  }

  // Risalah Non-Aktif (Arsip)
    const isiKeputusanArsip = `### Keputusan Lama Terkait Suku Bunga Q3 2026
Keputusan ini telah digantikan oleh Risalah Rapat ALCO No. ALCO/BA/2026/X/014 tertanggal 15 Oktober 2026.

| Parameter | Besaran Q3 | Status |
| :--- | :--- | :--- |
| Deposito 1 Bulan | 4.25% p.a. | Diperbarui |
| KPR Promo Q3 | 6.50% p.a. | Diperbarui |`;

    await prisma.pengumuman.create({
      data: {
        judul: "Risalah ALCO Q3 - Kebijakan Suku Bunga Periode Juli - September 2026",
        nomorRapat: "ALCO/BA/2026/VII/008",
        tanggalRapat: new Date("2026-07-10T10:00:00Z"),
        lokasi: "Boardroom Utama",
        kategori: "ALCO / Treasury",
        status: StatusPengumuman.PUBLISHED,
        isAktif: false,
        keteranganStatus: "Diperbarui oleh Risalah Rapat ALCO No. ALCO/BA/2026/X/014",
        ringkasan: "Penetapan suku bunga acuan periode Q3 2026 (Kini telah non-aktif / arsip).",
        isiKeputusan: isiKeputusanArsip,
        authorId: admin.id,
      },
    });
    console.log("Pengumuman rapat ALCO seeded.");

    // 3. Clear & Seed Relational Suku Bunga (JenisBunga -> KategoriBunga -> ProdukBunga)
  await prisma.produkBunga.deleteMany();
  await prisma.kategoriBunga.deleteMany();
  await prisma.jenisBunga.deleteMany();

  // 3.1. Jenis Konvensional
  const jenisKonven = await prisma.jenisBunga.create({
    data: {
      kode: TipeSukuBunga.KONVENSIONAL,
      nama: "Konvensional",
      deskripsi: "Suku bunga acuan kredit dan simpanan perbankan konvensional.",
      urutan: 1,
    },
  });

  // 3.2. Jenis Syariah
  const jenisSyariah = await prisma.jenisBunga.create({
    data: {
      kode: TipeSukuBunga.SYARIAH,
      nama: "Syariah",
      deskripsi: "Nisbah bagi hasil, margin murabahah, dan ujrah simpanan serta pembiayaan syariah.",
      urutan: 2,
    },
  });

  // Kategori & Produk: Konvensional
  // A. Kredit Produktif
  const katKreditProduktif = await prisma.kategoriBunga.create({
    data: {
      jenisId: jenisKonven.id,
      nama: "Kredit Produktif",
      slug: "kredit-produktif",
      deskripsi: "Suku Bunga Dasar Kredit (SBDK) sektor produktif, komersial, dan UMKM.",
      urutan: 1,
      produk: {
        create: [
          {
            nama: "Kredit Produktif",
            rate: "2.5% p.a.",
            tenorTiering: "1 - 3 Tahun",
            saldoMinimal: "Plafon mulai Rp 100 Juta",
            keterangan: "Ditinjau berkala per semester sesuai ALCO",
            isActive: true,
            urutan: 1,
          },
          {
            nama: "Kredit Modal Kerja Berjangka (KMKB)",
            rate: "8.50% p.a.",
            tenorTiering: "1 - 5 Tahun",
            saldoMinimal: "Plafon mulai Rp 250 Juta",
            keterangan: "Pembayaran bunga bulanan, pokok bertahap",
            isActive: true,
            urutan: 2,
          },
        ],
      },
    },
  });

  // B. Kredit Konsumtif
  const katKreditKonsumtif = await prisma.kategoriBunga.create({
    data: {
      jenisId: jenisKonven.id,
      nama: "Kredit Konsumtif",
      slug: "kredit-konsumtif",
      deskripsi: "Suku bunga pembiayaan konsumsi perorangan, KPR, KKB, dan pinjaman multiguna.",
      urutan: 2,
      produk: {
        create: [
          {
            nama: "KPR Griya Prima (Developer Rekanan)",
            rate: "5.99% p.a.",
            tenorTiering: "Fixed 1 Tahun (Tenor min 10 Thn)",
            saldoMinimal: "Plafon s.d Rp 5 Miliar",
            keterangan: "Promo Q4, sesudah periode fixed berlaku SBDK + 2.5%",
            isActive: true,
            urutan: 1,
          },
        ],
      },
    },
  });

  // C. Tabungan
  const katTabungan = await prisma.kategoriBunga.create({
    data: {
      jenisId: jenisKonven.id,
      nama: "Tabungan",
      slug: "tabungan",
      deskripsi: "Suku bunga simpanan tabungan perorangan dan non-perorangan berjenjang (tiering).",
      urutan: 3,
      produk: {
        create: [
          {
            nama: "Tabungan Simpedes",
            rate: "2.5% p.a.",
            tenorTiering: "Saldo > Rp 100 Juta",
            saldoMinimal: "Setoran awal Rp 100.000",
            keterangan: "Bunga harian dikreditkan di akhir bulan",
            isActive: true,
            urutan: 1,
          },
          {
            nama: "Tabungan Britama",
            rate: "3.0% p.a.",
            tenorTiering: "Saldo >= Rp 50 Juta",
            saldoMinimal: "Setoran awal Rp 500.000",
            keterangan: "Fasilitas transfer & e-banking",
            isActive: true,
            urutan: 2,
          },
        ],
      },
    },
  });

  // D. Deposito
  const katDeposito = await prisma.kategoriBunga.create({
    data: {
      jenisId: jenisKonven.id,
      nama: "Deposito",
      slug: "deposito",
      deskripsi: "Suku bunga simpanan berjangka Rupiah acuan rapat komite ALCO.",
      urutan: 4,
      produk: {
        create: [
          {
            nama: "Deposito",
            rate: "4.8% p.a.",
            tenorTiering: "1 Bulan",
            saldoMinimal: "Min. Rp 10.000.000",
            keterangan: "ARO Pokok / ARO Pokok + Bunga ke rekening tabungan",
            isActive: true,
            urutan: 1,
          },
          {
            nama: "Deposito Berjangka 3 Bulan",
            rate: "5.00% p.a.",
            tenorTiering: "3 Bulan",
            saldoMinimal: "Min. Rp 10.000.000",
            keterangan: "Dapat dijadikan jaminan kredit back-to-back (cash collateral)",
            isActive: true,
            urutan: 2,
          },
          {
            nama: "Deposito Berjangka 6 Bulan",
            rate: "5.25% p.a.",
            tenorTiering: "6 Bulan",
            saldoMinimal: "Min. Rp 10.000.000",
            keterangan: "Penarikan sebelum jatuh tempo dikenakan ketentuan ALCO",
            isActive: true,
            urutan: 3,
          },
          {
            nama: "Deposito Berjangka 12 Bulan",
            rate: "5.50% p.a.",
            tenorTiering: "12 Bulan",
            saldoMinimal: "Min. Rp 10.000.000",
            keterangan: "Maksimal di bawah tingkat bunga penjaminan LPS",
            isActive: true,
            urutan: 4,
          },
          {
            nama: "Special Rate Deposito ALCO",
            rate: "5.75% p.a.",
            tenorTiering: "3 & 6 Bulan",
            saldoMinimal: "Min. Rp 1.000.000.000 (>= 1 M)",
            keterangan: "Wajib disposisi tertulis persetujuan Ketua ALCO",
            isActive: true,
            urutan: 5,
          },
        ],
      },
    },
  });

  // E. Giro
  const katGiro = await prisma.kategoriBunga.create({
    data: {
      jenisId: jenisKonven.id,
      nama: "Giro",
      slug: "giro",
      deskripsi: "Jasa giro simpanan transaksi operasional korporasi dan institusi.",
      urutan: 5,
      produk: {
        create: [
          {
            nama: "Giro",
            rate: "4.8% p.a.",
            tenorTiering: "Saldo < Rp 100 Juta",
            saldoMinimal: "Setoran awal Rp 1.000.000",
            keterangan: "Disediakan fasilitas buku cek dan bilyet giro",
            isActive: true,
            urutan: 1,
          },
          {
            nama: "Giro Rupiah Korporasi",
            rate: "1.75% p.a.",
            tenorTiering: "Saldo Rp 100 Jt s.d < Rp 1 M",
            saldoMinimal: "Setoran awal Rp 5.000.000",
            keterangan: "Didukung Corporate Internet Banking & Cash Management System",
            isActive: true,
            urutan: 2,
          },
          {
            nama: "Giro Rupiah Korporasi Utama",
            rate: "2.50% p.a.",
            tenorTiering: "Saldo >= Rp 1 Miliar",
            saldoMinimal: "Transaksi volume tinggi",
            keterangan: "Layanan sweeping saldo otomatis multi-rekening",
            isActive: true,
            urutan: 3,
          },
        ],
      },
    },
  });

  // Kategori & Produk: Syariah
  // A. Pembiayaan Produktif Syariah
  const katPembiayaanSyariah = await prisma.kategoriBunga.create({
    data: {
      jenisId: jenisSyariah.id,
      nama: "Pembiayaan Produktif",
      slug: "pembiayaan-produktif-syariah",
      deskripsi: "Margin murabahah dan nisbah bagi hasil musyarakah/mudharabah sektor riil.",
      urutan: 1,
      produk: {
        create: [
          {
            nama: "Pembiayaan Modal Kerja Murabahah",
            rate: "Margin Eq. 9.00% p.a.",
            tenorTiering: "1 - 3 Tahun",
            saldoMinimal: "Plafon min Rp 200 Juta",
            keterangan: "Akad jual beli dengan angsuran pasti setiap bulan",
            isActive: true,
            urutan: 1,
          },
          {
            nama: "Pembiayaan Modal Kerja Musyarakah",
            rate: "Nisbah Nasabah:Bank = 45 : 55",
            tenorTiering: "1 Tahun (Review berkala)",
            saldoMinimal: "Plafon min Rp 500 Juta",
            keterangan: "Bagi hasil riil berdasarkan omzet pendapatan mitra usaha",
            isActive: true,
            urutan: 2,
          },
          {
            nama: "Pembiayaan Investasi Ijarah Muntahiya Bittamlik (IMBT)",
            rate: "Ujrah Eq. 8.75% p.a.",
            tenorTiering: "3 - 7 Tahun",
            saldoMinimal: "Plafon min Rp 1 Miliar",
            keterangan: "Sewa beli barang modal dengan pengalihan kepemilikan di akhir",
            isActive: true,
            urutan: 3,
          },
        ],
      },
    },
  });

  // B. Tabungan & Deposito Syariah
  const katSimpananSyariah = await prisma.kategoriBunga.create({
    data: {
      jenisId: jenisSyariah.id,
      nama: "Tabungan & Deposito Syariah",
      slug: "tabungan-deposito-syariah",
      deskripsi: "Nisbah bagi hasil simpanan mudharabah dan bonus tabungan wadiah.",
      urutan: 2,
      produk: {
        create: [
          {
            nama: "Tabungan Mudharabah Barakah",
            rate: "Nisbah 22 : 78 (Eq. 2.45%)",
            tenorTiering: "Bulanan (Tiering Saldo > Rp 10 Jt)",
            saldoMinimal: "Min. Rp 100.000",
            keterangan: "Bebas biaya administrasi rekening bulanan",
            isActive: true,
            urutan: 1,
          },
          {
            nama: "Tabungan Wadiah Amanah",
            rate: "Bonus Wadiah Bulanan",
            tenorTiering: "Simpanan titipan murni",
            saldoMinimal: "Min. Rp 50.000",
            keterangan: "Dapat ditarik sewaktu-waktu tanpa potongan",
            isActive: true,
            urutan: 2,
          },
          {
            nama: "Deposito Mudharabah 1 Bulan",
            rate: "Nisbah 42 : 58 (Eq. 4.60%)",
            tenorTiering: "1 Bulan",
            saldoMinimal: "Min. Rp 10.000.000",
            keterangan: "Investasi terikat akad Mudharabah Muthlaqah",
            isActive: true,
            urutan: 3,
          },
          {
            nama: "Deposito Mudharabah 3 Bulan",
            rate: "Nisbah 46 : 54 (Eq. 5.10%)",
            tenorTiering: "3 Bulan",
            saldoMinimal: "Min. Rp 10.000.000",
            keterangan: "Bagi hasil ditransfer ke tabungan atau di-rollover",
            isActive: true,
            urutan: 4,
          },
          {
            nama: "Deposito Mudharabah 6 Bulan",
            rate: "Nisbah 50 : 50 (Eq. 5.40%)",
            tenorTiering: "6 Bulan",
            saldoMinimal: "Min. Rp 10.000.000",
            keterangan: "Nisbah berimbang untuk penempatan jangka menengah",
            isActive: true,
            urutan: 5,
          },
        ],
      },
    },
  });

  console.log("Database seeded successfully with dynamic relational JenisBunga -> KategoriBunga -> ProdukBunga!");
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
